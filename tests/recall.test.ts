import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_AIRJELLY_CONTEXT, DEFAULT_CHARACTER, DEFAULT_HISTORY, DEFAULT_RELATIONSHIP, DEFAULT_SUMMARIES } from "../electron/services/demo-fallback";
import { evaluateRecallCandidates } from "../electron/services/recall";
import type { ContextSnapshot } from "../src/types";

let tempDir = "";

function createSnapshot(): ContextSnapshot {
  const growthProfile = {
    userId: "user-001",
    updatedAt: 0,
    goals: [],
    strengths: [],
    preferences: [],
    openQuestions: [],
  };
  const airjellyCtx = {
    ...DEFAULT_AIRJELLY_CONTEXT,
    tasks: [
      {
        title: "跑通 Chat 主链路",
        progressSummary: "进行中",
      },
    ],
    events: [],
    appUsage: [],
  };

  return {
    builtAt: 1,
    airjellyCtx,
    wxMemories: DEFAULT_SUMMARIES,
    recentChat: DEFAULT_HISTORY,
    relationship: DEFAULT_RELATIONSHIP,
    character: DEFAULT_CHARACTER,
    growthProfile,
    latentInsights: [],
    retrievedMemoryBundle: {
      longTermFacts: "",
      voiceHints: "",
      systemReminders: "",
      activeProjects: [],
      relevantWorkItems: [],
      recentAwarenessHighlights: [],
    },
    realtimeContext: airjellyCtx,
    socialMemory: DEFAULT_SUMMARIES,
    conversationState: {
      recentChat: DEFAULT_HISTORY,
    },
    relationshipState: DEFAULT_RELATIONSHIP,
    characterState: DEFAULT_CHARACTER,
  };
}

describe("recall evaluator", () => {
  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `oc-recall-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("requires three repeated signals before creating a recall event", async () => {
    const snapshot = createSnapshot();

    await expect(evaluateRecallCandidates({ userId: "user-001", snapshot, now: 1, dataRoot: tempDir })).resolves.toHaveLength(0);
    await expect(evaluateRecallCandidates({ userId: "user-001", snapshot, now: 2, dataRoot: tempDir })).resolves.toHaveLength(0);

    const events = await evaluateRecallCandidates({ userId: "user-001", snapshot, now: 3, dataRoot: tempDir });

    expect(events).toEqual([
      expect.objectContaining({
        signal: "跑通 Chat 主链路",
        status: "candidate",
      }),
    ]);
  });

  it("does not trigger again during cooldown", async () => {
    const snapshot = createSnapshot();

    await evaluateRecallCandidates({ userId: "user-001", snapshot, now: 1, dataRoot: tempDir });
    await evaluateRecallCandidates({ userId: "user-001", snapshot, now: 2, dataRoot: tempDir });
    await evaluateRecallCandidates({ userId: "user-001", snapshot, now: 3, dataRoot: tempDir });
    await evaluateRecallCandidates({ userId: "user-001", snapshot, now: 4, dataRoot: tempDir });
    await evaluateRecallCandidates({ userId: "user-001", snapshot, now: 5, dataRoot: tempDir });
    const events = await evaluateRecallCandidates({ userId: "user-001", snapshot, now: 6, dataRoot: tempDir });

    expect(events).toHaveLength(1);
  });
});
