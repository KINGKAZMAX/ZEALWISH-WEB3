import type { AwarenessEpisode, GrowthInsight } from "../../src/types";
import { appendAwarenessNote, appendConfirmedMemoryNote } from "./unified-memory";

type MemoryMergeDecisionStatus = "merged" | "deferred" | "discarded";

export interface MemoryMergeDecision {
  episodeId: string;
  insightId: string | null;
  status: MemoryMergeDecisionStatus;
  target: "memory" | "voice" | "none";
  reason: string;
  text: string;
}

function getMergeTarget(insight: GrowthInsight | undefined): "memory" | "voice" | "none" {
  if (!insight) {
    return "none";
  }

  return insight.type === "preference" ? "voice" : "memory";
}

function createDecision(input: {
  episode: AwarenessEpisode;
  insight: GrowthInsight | undefined;
  candidate: string;
}): MemoryMergeDecision {
  const target = getMergeTarget(input.insight);

  if (!input.insight) {
    return {
      episodeId: input.episode.id,
      insightId: null,
      status: "deferred",
      target: "none",
      reason: "候选项还没有对应 insight，先保留在 awareness。",
      text: input.candidate,
    };
  }

  if (input.insight.status === "confirmed") {
    return {
      episodeId: input.episode.id,
      insightId: input.insight.id,
      status: "merged",
      target,
      reason: "用户已确认 insight，可以进入长期记忆。",
      text: input.insight.text,
    };
  }

  if (input.insight.status === "rejected" || input.insight.status === "archived") {
    return {
      episodeId: input.episode.id,
      insightId: input.insight.id,
      status: "discarded",
      target: "none",
      reason: `insight 已经是 ${input.insight.status}，不进入长期记忆。`,
      text: input.candidate,
    };
  }

  return {
    episodeId: input.episode.id,
    insightId: input.insight.id,
    status: "deferred",
    target: "none",
    reason: `insight 当前为 ${input.insight.status}，等待更多证据或用户确认。`,
    text: input.candidate,
  };
}

export async function mergeAwarenessCandidates(input: {
  episode: AwarenessEpisode;
  insights: GrowthInsight[];
  now: number;
  dataRoot?: string;
}): Promise<MemoryMergeDecision[]> {
  const decisions = input.episode.candidateMemoryUpdates.map((candidate, index) => {
    const relatedInsightId = input.episode.relatedInsightIds[index] ?? input.episode.relatedInsightIds[0];
    const insight = input.insights.find((item) => item.id === relatedInsightId);
    return createDecision({
      episode: input.episode,
      insight,
      candidate,
    });
  });

  for (const decision of decisions) {
    if (decision.status !== "merged" || !decision.insightId || decision.target === "none") {
      continue;
    }

    const insight = input.insights.find((item) => item.id === decision.insightId);
    await appendConfirmedMemoryNote({
      insightId: decision.insightId,
      title: insight?.title ?? decision.text,
      text: decision.text,
      type: decision.target,
      now: input.now,
      dataRoot: input.dataRoot,
    });
  }

  await appendAwarenessNote({
    userId: input.episode.userId,
    episodeId: input.episode.id,
    now: input.now,
    dataRoot: input.dataRoot,
    lines: decisions.map((decision) => `${decision.status} ${decision.target} ${decision.insightId ?? "no-insight"}：${decision.reason}`),
  });

  return decisions;
}
