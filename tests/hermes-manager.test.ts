import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHermesManager } from "../electron/services/hermes-manager";

class FakeChildProcess extends EventEmitter {
  pid: number;
  kill = vi.fn(() => true);
  unref = vi.fn();

  constructor(pid: number) {
    super();
    this.pid = pid;
  }
}

function createEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    HERMES_AUTOSTART: "1",
    HERMES_EXECUTABLE_PATH: "/tmp/hermes",
    HERMES_EXECUTABLE_ARGS_JSON: '["gateway","start"]',
    HERMES_BASE_URL: "http://127.0.0.1:8642",
    HERMES_HEALTH_INTERVAL_MS: "1000",
    HERMES_HEALTH_FAILURE_THRESHOLD: "2",
    HERMES_RESTART_BASE_DELAY_MS: "10",
    HERMES_RESTART_MAX_DELAY_MS: "10",
    HERMES_STOP_TIMEOUT_MS: "20",
    ...overrides,
  };
}

function createManager(options: {
  env?: Record<string, string | undefined>;
  spawn?: ReturnType<typeof vi.fn>;
  spawnSync?: ReturnType<typeof vi.fn>;
  fetch?: ReturnType<typeof vi.fn>;
}) {
  return createHermesManager({
    env: createEnv(options.env),
    spawn: options.spawn ?? vi.fn(),
    spawnSync: options.spawnSync ?? vi.fn(),
    fetch: options.fetch ?? vi.fn(),
    now: () => Date.now(),
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  });
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("hermes manager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts Hermes and marks it healthy after a successful health check", async () => {
    const child = new FakeChildProcess(101);
    const spawn = vi.fn().mockReturnValue(child);
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const manager = createManager({ spawn, fetch });

    await manager.start();
    await flush();

    expect(spawn).toHaveBeenCalledWith(
      "/tmp/hermes",
      ["gateway", "start"],
      expect.objectContaining({
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8642/health",
      expect.objectContaining({ method: "GET" }),
    );
    expect(manager.getStatus()).toMatchObject({
      state: "healthy",
      pid: 101,
      restartCount: 0,
      lastError: null,
    });
  });

  it("stops an existing gateway before spawning the managed process", async () => {
    const child = new FakeChildProcess(101);
    const spawn = vi.fn().mockReturnValue(child);
    const spawnSync = vi.fn();
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const manager = createManager({ spawn, spawnSync, fetch });

    await manager.start();
    await flush();

    expect(spawnSync).toHaveBeenCalledWith(
      "/tmp/hermes",
      ["gateway", "stop"],
      expect.objectContaining({
        stdio: "ignore",
        timeout: expect.any(Number),
      }),
    );
    expect(spawn).toHaveBeenCalledWith(
      "/tmp/hermes",
      ["gateway", "start"],
      expect.any(Object),
    );
  });

  it("uses the bundled hermes-agent gateway when no executable is configured", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "oc-hermes-manager-"));
    const hermesRoot = path.join(tempRoot, "hermes-agent");
    const venvBin = path.join(hermesRoot, "venv", "bin");
    fs.mkdirSync(path.join(hermesRoot, "hermes_cli"), { recursive: true });
    fs.mkdirSync(venvBin, { recursive: true });
    fs.writeFileSync(path.join(hermesRoot, "pyproject.toml"), "[project]\nname = \"hermes-agent\"\n", "utf8");
    fs.writeFileSync(path.join(hermesRoot, "hermes_cli", "main.py"), "print('hermes')\n", "utf8");
    fs.writeFileSync(path.join(venvBin, "python"), "#!/bin/sh\n", "utf8");

    try {
      const child = new FakeChildProcess(101);
      const spawn = vi.fn().mockReturnValue(child);
      const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      const manager = createManager({
        spawn,
        fetch,
        env: {
          HERMES_EXECUTABLE_PATH: undefined,
          HERMES_EXECUTABLE_ARGS_JSON: undefined,
          HERMES_BUNDLED_ROOT: hermesRoot,
          HERMES_HOME: path.join(tempRoot, "hermes-home"),
        },
      });

      await manager.start();
      await flush();

      const [executable, args, options] = spawn.mock.calls[0];
      const hermesCliPath = path.join(hermesRoot, "hermes_cli", "main.py");

      expect(executable).toBe(path.join(venvBin, "python"));
      expect(args).toEqual([hermesCliPath, "gateway", "run", "--replace"]);
      expect(options).toEqual(
        expect.objectContaining({
          cwd: hermesRoot,
          env: expect.objectContaining({
            API_SERVER_ENABLED: "true",
            API_SERVER_HOST: "127.0.0.1",
            API_SERVER_PORT: "8642",
          }),
        }),
      );
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("prefers the installed runtime root and exposes bundled browser tools on PATH", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "oc-hermes-manager-"));
    const hermesRoot = path.join(tempRoot, "hermes-agent");
    const venvBin = path.join(hermesRoot, "venv", "bin");
    const nodeBin = path.join(hermesRoot, "node_modules", ".bin");
    fs.mkdirSync(path.join(hermesRoot, "hermes_cli"), { recursive: true });
    fs.mkdirSync(venvBin, { recursive: true });
    fs.mkdirSync(nodeBin, { recursive: true });
    fs.writeFileSync(path.join(hermesRoot, "pyproject.toml"), "[project]\nname = \"hermes-agent\"\n", "utf8");
    fs.writeFileSync(path.join(hermesRoot, "hermes_cli", "main.py"), "print('hermes')\n", "utf8");
    fs.writeFileSync(path.join(venvBin, "python"), "#!/bin/sh\n", "utf8");
    fs.writeFileSync(path.join(nodeBin, "agent-browser"), "#!/bin/sh\n", "utf8");

    try {
      const child = new FakeChildProcess(101);
      const spawn = vi.fn().mockReturnValue(child);
      const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      const manager = createManager({
        spawn,
        fetch,
        env: {
          HERMES_EXECUTABLE_PATH: undefined,
          HERMES_EXECUTABLE_ARGS_JSON: undefined,
          HERMES_BUNDLED_ROOT: hermesRoot,
          HERMES_HOME: path.join(tempRoot, "hermes-home"),
        },
      });

      await manager.start();
      await flush();

      const [executable, args, options] = spawn.mock.calls[0];
      expect(executable).toBe(path.join(venvBin, "python"));
      expect(args).toEqual([path.join(hermesRoot, "hermes_cli", "main.py"), "gateway", "run", "--replace"]);
      expect(options).toEqual(
        expect.objectContaining({
          cwd: hermesRoot,
          env: expect.objectContaining({
            HERMES_HOME: path.join(tempRoot, "hermes-home"),
          }),
        }),
      );
      expect(String(options.env.PATH).split(path.delimiter)).toEqual(expect.arrayContaining([venvBin, nodeBin]));
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("prefers a bundled standalone Hermes executable when present", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "oc-hermes-manager-"));
    const hermesRoot = path.join(tempRoot, "hermes-agent");
    const bundledBinDir = path.join(hermesRoot, "electron-dist", "bin", "hermes");
    const nodeBin = path.join(hermesRoot, "node_modules", ".bin");
    fs.mkdirSync(path.join(hermesRoot, "hermes_cli"), { recursive: true });
    fs.mkdirSync(bundledBinDir, { recursive: true });
    fs.mkdirSync(nodeBin, { recursive: true });
    fs.writeFileSync(path.join(hermesRoot, "pyproject.toml"), "[project]\nname = \"hermes-agent\"\n", "utf8");
    fs.writeFileSync(path.join(hermesRoot, "hermes_cli", "main.py"), "print('hermes')\n", "utf8");
    fs.writeFileSync(path.join(bundledBinDir, "hermes"), "#!/bin/sh\n", "utf8");

    try {
      const child = new FakeChildProcess(101);
      const spawn = vi.fn().mockReturnValue(child);
      const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      const manager = createManager({
        spawn,
        fetch,
        env: {
          HERMES_EXECUTABLE_PATH: undefined,
          HERMES_EXECUTABLE_ARGS_JSON: undefined,
          HERMES_BUNDLED_ROOT: hermesRoot,
          HERMES_HOME: path.join(tempRoot, "hermes-home"),
        },
      });

      await manager.start();
      await flush();

      const [executable, args, options] = spawn.mock.calls[0];
      expect(executable).toBe(path.join(bundledBinDir, "hermes"));
      expect(args).toEqual(["gateway", "run", "--replace"]);
      expect(options).toEqual(expect.objectContaining({ cwd: hermesRoot }));
      expect(String(options.env.PATH).split(path.delimiter)).toContain(nodeBin);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("restarts Hermes after repeated health-check failures", async () => {
    const firstChild = new FakeChildProcess(101);
    const secondChild = new FakeChildProcess(202);
    const spawn = vi.fn().mockReturnValueOnce(firstChild).mockReturnValueOnce(secondChild);
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("gateway down"))
      .mockRejectedValueOnce(new Error("gateway down"))
      .mockResolvedValue({ ok: true, status: 200 });
    const manager = createManager({ spawn, fetch });

    await manager.start();
    await flush();
    await vi.advanceTimersByTimeAsync(1000);
    await flush();

    expect(firstChild.kill).toHaveBeenCalledWith("SIGTERM");

    firstChild.emit("exit", 1, null);
    await flush();
    await vi.advanceTimersByTimeAsync(10);
    await flush();

    expect(spawn).toHaveBeenCalledTimes(2);
    expect(manager.getStatus()).toMatchObject({
      state: "healthy",
      pid: 202,
      restartCount: 1,
    });
  });

  it("restarts Hermes after the child process exits", async () => {
    const firstChild = new FakeChildProcess(101);
    const secondChild = new FakeChildProcess(202);
    const spawn = vi.fn().mockReturnValueOnce(firstChild).mockReturnValueOnce(secondChild);
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const manager = createManager({ spawn, fetch });

    await manager.start();
    await flush();

    firstChild.emit("exit", 1, null);
    await flush();

    expect(manager.getStatus()).toMatchObject({
      state: "crashed",
      pid: null,
      restartCount: 1,
    });

    await vi.advanceTimersByTimeAsync(10);
    await flush();

    expect(spawn).toHaveBeenCalledTimes(2);
    expect(manager.getStatus()).toMatchObject({
      state: "healthy",
      pid: 202,
      restartCount: 1,
    });
  });

  it("stops Hermes and clears pending restart work", async () => {
    const child = new FakeChildProcess(101);
    const spawn = vi.fn().mockReturnValue(child);
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const manager = createManager({ spawn, fetch });

    await manager.start();
    await flush();

    const stopPromise = manager.stop();
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");

    child.emit("exit", 0, null);
    await stopPromise;
    await vi.advanceTimersByTimeAsync(1000);
    await flush();

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(manager.getStatus()).toMatchObject({
      state: "stopped",
      pid: null,
    });
  });

  it("force kills Hermes when restart SIGTERM is ignored", async () => {
    const firstChild = new FakeChildProcess(101);
    const secondChild = new FakeChildProcess(202);
    const spawn = vi.fn().mockReturnValueOnce(firstChild).mockReturnValueOnce(secondChild);
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("gateway down"))
      .mockRejectedValueOnce(new Error("gateway down"))
      .mockResolvedValue({ ok: true, status: 200 });
    const manager = createManager({ spawn, fetch });

    await manager.start();
    await flush();
    await vi.advanceTimersByTimeAsync(1000);
    await flush();

    expect(firstChild.kill).toHaveBeenNthCalledWith(1, "SIGTERM");

    await vi.advanceTimersByTimeAsync(20);
    await flush();

    expect(firstChild.kill).toHaveBeenNthCalledWith(2, "SIGKILL");

    firstChild.emit("exit", 1, "SIGKILL");
    await flush();
    await vi.advanceTimersByTimeAsync(10);
    await flush();

    expect(spawn).toHaveBeenCalledTimes(2);
    expect(manager.getStatus()).toMatchObject({
      state: "healthy",
      pid: 202,
      restartCount: 1,
    });
  });

  it("ignores stale health-check results after a respawn", async () => {
    let firstResolve: ((value: { ok: true; status: 200 }) => void) | undefined;
    const firstFetch = new Promise<{ ok: true; status: 200 }>((resolve) => {
      firstResolve = resolve;
    });

    const firstChild = new FakeChildProcess(101);
    const secondChild = new FakeChildProcess(202);
    const spawn = vi.fn().mockReturnValueOnce(firstChild).mockReturnValueOnce(secondChild);
    const fetch = vi
      .fn()
      .mockReturnValueOnce(firstFetch)
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    const manager = createManager({ spawn, fetch });

    await manager.start();
    await flush();

    firstChild.emit("exit", 1, null);
    await flush();
    await vi.advanceTimersByTimeAsync(10);
    await flush();

    expect(manager.getStatus()).toMatchObject({
      state: "healthy",
      pid: 202,
      restartCount: 1,
    });

    firstResolve?.({ ok: true, status: 200 });
    await flush();

    expect(manager.getStatus()).toMatchObject({
      state: "healthy",
      pid: 202,
      restartCount: 1,
    });
  });

  it("clamps invalid numeric env values to safe minimums", async () => {
    const child = new FakeChildProcess(101);
    const spawn = vi.fn().mockReturnValue(child);
    const fetch = vi.fn().mockRejectedValue(new Error("gateway down"));
    const manager = createManager({
      spawn,
      fetch,
      env: {
        HERMES_HEALTH_INTERVAL_MS: "0",
        HERMES_HEALTH_FAILURE_THRESHOLD: "0",
        HERMES_RESTART_BASE_DELAY_MS: "-10",
        HERMES_RESTART_MAX_DELAY_MS: "-10",
        HERMES_STOP_TIMEOUT_MS: "-20",
      },
    });

    await manager.start();
    await flush();

    expect(fetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(99);
    await flush();
    expect(fetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");

    child.emit("exit", 1, null);
    await flush();
    await vi.advanceTimersByTimeAsync(0);
    await flush();
    expect(spawn).toHaveBeenCalledTimes(2);
  });
});
