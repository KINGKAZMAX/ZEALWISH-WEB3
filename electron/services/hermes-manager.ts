import { spawn as spawnChildProcess, spawnSync } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { HermesRuntimeStatus } from "../../src/types";

const DEFAULT_HERMES_BASE_URL = "http://127.0.0.1:8642";
const DEFAULT_HEALTH_PATH = "/health";
const DEFAULT_HERMES_ARGS = ["gateway", "run", "--replace"];
const DEFAULT_HEALTH_INTERVAL_MS = 5_000;
const DEFAULT_HEALTH_FAILURE_THRESHOLD = 3;
const DEFAULT_RESTART_BASE_DELAY_MS = 1_000;
const DEFAULT_RESTART_MAX_DELAY_MS = 30_000;
const DEFAULT_STOP_TIMEOUT_MS = 5_000;
const PRESTART_STOP_TIMEOUT_MS = 5_000;
const MAX_PROCESS_OUTPUT_LENGTH = 4_000;
const MIN_HEALTH_INTERVAL_MS = 100;
const MIN_HEALTH_FAILURE_THRESHOLD = 1;
const MIN_DELAY_MS = 0;
const MIN_STOP_TIMEOUT_MS = 0;

type HermesExitMode = "stop" | "restart" | null;
type HermesStatusListener = (status: HermesRuntimeStatus) => void;
type HermesEnv = Record<string, string | undefined>;
type HermesChildProcess = ChildProcess & {
  kill(signal?: NodeJS.Signals | number): boolean;
};
type HermesLaunchConfig = {
  executablePath: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

interface HermesManagerDependencies {
  env?: HermesEnv;
  spawn?: typeof spawnChildProcess;
  spawnSync?: typeof spawnSync;
  fetch?: typeof fetch;
  now?: () => number;
  setTimeout?: typeof globalThis.setTimeout;
  clearTimeout?: typeof globalThis.clearTimeout;
  setInterval?: typeof globalThis.setInterval;
  clearInterval?: typeof globalThis.clearInterval;
}

export interface HermesManager {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): HermesRuntimeStatus;
  onStatusChanged(listener: HermesStatusListener): () => void;
}

function getEnvValue(env: HermesEnv, key: string) {
  const value = env[key];

  if (!value || value === "undefined" || value === "null") {
    return undefined;
  }

  return value;
}

function getBooleanEnv(env: HermesEnv, key: string, fallback: boolean) {
  const value = getEnvValue(env, key);

  if (!value) {
    return fallback;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function getNumberEnv(env: HermesEnv, key: string, fallback: number, minimum?: number) {
  const value = getEnvValue(env, key);

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (typeof minimum === "number") {
    return Math.max(minimum, parsed);
  }

  return parsed;
}

function getHermesBaseUrl(env: HermesEnv) {
  return (getEnvValue(env, "HERMES_BASE_URL") || DEFAULT_HERMES_BASE_URL).replace(/\/$/, "");
}

function getHermesBaseUrlParts(env: HermesEnv) {
  try {
    return new URL(getHermesBaseUrl(env));
  } catch {
    return new URL(DEFAULT_HERMES_BASE_URL);
  }
}

function getHealthPath(env: HermesEnv) {
  const rawPath = getEnvValue(env, "HERMES_HEALTH_PATH") || DEFAULT_HEALTH_PATH;
  return rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
}

function getHermesArgs(env: HermesEnv) {
  const raw = getEnvValue(env, "HERMES_EXECUTABLE_ARGS_JSON");

  if (!raw) {
    return DEFAULT_HERMES_ARGS;
  }

  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== "string")) {
    throw new Error("HERMES_EXECUTABLE_ARGS_JSON must be a JSON string array");
  }

  return parsed;
}

function findLocalHermesRoot(env: HermesEnv) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const cwd = process.cwd();
  const candidates = [
    getEnvValue(env, "HERMES_RUNTIME_ROOT"),
    getEnvValue(env, "HERMES_BUNDLED_ROOT"),
    path.resolve(cwd, "hermes-agent"),
    path.resolve(cwd, "..", "hermes-agent"),
    path.resolve(cwd, "..", "..", "hermes-agent"),
    path.resolve(cwd, "..", "..", "..", "hermes-agent"),
    path.resolve(cwd, "..", "..", "..", "..", "hermes-agent"),
    path.resolve(moduleDir, "..", "hermes-agent"),
    path.resolve(moduleDir, "..", "..", "hermes-agent"),
  ].filter((value): value is string => Boolean(value));

  return candidates.find((candidate) => {
    return (
      fs.existsSync(path.join(candidate, "pyproject.toml")) &&
      fs.existsSync(path.join(candidate, "hermes_cli", "main.py"))
    );
  });
}

