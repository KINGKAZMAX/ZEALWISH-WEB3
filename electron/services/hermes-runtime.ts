import fs from "node:fs";
import path from "node:path";

type HermesEnv = Record<string, string | undefined>;

export interface HermesRuntimeOptions {
  env?: HermesEnv;
  userDataPath: string;
  appPath?: string;
  resourcesPath?: string;
  cwd?: string;
  isPackaged?: boolean;
}

export interface HermesRuntimeInstall {
  sourceRoot: string | null;
  hermesRoot: string | null;
  hermesHome: string;
  installed: boolean;
  version: string | null;
}

const RUNTIME_DIR_NAME = "hermes-runtime";
const HERMES_HOME_DIR_NAME = "hermes-home";
const AGENT_BROWSER_HOME_DIR_NAME = "agent-browser-home";
const INSTALL_MARKER_FILE = ".oc-world-runtime.json";
const DEFAULT_MODEL = "mimo-v2.5-pro";
const DEFAULT_PROVIDER = "custom";
const DEFAULT_API_MODE = "anthropic_messages";
const DEFAULT_BASE_URL = "https://token-plan-cn.xiaomimimo.com/anthropic";

function getEnvValue(env: HermesEnv, key: string) {
  const value = env[key];

  if (!value || value === "undefined" || value === "null") {
    return undefined;
  }

  return value;
}

function isHermesRoot(candidate: string) {
  return (
    fs.existsSync(path.join(candidate, "pyproject.toml")) &&
    fs.existsSync(path.join(candidate, "hermes_cli", "main.py"))
  );
}

function readRuntimeVersion(sourceRoot: string) {
  try {
    const pyproject = fs.readFileSync(path.join(sourceRoot, "pyproject.toml"), "utf8");
    const versionMatch = pyproject.match(/^\s*version\s*=\s*["']([^"']+)["']/m);
    if (versionMatch?.[1]?.trim()) {
      return versionMatch[1].trim();
    }
  } catch {
    // Fall through to package.json.
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(sourceRoot, "package.json"), "utf8")) as {
      version?: unknown;
    };

    if (typeof packageJson.version === "string" && packageJson.version.trim()) {
      return packageJson.version.trim();
    }
  } catch {
    // Fall through to the stable dev version label.
  }

  return "dev";
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-") || "dev";
}

function getHermesExecutableName() {
  return process.platform === "win32" ? "hermes.exe" : "hermes";
}

function hasBundledHermesExecutable(hermesRoot: string) {
  const executableName = getHermesExecutableName();
  return [
    path.join(hermesRoot, "electron-dist", "bin", "hermes", executableName),
    path.join(hermesRoot, "electron-dist", "bin", executableName),
    path.join(hermesRoot, "bin", "hermes", executableName),
    path.join(hermesRoot, "bin", executableName),
  ].some((candidate) => fs.existsSync(candidate));
}

function findBundledHermesSource(options: HermesRuntimeOptions, env: HermesEnv) {
  const candidates = [
    getEnvValue(env, "HERMES_BUNDLED_SOURCE"),
    options.resourcesPath ? path.join(options.resourcesPath, "hermes-agent") : undefined,
    options.appPath ? path.join(options.appPath, "hermes-agent") : undefined,
    options.appPath ? path.resolve(options.appPath, "..", "hermes-agent") : undefined,
    options.cwd ? path.join(options.cwd, "hermes-agent") : undefined,
    path.join(process.cwd(), "hermes-agent"),
  ].filter((value): value is string => Boolean(value));

  return candidates.find(isHermesRoot) || null;
}

function shouldCopyPath(sourcePath: string) {
  const parts = sourcePath.split(path.sep);
  return !parts.some((part) =>
    [
      ".git",
      ".pytest_cache",
      ".ruff_cache",
      ".mypy_cache",
      ".venv",
      "venv",
      "__pycache__",
    ].includes(part),
  );
}

