import type {
  AwarenessEpisode,
  ContextSnapshot,
  ManualDistillationResult,
  ProjectsState,
  RecallEvent,
  WorkItem,
} from "../../src/types";
import { buildContextSnapshot } from "./context-snapshot";
import { distillGrowthTurn } from "./distillation";
import { getMemoryFeatureFlags } from "./feature-flags";
import { mergeGrowthArtifacts } from "./growth-insights";
import { appendGrowthLog, loadGrowthEvidence, loadGrowthInsights, loadRevealQueue, saveGrowthEvidence, saveGrowthInsights, saveRevealQueue } from "./memory";
import { mergeAwarenessCandidates } from "./memory-merge";
import { aggregateProjects } from "./projects";
import { evaluateRecallCandidates } from "./recall";
import { evaluateRevealCandidate } from "./reveal-policy";
import { appendAwarenessEpisode, loadProjectsState } from "./unified-memory";
import { syncWorkItemsFromInsights } from "./work-items";

interface RunGrowthPipelineInput {
  userId: string;
  userMessage: string;
  ocResponse: string;
  growthEvent: string | null;
  snapshot: ContextSnapshot;
  dataRoot: string;
  now?: number;
}

interface GrowthPipelineResult {
  episode: AwarenessEpisode | null;
  memoryMergeDecisions: ManualDistillationResult["memoryMergeDecisions"];
  workItems: WorkItem[];
  projects: ProjectsState | null;
  recallEvents: RecallEvent[];
  disabledReason?: "unified-memory" | "distillation";
}

function createEmptyProjectsState(userId: string): ProjectsState {
  return {
    version: 1,
    generatedAt: 0,
    userId,
    projects: [],
  };
}

function createManualAwarenessEpisode(input: {
  userId: string;
  snapshot: ContextSnapshot;
  insights: Awaited<ReturnType<typeof loadGrowthInsights>>;
  now: number;
}): AwarenessEpisode {
  const candidateInsights = input.insights.filter((item) => item.status !== "rejected" && item.status !== "archived");

  return {
    id: `awareness-manual-${input.now}`,
    userId: input.userId,
    source: "manual",
    createdAt: input.now,
    title: "手动蒸馏快照",
    keyMoments: input.snapshot.conversationState.recentChat
      .slice(-3)
      .map((entry) => `用户：${entry.userMessage} / OC：${entry.ocResponse}`),
    behaviorSignals: [
      ...candidateInsights.map((item) => `${item.type}：${item.title}`),
      ...input.snapshot.realtimeContext.tasks.slice(0, 3).map((task) => `AirJelly 待办：${task.title}`),
    ],
    candidateMemoryUpdates: candidateInsights.map((item) => item.text),
    openThreads: candidateInsights.length
      ? ["这些洞察仍需用户确认后再进入长期记忆。"]
      : ["当前没有足够稳定的候选洞察。"],
    relatedInsightIds: candidateInsights.map((item) => item.id),
  };
}

