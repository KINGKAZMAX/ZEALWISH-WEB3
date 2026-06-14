import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mergeAwarenessCandidates } from "../electron/services/memory-merge";
import { loadLongTermMemory } from "../electron/services/unified-memory";
import type { AwarenessEpisode, GrowthInsight } from "../src/types";

let tempDir = "";

function createEpisode(): AwarenessEpisode {
  return {
    id: "awareness-1",
    userId: "user-001",
    source: "chat",
    createdAt: 1,
    title: "目标线索",
    keyMoments: ["用户说想做成长伙伴"],
    behaviorSignals: ["明确目标表达"],
    candidateMemoryUpdates: ["用户可能在推进成长伙伴"],
    openThreads: ["等待确认"],
    relatedInsightIds: ["insight-1"],
  };
}

function createInsight(status: GrowthInsight["status"]): GrowthInsight {
  return {
    id: "insight-1",
    userId: "user-001",
    type: "goal",
    title: "做成长伙伴",
    text: "你反复在朝这个目标靠近。",
    evidenceIds: ["e-1", "e-2"],
    confidence: 0.7,
    status,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("memory merge", () => {
  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `oc-memory-merge-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("defers latent candidates instead of writing long-term memory", async () => {
    const decisions = await mergeAwarenessCandidates({
      episode: createEpisode(),
      insights: [createInsight("latent")],
      now: 2,
      dataRoot: tempDir,
    });
    const memory = await loadLongTermMemory("user-001", tempDir);

    expect(decisions[0]).toEqual(expect.objectContaining({ status: "deferred", target: "none" }));
    expect(memory.memoryMarkdown).not.toContain("你反复在朝这个目标靠近。");
  });

  it("merges confirmed candidates into memory.md", async () => {
    const decisions = await mergeAwarenessCandidates({
      episode: createEpisode(),
      insights: [createInsight("confirmed")],
      now: 2,
      dataRoot: tempDir,
    });
    const memory = await loadLongTermMemory("user-001", tempDir);

    expect(decisions[0]).toEqual(expect.objectContaining({ status: "merged", target: "memory" }));
    expect(memory.memoryMarkdown).toContain("你反复在朝这个目标靠近。");
  });

  it("discards rejected candidates", async () => {
    const decisions = await mergeAwarenessCandidates({
      episode: createEpisode(),
      insights: [createInsight("rejected")],
      now: 2,
      dataRoot: tempDir,
    });

    expect(decisions[0]).toEqual(expect.objectContaining({ status: "discarded", target: "none" }));
  });
});
