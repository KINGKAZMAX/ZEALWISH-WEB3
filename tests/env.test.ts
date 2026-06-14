import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadLocalEnv, parseEnvFile } from "../electron/services/env";
import { navItems } from "../src/components/shared";

const touchedKeys = ["HERMES_API_KEY", "OC_DEMO_FORCE_MOCK_LLM", "CUSTOM_BASE_URL"] as const;
const originalEnv = Object.fromEntries(touchedKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of touchedKeys) {
    const originalValue = originalEnv[key];

    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
});

describe("local env loading", () => {
  it("parses dotenv-style key values without leaking comments", () => {
    expect(
      parseEnvFile(`
        # comment
        export HERMES_API_KEY=local-key
        OC_DEMO_FORCE_MOCK_LLM=0 # disable mock
        CUSTOM_BASE_URL="https://token-plan-cn.xiaomimimo.com/anthropic#v1"
      `),
    ).toEqual({
      HERMES_API_KEY: "local-key",
      OC_DEMO_FORCE_MOCK_LLM: "0",
      CUSTOM_BASE_URL: "https://token-plan-cn.xiaomimimo.com/anthropic#v1",
    });
  });

  it("loads an env file without overriding explicit process env", () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "tmp-env-test-"));
    const envFile = path.join(dir, ".env");
    fs.writeFileSync(envFile, "HERMES_API_KEY=file-key\nOC_DEMO_FORCE_MOCK_LLM=0\n", "utf8");

    process.env.HERMES_API_KEY = "shell-key";
    delete process.env.OC_DEMO_FORCE_MOCK_LLM;

    const loadedFiles = loadLocalEnv({ files: [envFile] });

    expect(loadedFiles).toEqual([envFile]);
    expect(process.env.HERMES_API_KEY).toBe("shell-key");
    expect(process.env.OC_DEMO_FORCE_MOCK_LLM).toBe("0");

    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("workspace shell model", () => {
  it("defines the primary navigation items in the previous OC World order", () => {
    expect(navItems.map((item) => item.id)).toEqual(["create", "oc", "chat", "world", "rewind", "memory"]);
    expect(navItems.map((item) => item.label)).toEqual(["生成我的OC", "我的OC", "聊天", "世界", "回溯", "记忆"]);
  });

  it("defaults first-time entry to create when no OC is configured", async () => {
    const shared = await import("../src/components/shared");

    expect(shared.resolveInitialView(null)).toBe("create");
    expect(shared.resolveInitialView({ name: "" })).toBe("create");
    expect(shared.resolveInitialView({ name: "   " })).toBe("create");
  });

  it("defaults returning users to chat when an OC already exists", async () => {
    const shared = await import("../src/components/shared");

    expect(shared.resolveInitialView({ name: "Mori" })).toBe("chat");
  });

  it("treats a generated OC name as sufficient to leave onboarding", async () => {
    const shared = await import("../src/components/shared");

    expect(shared.resolveInitialView({ name: "阿澄" })).toBe("chat");
  });
});
