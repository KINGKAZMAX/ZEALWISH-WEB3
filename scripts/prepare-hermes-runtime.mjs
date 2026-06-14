import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureHermesAgentSource } from "./hermes-agent-source.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const hermesRoot = path.join(repoRoot, "hermes-agent");
const venvDir = path.join(hermesRoot, "venv");
const venvBin = process.platform === "win32" ? path.join(venvDir, "Scripts") : path.join(venvDir, "bin");
const venvPython = path.join(venvBin, process.platform === "win32" ? "python.exe" : "python");
const electronDistDir = path.join(hermesRoot, "electron-dist");
const pyinstallerEntry = path.join(electronDistDir, "hermes_entry.py");
const bundledAgentBrowserHome = path.join(electronDistDir, "agent-browser-home");

function canRun(command, args = ["--version"]) {
  if (!command) {
    return false;
  }

  const result = spawnSync(command, args, {
    stdio: "ignore",
  });

  return result.status === 0;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function canUsePython(command) {
  const result = spawnSync(command, [
    "-c",
    "import sys; raise SystemExit(0 if sys.version_info >= (3, 11) else 1)",
  ], {
    stdio: "ignore",
  });

  return result.status === 0;
}

function findNpm() {
  const candidates =
    process.platform === "win32"
      ? ["npm.cmd", "npm"]
      : ["npm", "/opt/homebrew/bin/npm", "/usr/local/bin/npm"];

  const npm = candidates.find((candidate) => canRun(candidate));
  if (!npm) {
    throw new Error("npm is required to prepare Hermes browser tools.");
  }

  return npm;
}

function findPython() {
  const candidates = [
    process.env.HERMES_BUILD_PYTHON,
    "python3.13",
    "python3.12",
    "python3.11",
    "/opt/homebrew/bin/python3.13",
    "/opt/homebrew/bin/python3.12",
    "/opt/homebrew/bin/python3.11",
    "/usr/local/bin/python3.13",
    "/usr/local/bin/python3.12",
    "/usr/local/bin/python3.11",
  ].filter(Boolean);

  const python = candidates.find(canUsePython);
  if (!python) {
    throw new Error("Python 3.11+ is required to prepare the bundled Hermes runtime.");
  }

  return python;
}

function writePyinstallerEntry() {
  fs.mkdirSync(electronDistDir, { recursive: true });
  fs.writeFileSync(
    pyinstallerEntry,
    [
      "from hermes_cli.main import main",
      "",
      "if __name__ == \"__main__\":",
      "    main()",
      "",
    ].join("\n"),
    "utf8",
  );
}

function buildStandaloneHermes() {
  writePyinstallerEntry();

  run(venvPython, ["-m", "pip", "install", "pyinstaller>=6,<7"], { cwd: hermesRoot });
  run(
    venvPython,
    [
      "-m",
      "PyInstaller",
      "--clean",
      "--noconfirm",
      "--name",
      "hermes",
      "--distpath",
      path.join(electronDistDir, "bin"),
      "--workpath",
      path.join(electronDistDir, "pyinstaller-build"),
      "--specpath",
      path.join(electronDistDir, "pyinstaller-spec"),
      "--collect-data",
      "hermes_cli",
      "--collect-submodules",
      "agent",
      "--collect-submodules",
      "tools",
      "--collect-submodules",
      "gateway",
      "--collect-submodules",
      "tui_gateway",
      "--collect-submodules",
      "plugins",
      pyinstallerEntry,
    ],
    { cwd: hermesRoot },
  );
}

function bundleAgentBrowserRuntime() {
  const agentBrowserHome = process.env.AGENT_BROWSER_HOME || path.join(os.homedir(), ".agent-browser");
  const browsersDir = path.join(agentBrowserHome, "browsers");

  if (!fs.existsSync(browsersDir)) {
    throw new Error(`agent-browser browsers directory not found at ${browsersDir}`);
  }

  fs.rmSync(bundledAgentBrowserHome, { recursive: true, force: true });
  fs.mkdirSync(bundledAgentBrowserHome, { recursive: true });
  fs.cpSync(browsersDir, path.join(bundledAgentBrowserHome, "browsers"), {
    recursive: true,
    dereference: false,
  });
}

function main() {
  ensureHermesAgentSource();

  if (!fs.existsSync(path.join(hermesRoot, "pyproject.toml"))) {
    throw new Error(`Hermes source not found at ${hermesRoot}`);
  }

  if (!fs.existsSync(venvPython)) {
    run(findPython(), ["-m", "venv", venvDir]);
  }

  const npm = findNpm();

  run(venvPython, ["-m", "pip", "install", "--upgrade", "pip"], { cwd: hermesRoot });
  run(venvPython, ["-m", "pip", "install", "-e", "."], { cwd: hermesRoot });
  run(npm, ["install"], { cwd: hermesRoot });
  run(npm, ["exec", "--", "agent-browser", "install"], { cwd: hermesRoot });
  bundleAgentBrowserRuntime();
  buildStandaloneHermes();
}

main();
