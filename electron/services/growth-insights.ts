import type { GrowthEvidence, GrowthInsight } from "../../src/types";

interface MergeGrowthArtifactsInput {
  existingEvidence: GrowthEvidence[];
  existingInsights: GrowthInsight[];
  incomingEvidence: GrowthEvidence[];
  incomingInsights: GrowthInsight[];
  now: number;
}

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

export function mergeGrowthArtifacts(input: MergeGrowthArtifactsInput): {
  evidence: GrowthEvidence[];
  insights: GrowthInsight[];
} {
  const evidence = [...input.existingEvidence, ...input.incomingEvidence];
  const insights = [...input.existingInsights];

  for (const incomingInsight of input.incomingInsights) {
    const existingIndex = insights.findIndex(
      (item) => item.type === incomingInsight.type && normalizeTitle(item.title) === normalizeTitle(incomingInsight.title),
    );

    if (existingIndex === -1) {
      insights.push(incomingInsight);
      continue;
    }

    const existingInsight = insights[existingIndex];
    const evidenceIds = Array.from(new Set([...existingInsight.evidenceIds, ...incomingInsight.evidenceIds]));
    insights[existingIndex] = {
      ...existingInsight,
      text: incomingInsight.text,
      evidenceIds,
      confidence: Math.min(0.95, Number((existingInsight.confidence + incomingInsight.confidence - 0.2).toFixed(2))),
      updatedAt: input.now,
    };
  }

  return { evidence, insights };
}

interface RejectInsightInput {
  insights: GrowthInsight[];
  insightId: string;
  feedback?: string;
  now: number;
}

export function rejectInsight(input: RejectInsightInput): GrowthInsight[] {
  return input.insights.map((insight) =>
    insight.id === input.insightId
      ? {
          ...insight,
          status: "rejected" as const,
          userFeedback: input.feedback,
          updatedAt: input.now,
        }
      : insight,
  );
}