function getHermesLaunchEnv(env: HermesEnv, pathPrefixes: string[] = []) {
  const baseUrl = getHermesBaseUrlParts(env);
  const launchEnv: NodeJS.ProcessEnv = { ...process.env };
  const apiServerPort = baseUrl.port || (baseUrl.protocol === "https:" ? "443" : "80");

  launchEnv.API_SERVER_ENABLED = getEnvValue(env, "API_SERVER_ENABLED") || "true";
  launchEnv.API_SERVER_HOST = getEnvValue(env, "API_SERVER_HOST") || baseUrl.hostname || "127.0.0.1";
  launchEnv.API_SERVER_PORT = getEnvValue(env, "API_SERVER_PORT") || apiServerPort;

  const hermesApiKey = getEnvValue(env, "HERMES_API_KEY");
  if (hermesApiKey && !getEnvValue(env, "API_SERVER_KEY")) {
    launchEnv.API_SERVER_KEY = hermesApiKey;
  }

  const hermesModel = getEnvValue(env, "HERMES_MODEL");
  if (hermesModel && !getEnvValue(env, "API_SERVER_MODEL_NAME")) {
    launchEnv.API_SERVER_MODEL_NAME = hermesModel;
  }

  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) {
      launchEnv[key] = value;
    }
  }

  const pathParts = [
    ...pathPrefixes,
    "/opt/homebrew/bin",
    "/usr/local/bin",
    launchEnv.PATH,
  ].filter((value): value is string => Boolean(value));
  launchEnv.PATH = Array.from(new Set(pathParts.flatMap((value) => value.split(path.delimiter)))).join(path.delimiter);

  return launchEnv;
}

function isPythonSupported(executablePath: string) {
  const result = spawnSync(executablePath, [
    "-c",
    "import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)",
  ], {
    stdio: "ignore",
  });

  return result.status === 0;
}

function findPythonExecutable(env: HermesEnv) {
  const configuredPython = getEnvValue(env, "HERMES_PYTHON_PATH");
  const candidates = [
    configuredPython,
    "python3.13",
    "python3.12",
    "python3.11",
    "/opt/homebrew/bin/python3.13",
    "/opt/homebrew/bin/python3.12",
    "/opt/homebrew/bin/python3.11",
    "/usr/local/bin/python3.13",
    "/usr/local/bin/python3.12",
    "/usr/local/bin/python3.11",
    "/usr/bin/python3",
  ].filter((value): value is string => Boolean(value));

  return candidates.find(isPythonSupported);
}

function getHermesExecutableName() {
  return process.platform === "win32" ? "hermes.exe" : "hermes";
}

