import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { evaluateContextRecall } from "../electron/services/recall-service";

let tempDir = "";

describe("recall service", () => {
  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `oc-recall-service-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("evaluates recall from refreshed context without a chat turn", async () => {
    await expect(evaluateContextRecall({ userId: "user-001", characterId: "char-001", dataRoot: tempDir, now: 1 })).resolves.toHaveLength(0);
    await expect(evaluateContextRecall({ userId: "user-001", characterId: "char-001", dataRoot: tempDir, now: 2 })).resolves.toHaveLength(0);

    const events = await evaluateContextRecall({ userId: "user-001", characterId: "char-001", dataRoot: tempDir, now: 3 });

    expect(events[0]).toEqual(expect.objectContaining({ signal: "跑通 Chat 主链路", status: "candidate" }));
  });

  it("returns only newly created recall hints during cooldown", async () => {
    await evaluateContextRecall({ userId: "user-001", characterId: "char-001", dataRoot: tempDir, now: 1 });
    await evaluateContextRecall({ userId: "user-001", characterId: "char-001", dataRoot: tempDir, now: 2 });
    await evaluateContextRecall({ userId: "user-001", characterId: "char-001", dataRoot: tempDir, now: 3 });

    await expect(evaluateContextRecall({ userId: "user-001", characterId: "char-001", dataRoot: tempDir, now: 4 })).resolves.toHaveLength(0);
    await expect(evaluateContextRecall({ userId: "user-001", characterId: "char-001", dataRoot: tempDir, now: 5 })).resolves.toHaveLength(0);
    await expect(evaluateContextRecall({ userId: "user-001", characterId: "char-001", dataRoot: tempDir, now: 6 })).resolves.toHaveLength(0);
  });
});