export async function runGrowthPipeline(input: RunGrowthPipelineInput): Promise<GrowthPipelineResult> {
  const now = input.now ?? Date.now();
  const flags = getMemoryFeatureFlags();

  if (!flags.unifiedMemory) {
    await appendGrowthLog(
      input.userId,
      {
        at: now,
        stage: "unified-memory-disabled",
        userMessage: input.userMessage,
      },
      input.dataRoot,
    );
    return {
      episode: null,
      memoryMergeDecisions: [],
      workItems: [],
      projects: null,
      recallEvents: [],
      disabledReason: "unified-memory",
    };
  }

  if (!flags.distillation) {
    const recallEvents = flags.recall
      ? await evaluateRecallCandidates({
          userId: input.userId,
          snapshot: input.snapshot,
          now,
          dataRoot: input.dataRoot,
        })
      : [];

    await appendGrowthLog(
      input.userId,
      {
        at: now,
        stage: "distillation-disabled",
        userMessage: input.userMessage,
      },
      input.dataRoot,
    );
    return {
      episode: null,
      memoryMergeDecisions: [],
      workItems: [],
      projects: null,
      recallEvents,
      disabledReason: "distillation",
    };
  }

  const [existingEvidence, existingInsights, queue] = await Promise.all([
    loadGrowthEvidence(input.userId, input.dataRoot),
    loadGrowthInsights(input.userId, input.dataRoot),
    loadRevealQueue(input.userId, input.dataRoot),
  ]);
  const distilled = distillGrowthTurn({
    userId: input.userId,
    userMessage: input.userMessage,
    ocResponse: input.ocResponse,
    growthEvent: input.growthEvent,
    now,
    snapshot: input.snapshot,
  });
  const merged = mergeGrowthArtifacts({
    existingEvidence,
    existingInsights,
    incomingEvidence: distilled.evidence,
    incomingInsights: distilled.insights,
    now,
  });
  const reveal = evaluateRevealCandidate({
    userId: input.userId,
    userMessage: input.userMessage,
    relationship: input.snapshot.relationshipState,
    insights: merged.insights,
    queue,
    now,
  });
  const memoryMergeDecisions = await mergeAwarenessCandidates({
    episode: distilled.awareness,
    insights: reveal.insights,
    now,
    dataRoot: input.dataRoot,
  });

  await Promise.all([
    appendAwarenessEpisode(distilled.awareness, input.dataRoot),
    saveGrowthEvidence(input.userId, merged.evidence, input.dataRoot),
    saveGrowthInsights(input.userId, reveal.insights, input.dataRoot),
    saveRevealQueue(input.userId, reveal.queue, input.dataRoot),
    appendGrowthLog(
      input.userId,
      {
        at: now,
        userMessage: input.userMessage,
        evidenceCount: distilled.evidence.length,
        insightCount: distilled.insights.length,
        revealCandidateId: reveal.candidate?.id ?? null,
        memoryMergeDecisions,
      },
      input.dataRoot,
    ),
  ]);

  const workItems = await syncWorkItemsFromInsights({
    userId: input.userId,
    insights: reveal.insights,
    now,
    dataRoot: input.dataRoot,
  });
  const projects = await aggregateProjects({
    userId: input.userId,
    now,
    dataRoot: input.dataRoot,
  });
  const recallEvents = flags.recall
    ? await evaluateRecallCandidates({
        userId: input.userId,
        snapshot: input.snapshot,
        now,
        dataRoot: input.dataRoot,
      })
    : [];

  return {
    episode: distilled.awareness,
    memoryMergeDecisions,
    workItems,
    projects,
    recallEvents,
  };
}

export async function runManualDistillationPipeline(input: {
  userId: string;
  characterId?: string;
  dataRoot?: string;
  now?: number;
}): Promise<ManualDistillationResult> {
  const dataRoot = input.dataRoot ?? process.cwd();
  const now = input.now ?? Date.now();
  const flags = getMemoryFeatureFlags();
  const snapshot = await buildContextSnapshot({
    userId: input.userId,
    characterId: input.characterId || "char-001",
    dataRoot,
  });
  const insights = await loadGrowthInsights(input.userId, dataRoot);
  const episode = createManualAwarenessEpisode({
    userId: input.userId,
    snapshot,
    insights,
    now,
  });

  if (!flags.unifiedMemory || !flags.distillation) {
    await appendGrowthLog(
      input.userId,
      {
        at: now,
        stage: flags.unifiedMemory ? "manual-distillation-disabled" : "manual-unified-memory-disabled",
      },
      dataRoot,
    );
    return {
      episode,
      memoryMergeDecisions: [],
      workItems: [],
      projects: createEmptyProjectsState(input.userId),
      recallEvents: [],
    };
  }

  const memoryMergeDecisions = await mergeAwarenessCandidates({
    episode,
    insights,
    now,
    dataRoot,
  });

  await appendAwarenessEpisode(episode, dataRoot);
  const workItems = await syncWorkItemsFromInsights({
    userId: input.userId,
    insights,
    now,
    dataRoot,
  });
  const projects = await aggregateProjects({
    userId: input.userId,
    now,
    dataRoot,
  });
  const recallEvents = flags.recall
    ? await evaluateRecallCandidates({
        userId: input.userId,
        snapshot,
        now,
        dataRoot,
      })
    : [];

  await appendGrowthLog(
    input.userId,
    {
      at: now,
      stage: "manual-distillation",
      insightCount: insights.length,
      memoryMergeDecisions,
      workItemCount: workItems.length,
      projectCount: projects.projects.length,
      recallEventCount: recallEvents.length,
    },
    dataRoot,
  );

  return {
    episode,
    memoryMergeDecisions,
    workItems,
    projects: projects.projects.length ? projects : await loadProjectsState(input.userId, dataRoot),
    recallEvents,
  };
}