function findBundledHermesExecutable(hermesRoot: string) {
  const executableName = getHermesExecutableName();
  const candidates = [
    path.join(hermesRoot, "electron-dist", "bin", "hermes", executableName),
    path.join(hermesRoot, "electron-dist", "bin", executableName),
    path.join(hermesRoot, "bin", "hermes", executableName),
    path.join(hermesRoot, "bin", executableName),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function resolveHermesLaunchConfig(env: HermesEnv): HermesLaunchConfig | null {
  const configuredExecutable = getEnvValue(env, "HERMES_EXECUTABLE_PATH");

  if (configuredExecutable) {
    return {
      executablePath: configuredExecutable,
      args: getHermesArgs(env),
      env: getHermesLaunchEnv(env),
    };
  }

  const hermesRoot = findLocalHermesRoot(env);
  if (!hermesRoot) {
    return null;
  }

  const hermesNodeBin = path.join(hermesRoot, "node_modules", ".bin");
  const bundledExecutable = findBundledHermesExecutable(hermesRoot);
  if (bundledExecutable) {
    return {
      executablePath: bundledExecutable,
      args: DEFAULT_HERMES_ARGS,
      cwd: hermesRoot,
      env: getHermesLaunchEnv(env, [hermesNodeBin]),
    };
  }

  const venvDirs = ["venv", ".venv"];
  for (const venvDir of venvDirs) {
    const venvBin = path.join(hermesRoot, venvDir, "bin");
    const venvPython = path.join(venvBin, "python");
    if (fs.existsSync(venvPython)) {
      return {
        executablePath: venvPython,
        args: [path.join(hermesRoot, "hermes_cli", "main.py"), ...DEFAULT_HERMES_ARGS],
        cwd: hermesRoot,
        env: getHermesLaunchEnv(env, [venvBin, hermesNodeBin]),
      };
    }

    const venvHermes = path.join(venvBin, "hermes");
    if (fs.existsSync(venvHermes)) {
      return {
        executablePath: venvHermes,
        args: DEFAULT_HERMES_ARGS,
        cwd: hermesRoot,
        env: getHermesLaunchEnv(env, [venvBin, hermesNodeBin]),
      };
    }
  }

  const pythonExecutable = findPythonExecutable(env);
  if (!pythonExecutable) {
    return null;
  }

  return {
    executablePath: pythonExecutable,
    args: [path.join(hermesRoot, "hermes_cli", "main.py"), ...DEFAULT_HERMES_ARGS],
    cwd: hermesRoot,
    env: getHermesLaunchEnv(env, [hermesNodeBin]),
  };
}

function getGatewayStopArgs(args: string[]) {
  const gatewayIndex = args.indexOf("gateway");

  if (gatewayIndex < 0) {
    return null;
  }

  return [...args.slice(0, gatewayIndex), "gateway", "stop"];
}

function stopExistingGateway(launchConfig: HermesLaunchConfig, spawnSyncImpl: typeof spawnSync) {
  const stopArgs = getGatewayStopArgs(launchConfig.args);

  if (!stopArgs) {
    return;
  }

  spawnSyncImpl(launchConfig.executablePath, stopArgs, {
    cwd: launchConfig.cwd,
    env: launchConfig.env,
    stdio: "ignore",
    timeout: PRESTART_STOP_TIMEOUT_MS,
  });
}

function getHealthIntervalMs(env: HermesEnv) {
  return getNumberEnv(env, "HERMES_HEALTH_INTERVAL_MS", DEFAULT_HEALTH_INTERVAL_MS, MIN_HEALTH_INTERVAL_MS);
}

function getHealthFailureThreshold(env: HermesEnv) {
  return getNumberEnv(
    env,
    "HERMES_HEALTH_FAILURE_THRESHOLD",
    DEFAULT_HEALTH_FAILURE_THRESHOLD,
    MIN_HEALTH_FAILURE_THRESHOLD,
  );
}

function getRestartDelayMs(env: HermesEnv, restartCount: number) {
  const baseDelay = getNumberEnv(env, "HERMES_RESTART_BASE_DELAY_MS", DEFAULT_RESTART_BASE_DELAY_MS, MIN_DELAY_MS);
  const maxDelay = getNumberEnv(env, "HERMES_RESTART_MAX_DELAY_MS", DEFAULT_RESTART_MAX_DELAY_MS, MIN_DELAY_MS);
  return Math.min(maxDelay, baseDelay * 2 ** Math.max(0, restartCount - 1));
}

function getStopTimeoutMs(env: HermesEnv) {
  return getNumberEnv(env, "HERMES_STOP_TIMEOUT_MS", DEFAULT_STOP_TIMEOUT_MS, MIN_STOP_TIMEOUT_MS);
}

function createInitialStatus(env: HermesEnv): HermesRuntimeStatus {
  return {
    state: getBooleanEnv(env, "HERMES_AUTOSTART", true) ? "stopped" : "disabled",
    pid: null,
    restartCount: 0,
    lastError: null,
    lastStartedAt: null,
    lastHealthCheckAt: null,
  };
}

function getStatusSnapshot(status: HermesRuntimeStatus): HermesRuntimeStatus {
  return { ...status };
}

export function createHermesManager(dependencies: HermesManagerDependencies = {}): HermesManager {
  const env = dependencies.env ?? (process.env as HermesEnv);
  const spawn = dependencies.spawn ?? spawnChildProcess;
  const spawnSyncImpl = dependencies.spawnSync ?? spawnSync;
  const fetchImpl = dependencies.fetch ?? fetch;
  const now = dependencies.now ?? Date.now;
  const setTimeoutImpl = dependencies.setTimeout ?? globalThis.setTimeout;
  const clearTimeoutImpl = dependencies.clearTimeout ?? globalThis.clearTimeout;
  const setIntervalImpl = dependencies.setInterval ?? globalThis.setInterval;
  const clearIntervalImpl = dependencies.clearInterval ?? globalThis.clearInterval;

  const listeners = new Set<HermesStatusListener>();
  const stopResolvers = new Set<() => void>();

  let status = createInitialStatus(env);
  let child: HermesChildProcess | null = null;
  let healthCheckTimer: ReturnType<typeof globalThis.setInterval> | null = null;
  let restartTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  let forceKillTimer: ReturnType<typeof globalThis.setTimeout> | null = null;
  let healthFailureCount = 0;
  let exitMode: HermesExitMode = null;
  let startPromise: Promise<void> | null = null;
  let activeChildGeneration = 0;
  let lastProcessOutput = "";

  function emitStatus() {
    const snapshot = getStatusSnapshot(status);
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function updateStatus(patch: Partial<HermesRuntimeStatus>) {
    status = {
      ...status,
      ...patch,
    };
    emitStatus();
  }

  function clearHealthCheckTimer() {
    if (!healthCheckTimer) {
      return;
    }

    clearIntervalImpl(healthCheckTimer);
    healthCheckTimer = null;
  }

  function clearRestartTimer() {
    if (!restartTimer) {
      return;
    }

    clearTimeoutImpl(restartTimer);
    restartTimer = null;
  }

  function clearForceKillTimer() {
    if (!forceKillTimer) {
      return;
    }

    clearTimeoutImpl(forceKillTimer);
    forceKillTimer = null;
  }

  function resolveStop() {
    for (const resolve of stopResolvers) {
      resolve();
    }
    stopResolvers.clear();
  }

  function scheduleRestart(reason: string) {
    clearRestartTimer();

    const nextRestartCount = status.restartCount + 1;
    const delayMs = getRestartDelayMs(env, nextRestartCount);

    updateStatus({
      state: "crashed",
      pid: null,
      restartCount: nextRestartCount,
      lastError: reason,
    });

    restartTimer = setTimeoutImpl(() => {
      restartTimer = null;
      void startProcess();
    }, delayMs);
  }

  function formatExitReason(code: number | null, signal: NodeJS.Signals | null) {
    if (signal) {
      return `Hermes exited with signal ${signal}`;
    }

    if (typeof code === "number") {
      return `Hermes exited with code ${code}`;
    }

    return "Hermes exited unexpectedly";
  }

  function rememberProcessOutput(chunk: unknown) {
    const text = String(chunk).trim();
    if (!text) {
      return;
    }

    lastProcessOutput = `${lastProcessOutput}\n${text}`.trim().slice(-MAX_PROCESS_OUTPUT_LENGTH);
  }

  function isActiveHealthCheck(targetChild: HermesChildProcess, generation: number) {
    return child === targetChild && activeChildGeneration === generation;
  }

  async function runHealthCheck() {
    if (!child) {
      return;
    }

    const targetChild = child;
    const targetGeneration = activeChildGeneration;

    try {
      const response = await fetchImpl(`${getHermesBaseUrl(env)}${getHealthPath(env)}`, {
        method: "GET",
      });

      if (!isActiveHealthCheck(targetChild, targetGeneration)) {
        return;
      }

      if (!response.ok) {
        throw new Error(`Health check returned ${response.status}`);
      }

      healthFailureCount = 0;
      updateStatus({
        state: "healthy",
        pid: targetChild.pid ?? null,
        lastError: null,
        lastHealthCheckAt: now(),
      });
    } catch (error) {
      if (!isActiveHealthCheck(targetChild, targetGeneration)) {
        return;
      }

      const reason = error instanceof Error ? error.message : "Health check failed";
      healthFailureCount += 1;
      updateStatus({
        state: "unhealthy",
        pid: targetChild.pid ?? null,
        lastError: reason,
        lastHealthCheckAt: now(),
      });

      if (healthFailureCount >= getHealthFailureThreshold(env)) {
        requestRestart(reason);
      }
    }
  }

  function startHealthChecks() {
    clearHealthCheckTimer();

    healthCheckTimer = setIntervalImpl(() => {
      void runHealthCheck();
    }, getHealthIntervalMs(env));
  }

  function attachChildListeners(nextChild: HermesChildProcess) {
    nextChild.stdout?.on("data", rememberProcessOutput);
    nextChild.stderr?.on("data", rememberProcessOutput);

    nextChild.on("error", (error) => {
      if (nextChild !== child) {
        return;
      }

      updateStatus({
        state: "unhealthy",
        pid: nextChild.pid ?? null,
        lastError: error.message,
      });

      requestRestart(error.message);
    });

    nextChild.on("exit", (code, signal) => {
      if (nextChild !== child) {
        return;
      }

      child = null;
      activeChildGeneration += 1;
      healthFailureCount = 0;
      clearHealthCheckTimer();
      clearForceKillTimer();

      if (exitMode === "stop") {
        exitMode = null;
        updateStatus({
          state: "stopped",
          pid: null,
        });
        resolveStop();
        return;
      }

      const reason = lastProcessOutput || status.lastError || formatExitReason(code, signal);
      exitMode = null;
      scheduleRestart(reason);
    });
  }

  async function startProcess() {
    if (!getBooleanEnv(env, "HERMES_AUTOSTART", true)) {
      clearRestartTimer();
      updateStatus({
        state: "disabled",
        pid: null,
        lastError: null,
      });
      return;
    }

    let launchConfig: HermesLaunchConfig | null;
    try {
      launchConfig = resolveHermesLaunchConfig(env);
    } catch (error) {
      updateStatus({
        state: "crashed",
        pid: null,
        lastError: error instanceof Error ? error.message : "Invalid Hermes arguments",
      });
      return;
    }

    if (!launchConfig) {
      updateStatus({
        state: "crashed",
        pid: null,
        lastError: "Hermes executable is not configured and local hermes-agent was not found",
      });
      return;
    }

    clearRestartTimer();
    clearForceKillTimer();
    clearHealthCheckTimer();
    exitMode = null;
    healthFailureCount = 0;
    lastProcessOutput = "";

    try {
      stopExistingGateway(launchConfig, spawnSyncImpl);

      const nextChild = spawn(launchConfig.executablePath, launchConfig.args, {
        cwd: launchConfig.cwd,
        env: launchConfig.env,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      }) as HermesChildProcess;

      child = nextChild;
      activeChildGeneration += 1;
      attachChildListeners(nextChild);

      if (typeof nextChild.unref === "function") {
        nextChild.unref();
      }

      updateStatus({
        state: "starting",
        pid: nextChild.pid ?? null,
        lastError: null,
        lastStartedAt: now(),
      });

      startHealthChecks();
      void runHealthCheck();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Failed to start Hermes";
      child = null;
      activeChildGeneration += 1;
      clearHealthCheckTimer();
      scheduleRestart(reason);
    }
  }

  function armForceKill(targetChild: HermesChildProcess) {
    clearForceKillTimer();

    forceKillTimer = setTimeoutImpl(() => {
      if (!child || child !== targetChild) {
        return;
      }

      targetChild.kill("SIGKILL");
    }, getStopTimeoutMs(env));
  }

  function requestRestart(reason: string) {
    if (exitMode === "restart") {
      return;
    }

    if (!child) {
      scheduleRestart(reason);
      return;
    }

    exitMode = "restart";
    updateStatus({
      state: "unhealthy",
      pid: child.pid ?? null,
      lastError: reason,
    });

    const targetChild = child;
    const killed = targetChild.kill("SIGTERM");

    if (!killed) {
      child = null;
      activeChildGeneration += 1;
      clearHealthCheckTimer();
      clearForceKillTimer();
      exitMode = null;
      scheduleRestart(reason);
      return;
    }

    armForceKill(targetChild);
  }

  return {
    async start() {
      if (child) {
        return;
      }

      if (startPromise) {
        return startPromise;
      }

      startPromise = startProcess().finally(() => {
        startPromise = null;
      });

      return startPromise;
    },

    async stop() {
      clearRestartTimer();
      clearHealthCheckTimer();

      if (!child) {
        clearForceKillTimer();
        exitMode = null;
        updateStatus({
          state: getBooleanEnv(env, "HERMES_AUTOSTART", true) ? "stopped" : "disabled",
          pid: null,
        });
        return;
      }

      exitMode = "stop";

      const stopPromise = new Promise<void>((resolve) => {
        stopResolvers.add(resolve);
      });

      const targetChild = child;
      const killed = targetChild.kill("SIGTERM");

      if (!killed) {
        child = null;
        activeChildGeneration += 1;
        clearForceKillTimer();
        exitMode = null;
        updateStatus({
          state: "stopped",
          pid: null,
        });
        resolveStop();
        return stopPromise;
      }

      armForceKill(targetChild);

      return stopPromise;
    },

    getStatus() {
      return getStatusSnapshot(status);
    },

    onStatusChanged(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const hermesManager = createHermesManager();
