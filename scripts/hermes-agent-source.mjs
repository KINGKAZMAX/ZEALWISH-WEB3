import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

export const DEFAULT_HERMES_AGENT_REPO = "https://github.com/NousResearch/hermes-agent.git";
export const DEFAULT_HERMES_AGENT_REF = "main";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    env: { ...process.env, ...options.env },
    stdio: options.stdio || "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }

  return result;
}

function canRun(command, args = ["--version"]) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "ignore",
  });

  return result.status === 0;
}

function isHermesSource(candidate) {
  return (
    fs.existsSync(path.join(candidate, "pyproject.toml")) &&
    fs.existsSync(path.join(candidate, "hermes_cli", "main.py"))
  );
}

function resolveHermesRoot(options = {}) {
  return path.resolve(options.repoRoot || repoRoot, options.hermesRoot || "hermes-agent");
}

export function ensureHermesAgentSource(options = {}) {
  const hermesRoot = resolveHermesRoot(options);

  if (isHermesSource(hermesRoot)) {
    return {
      hermesRoot,
      cloned: false,
      repo: null,
      ref: null,
    };
  }

  if (fs.existsSync(hermesRoot) && fs.readdirSync(hermesRoot).length > 0) {
    throw new Error(`${hermesRoot} exists but is not a Hermes source checkout.`);
  }

  if (!canRun("git")) {
    throw new Error("git is required to download hermes-agent.");
  }

  const repo = process.env.HERMES_AGENT_REPO || DEFAULT_HERMES_AGENT_REPO;
  const ref = process.env.HERMES_AGENT_REF || DEFAULT_HERMES_AGENT_REF;

  fs.mkdirSync(path.dirname(hermesRoot), { recursive: true });
  fs.rmSync(hermesRoot, { recursive: true, force: true });

  run("git", [
    "clone",
    "--depth",
    "1",
    "--branch",
    ref,
    repo,
    hermesRoot,
  ]);

  if (!isHermesSource(hermesRoot)) {
    throw new Error(`Downloaded ${repo}#${ref}, but ${hermesRoot} is not a valid Hermes source checkout.`);
  }

  return {
    hermesRoot,
    cloned: true,
    repo,
    ref,
  };
}
