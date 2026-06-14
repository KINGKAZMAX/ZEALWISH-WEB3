import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runManualDistillationPipeline } from "../electron/services/growth-pipeline";
import { saveGrowthInsights } from "../electron/services/memory";
import {
  listAwarenessEpisodes,
  listWorkItems,
  loadProjectsState,
  saveRecallSignalStates,
} from "../electron/services/unified-memory";
import type { GrowthInsight } from "../src/types";

let tempDir = "";

function createGoalInsight(): GrowthInsight {
  return {
    id: "insight-manual-goal",
    userId: "user-001",
    type: "goal",
    title: "跑通完整记忆闭环",
    text: "用户正在推进完整记忆闭环。",
    evidenceIds: ["evidence-1", "evidence-2"],
    confidence: 0.7,
    status: "latent",
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("growth pipeline", () => {
  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `oc-growth-pipeline-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("runs the full manual distillation chain", async () => {
    await saveGrowthInsights("user-001", [createGoalInsight()], tempDir);
    await saveRecallSignalStates(
      [
        {
          userId: "user-001",
          signal: "跑通 Chat 主链路",
          count: 2,
          firstSeenAt: 1,
          lastSeenAt: 2,
        },
      ],
      tempDir,
    );

    const result = await runManualDistillationPipeline({
      userId: "user-001",
      characterId: "char-001",
      dataRoot: tempDir,
      now: 3,
    });
    const [episodes, workItems, projects] = await Promise.all([
      listAwarenessEpisodes("user-001", 10, tempDir),
      listWorkItems("user-001", tempDir),
      loadProjectsState("user-001", tempDir),
    ]);

    expect(result.episode.source).toBe("manual");
    expect(result.memoryMergeDecisions[0]).toEqual(expect.objectContaining({ status: "deferred" }));
    expect(result.workItems[0]?.title).toBe("跑通完整记忆闭环");
    expect(result.projects.projects[0]?.title).toContain("成长方向");
    expect(result.recallEvents[0]).toEqual(expect.objectContaining({ signal: "跑通 Chat 主链路" }));
    expect(episodes[0]?.id).toBe(result.episode.id);
    expect(workItems[0]?.title).toBe("跑通完整记忆闭环");
    expect(projects.projects[0]?.title).toContain("成长方向");
  });
});
