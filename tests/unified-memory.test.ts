import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendAwarenessEpisode,
  appendConfirmedMemoryNote,
  ensureUnifiedMemoryRepository,
  listAwarenessEpisodes,
  listWorkItems,
  loadLongTermMemory,
  loadProjectsState,
  loadRetrievedMemoryBundle,
  saveWorkItem,
} from "../electron/services/unified-memory";

let tempDir = "";

describe("unified memory repository", () => {
  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `oc-unified-memory-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("initializes long-term memory skeleton without touching legacy data", async () => {
    await ensureUnifiedMemoryRepository("user-001", tempDir);

    const longTerm = await loadLongTermMemory("user-001", tempDir);
    const projects = await loadProjectsState("user-001", tempDir);

    expect(longTerm.memoryMarkdown).toContain("## Growth Focus");
    expect(longTerm.voiceMarkdown).toContain("## 适合的语气");
    expect(longTerm.systemRemindersMarkdown).toContain("记忆链失败不能阻断聊天主链");
    expect(projects.projects).toEqual([]);
  });

  it("persists awareness episodes as readable markdown", async () => {
    await appendAwarenessEpisode(
      {
        id: "awareness-1",
        userId: "user-001",
        source: "chat",
        createdAt: 1_713_000_000_000,
        title: "目标线索",
        keyMoments: ["用户说想做成长伙伴"],
        behaviorSignals: ["明确目标表达"],
        candidateMemoryUpdates: ["用户可能在推进成长伙伴"],
        openThreads: ["等待确认"],
        relatedInsightIds: ["insight-1"],
      },
      tempDir,
    );

    const episodes = await listAwarenessEpisodes("user-001", 10, tempDir);
    const episodeDir = path.join(tempDir, "oc-data", "awareness", "episodes");
    const [episodeFile] = await readdir(episodeDir);

    expect(episodes[0]).toEqual(expect.objectContaining({ title: "目标线索", relatedInsightIds: ["insight-1"] }));
    await expect(readFile(path.join(episodeDir, episodeFile), "utf8")).resolves.toContain("## Candidate Memory Updates");
  });

  it("builds a retrieved memory bundle from memory, awareness, work-items and projects", async () => {
    await ensureUnifiedMemoryRepository("user-001", tempDir);
    await appendConfirmedMemoryNote({
      insightId: "insight-1",
      title: "做成长伙伴",
      text: "你反复在朝这个目标靠近。",
      type: "memory",
      now: 1_713_000_000_000,
      dataRoot: tempDir,
    });
    await saveWorkItem(
      {
        id: "work-1",
        userId: "user-001",
        title: "做成长伙伴",
        description: "推进成长伙伴 demo",
        status: "pending",
        source: "distillation",
        relatedSignals: ["insight-1"],
        notes: [{ at: 1, text: "目标线索", source: "distillation" }],
        summary: "推进成长伙伴 demo",
        createdAt: 1,
        updatedAt: 1,
      },
      tempDir,
    );

    const [items, bundle] = await Promise.all([
      listWorkItems("user-001", tempDir),
      loadRetrievedMemoryBundle("user-001", tempDir),
    ]);

    expect(items).toHaveLength(1);
    expect(bundle.longTermFacts).toContain("做成长伙伴");
    expect(bundle.relevantWorkItems[0].title).toBe("做成长伙伴");
  });
});