function copyRuntime(sourceRoot: string, targetRoot: string, version: string) {
  const parentDir = path.dirname(targetRoot);
  fs.mkdirSync(parentDir, { recursive: true });

  if (isHermesRoot(targetRoot)) {
    if (!hasBundledHermesExecutable(sourceRoot) || hasBundledHermesExecutable(targetRoot)) {
      return false;
    }

    fs.rmSync(targetRoot, { recursive: true, force: true });
  }

  const tempRoot = path.join(parentDir, `${path.basename(targetRoot)}.installing-${process.pid}-${Date.now()}`);

  try {
    fs.cpSync(sourceRoot, tempRoot, {
      recursive: true,
      dereference: false,
      filter: shouldCopyPath,
    });
    fs.writeFileSync(
      path.join(tempRoot, INSTALL_MARKER_FILE),
      JSON.stringify(
        {
          sourceRoot,
          version,
          installedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
    fs.renameSync(tempRoot, targetRoot);
    return true;
  } catch (error) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    throw error;
  }
}

function getHermesConfig(env: HermesEnv) {
  const provider = getEnvValue(env, "HERMES_INFERENCE_PROVIDER") || DEFAULT_PROVIDER;
  const model = getEnvValue(env, "HERMES_MODEL") || getEnvValue(env, "API_SERVER_MODEL_NAME") || DEFAULT_MODEL;
  const apiMode = getEnvValue(env, "HERMES_API_MODE") || DEFAULT_API_MODE;
  const baseUrl = getEnvValue(env, "CUSTOM_BASE_URL") || getEnvValue(env, "ANTHROPIC_BASE_URL") || DEFAULT_BASE_URL;
  const webBackend =
    getEnvValue(env, "OC_HERMES_WEB_BACKEND") ||
    (getEnvValue(env, "TAVILY_API_KEY")
      ? "tavily"
      : getEnvValue(env, "EXA_API_KEY")
        ? "exa"
        : getEnvValue(env, "PARALLEL_API_KEY")
          ? "parallel"
          : "firecrawl");

  return [
    "model:",
    `  provider: ${provider}`,
    `  default: ${model}`,
    `  api_mode: ${apiMode}`,
    `  base_url: ${baseUrl}`,
    "",
    "platform_toolsets:",
    "  api_server: [hermes-api-server]",
    "",
    "browser:",
    "  inactivity_timeout: 120",
    "  command_timeout: 60",
    "",
    "web:",
    `  backend: ${webBackend}`,
    "",
  ].join("\n");
}

function seedHermesHome(env: HermesEnv, hermesHome: string) {
  fs.mkdirSync(hermesHome, { recursive: true });

  const configPath = path.join(hermesHome, "config.yaml");
  const shouldRefreshConfig = getEnvValue(env, "OC_WORLD_REFRESH_HERMES_CONFIG") !== "0";
  if (shouldRefreshConfig || !fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, getHermesConfig(env), "utf8");
  }
}

function exposeBundledHermesAssets(env: HermesEnv, hermesRoot: string) {
  env.HERMES_BUNDLED_SKILLS = getEnvValue(env, "HERMES_BUNDLED_SKILLS") || path.join(hermesRoot, "skills");
  env.HERMES_OPTIONAL_SKILLS =
    getEnvValue(env, "HERMES_OPTIONAL_SKILLS") || path.join(hermesRoot, "optional-skills");
}

function seedAgentBrowserHome(env: HermesEnv, userDataPath: string, hermesRoot: string) {
  const agentBrowserHome =
    getEnvValue(env, "AGENT_BROWSER_HOME") || path.join(userDataPath, AGENT_BROWSER_HOME_DIR_NAME);
  const bundledAgentBrowserHome = path.join(hermesRoot, "electron-dist", "agent-browser-home");

  env.AGENT_BROWSER_HOME = agentBrowserHome;

  if (!fs.existsSync(bundledAgentBrowserHome)) {
    return;
  }

  if (!fs.existsSync(path.join(agentBrowserHome, "browsers"))) {
    fs.mkdirSync(path.dirname(agentBrowserHome), { recursive: true });
    fs.cpSync(bundledAgentBrowserHome, agentBrowserHome, {
      recursive: true,
      dereference: false,
    });
  }
}

export function prepareHermesRuntime(options: HermesRuntimeOptions): HermesRuntimeInstall {
  const env = options.env ?? (process.env as HermesEnv);
  const hermesHome = getEnvValue(env, "HERMES_HOME") || path.join(options.userDataPath, HERMES_HOME_DIR_NAME);

  env.HERMES_HOME = hermesHome;
  seedHermesHome(env, hermesHome);

  if (getEnvValue(env, "HERMES_EXECUTABLE_PATH") || getEnvValue(env, "HERMES_RUNTIME_INSTALL") === "0") {
    return {
      sourceRoot: null,
      hermesRoot: null,
      hermesHome,
      installed: false,
      version: null,
    };
  }

  const sourceRoot = findBundledHermesSource(options, env);
  if (!sourceRoot) {
    return {
      sourceRoot: null,
      hermesRoot: null,
      hermesHome,
      installed: false,
      version: null,
    };
  }

  const version = readRuntimeVersion(sourceRoot);

  if (options.isPackaged === false) {
    env.HERMES_BUNDLED_ROOT = sourceRoot;
    env.HERMES_RUNTIME_ROOT = sourceRoot;
    exposeBundledHermesAssets(env, sourceRoot);
    seedAgentBrowserHome(env, options.userDataPath, sourceRoot);

    return {
      sourceRoot,
      hermesRoot: sourceRoot,
      hermesHome,
      installed: false,
      version,
    };
  }

  const targetRoot = path.join(
    options.userDataPath,
    RUNTIME_DIR_NAME,
    `hermes-agent-${sanitizePathSegment(version)}`,
  );
  const installed = copyRuntime(sourceRoot, targetRoot, version);

  env.HERMES_BUNDLED_ROOT = targetRoot;
  env.HERMES_RUNTIME_ROOT = targetRoot;
  exposeBundledHermesAssets(env, targetRoot);
  seedAgentBrowserHome(env, options.userDataPath, targetRoot);

  return {
    sourceRoot,
    hermesRoot: targetRoot,
    hermesHome,
    installed,
    version,
  };
}
