import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { prepareHermesRuntime } from "../electron/services/hermes-runtime";

let tempDir = "";

function makeTempDir() {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "oc-hermes-runtime-"));
  return tempDir;
}

function makeHermesSource(root: string, version = "1.2.3") {
  const hermesRoot = path.join(root, "hermes-agent");
  fs.mkdirSync(path.join(hermesRoot, "hermes_cli"), { recursive: true });
  fs.mkdirSync(path.join(hermesRoot, "node_modules", ".bin"), { recursive: true });
  fs.mkdirSync(path.join(hermesRoot, "skills", "research", "web"), { recursive: true });
  fs.mkdirSync(path.join(hermesRoot, "optional-skills"), { recursive: true });
  fs.mkdirSync(path.join(hermesRoot, "electron-dist", "agent-browser-home", "browsers", "chrome-test"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(hermesRoot, "venv", "bin"), { recursive: true });
  fs.writeFileSync(path.join(hermesRoot, "pyproject.toml"), "[project]\nname = \"hermes-agent\"\n", "utf8");
  fs.writeFileSync(path.join(hermesRoot, "package.json"), JSON.stringify({ version }), "utf8");
  fs.writeFileSync(path.join(hermesRoot, "hermes_cli", "main.py"), "print('hermes')\n", "utf8");
  fs.writeFileSync(path.join(hermesRoot, "node_modules", ".bin", "agent-browser"), "#!/bin/sh\n", "utf8");
  fs.writeFileSync(path.join(hermesRoot, "skills", "research", "web", "SKILL.md"), "# Web\n", "utf8");
  fs.writeFileSync(
    path.join(hermesRoot, "electron-dist", "agent-browser-home", "browsers", "chrome-test", "chrome"),
    "#!/bin/sh\n",
    "utf8",
  );
  fs.writeFileSync(path.join(hermesRoot, "venv", "bin", "python"), "#!/bin/sh\n", "utf8");
  return hermesRoot;
}

afterEach(() => {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = "";
  }
});

describe("Hermes runtime installer", () => {
  it("copies a bundled Hermes runtime into userData and exposes launch env", () => {
    const root = makeTempDir();
    const sourceRoot = makeHermesSource(root);
    const userDataPath = path.join(root, "userData");
    const env: Record<string, string | undefined> = {
      HERMES_BUNDLED_SOURCE: sourceRoot,
      HERMES_MODEL: "mimo-v2.5-pro",
      CUSTOM_BASE_URL: "https://token-plan-cn.xiaomimimo.com/anthropic",
    };

    const install = prepareHermesRuntime({ env, userDataPath, cwd: root });

    expect(install.installed).toBe(true);
    expect(install.version).toBe("1.2.3");
    expect(install.hermesRoot).toBe(path.join(userDataPath, "hermes-runtime", "hermes-agent-1.2.3"));
    expect(env.HERMES_BUNDLED_ROOT).toBe(install.hermesRoot);
    expect(env.HERMES_RUNTIME_ROOT).toBe(install.hermesRoot);
    expect(env.HERMES_HOME).toBe(path.join(userDataPath, "hermes-home"));
    expect(env.HERMES_BUNDLED_SKILLS).toBe(path.join(install.hermesRoot || "", "skills"));
    expect(env.HERMES_OPTIONAL_SKILLS).toBe(path.join(install.hermesRoot || "", "optional-skills"));
    expect(env.AGENT_BROWSER_HOME).toBe(path.join(userDataPath, "agent-browser-home"));
    expect(fs.existsSync(path.join(install.hermesRoot || "", "hermes_cli", "main.py"))).toBe(true);
    expect(fs.existsSync(path.join(install.hermesRoot || "", "node_modules", ".bin", "agent-browser"))).toBe(true);
    expect(fs.existsSync(path.join(install.hermesRoot || "", "skills", "research", "web", "SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(install.hermesRoot || "", "venv"))).toBe(false);
    expect(fs.existsSync(path.join(userDataPath, "agent-browser-home", "browsers", "chrome-test", "chrome"))).toBe(true);
  });

  it("seeds an isolated Hermes home config for the API server agent", () => {
    const root = makeTempDir();
    const sourceRoot = makeHermesSource(root);
    const userDataPath = path.join(root, "userData");
    const env: Record<string, string | undefined> = {
      HERMES_BUNDLED_SOURCE: sourceRoot,
      HERMES_MODEL: "test-model",
      HERMES_INFERENCE_PROVIDER: "custom",
      OC_HERMES_WEB_BACKEND: "tavily",
      CUSTOM_BASE_URL: "https://example.test/api",
    };

    const install = prepareHermesRuntime({ env, userDataPath, cwd: root });
    const config = fs.readFileSync(path.join(install.hermesHome, "config.yaml"), "utf8");

    expect(config).toContain("provider: custom");
    expect(config).toContain("default: test-model");
    expect(config).toContain("base_url: https://example.test/api");
    expect(config).toContain("api_server: [hermes-api-server]");
    expect(config).toContain("backend: tavily");
  });

  it("uses the source runtime directly in development mode", () => {
    const root = makeTempDir();
    const sourceRoot = makeHermesSource(root);
    const userDataPath = path.join(root, "userData");
    const env: Record<string, string | undefined> = {
      HERMES_BUNDLED_SOURCE: sourceRoot,
    };

    const install = prepareHermesRuntime({ env, userDataPath, cwd: root, isPackaged: false });

    expect(install.installed).toBe(false);
    expect(install.hermesRoot).toBe(sourceRoot);
    expect(env.HERMES_BUNDLED_ROOT).toBe(sourceRoot);
    expect(env.HERMES_BUNDLED_SKILLS).toBe(path.join(sourceRoot, "skills"));
    expect(fs.existsSync(path.join(userDataPath, "hermes-runtime"))).toBe(false);
  });

  it("respects an explicit Hermes executable while still isolating HERMES_HOME", () => {
    const root = makeTempDir();
    const userDataPath = path.join(root, "userData");
    const env: Record<string, string | undefined> = {
      HERMES_EXECUTABLE_PATH: "/custom/hermes",
    };

    const install = prepareHermesRuntime({ env, userDataPath, cwd: root });

    expect(install.installed).toBe(false);
    expect(install.hermesRoot).toBe(null);
    expect(env.HERMES_BUNDLED_ROOT).toBeUndefined();
    expect(env.HERMES_HOME).toBe(path.join(userDataPath, "hermes-home"));
    expect(fs.existsSync(path.join(userDataPath, "hermes-home", "config.yaml"))).toBe(true);
  });
});
