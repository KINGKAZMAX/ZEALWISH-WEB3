import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getAirJellyContext } from "../electron/services/airjelly";

const originalEnv = {
  OC_AIRJELLY_SDK_MODULE: process.env.OC_AIRJELLY_SDK_MODULE,
  OC_DEMO_FORCE_MOCK_AIRJELLY: process.env.OC_DEMO_FORCE_MOCK_AIRJELLY,
};

afterEach(() => {
  process.env.OC_AIRJELLY_SDK_MODULE = originalEnv.OC_AIRJELLY_SDK_MODULE;
  process.env.OC_DEMO_FORCE_MOCK_AIRJELLY = originalEnv.OC_DEMO_FORCE_MOCK_AIRJELLY;
});

describe("airjelly service", () => {
  it("falls back to mock context when the AirJelly SDK is unavailable", async () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "oc-airjelly-"));
    const mockDir = path.join(tempRoot, "oc-data", "mock");
    fs.mkdirSync(mockDir, { recursive: true });
    fs.writeFileSync(
      path.join(mockDir, "airjelly-context.json"),
      JSON.stringify({
        source: "mock",
        events: [
          {
            title: "Mock work session",
            appName: "VS Code",
            durationSeconds: 1800,
            timestamp: 1777023244485,
          },
        ],
        tasks: [
          {
            title: "Run OC World without AirJelly",
            progressSummary: "ready",
          },
        ],
        appUsage: [
          {
            appName: "VS Code",
            totalSeconds: 3600,
          },
        ],
      }),
      "utf8",
    );

    process.env.OC_AIRJELLY_SDK_MODULE = "@oc-world/definitely-missing-airjelly-sdk";
    process.env.OC_DEMO_FORCE_MOCK_AIRJELLY = "0";

    try {
      await expect(getAirJellyContext(tempRoot)).resolves.toMatchObject({
        source: "mock",
        events: [{ title: "Mock work session" }],
        tasks: [{ title: "Run OC World without AirJelly" }],
      });
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
