import type { AwarenessEpisode, ContextSnapshot, GrowthEvidence, GrowthInsight } from "../../src/types";

interface DistillGrowthTurnInput {
  userId: string;
  userMessage: string;
  ocResponse: string;
  growthEvent: string | null;
  now: number;
  snapshot: ContextSnapshot;
}

interface DistillGrowthTurnResult {
  evidence: GrowthEvidence[];
  insights: GrowthInsight[];
  awareness: AwarenessEpisode;
}

const GOAL_PATTERNS = [
  /我想(做一个[^。！？\n]+)/,
  /我还是想(做一个[^。！？\n]+)/,
  /(做一个[^。！？\n]+)/,
];

function createEvidence(id: string, text: string, timestamp: number): GrowthEvidence {
  return {
    id,
    source: "chat",
    text,
    timestamp,
  };
}

function extractGoalTitle(message: string) {
  for (const pattern of GOAL_PATTERNS) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

export function distillGrowthTurn(input: DistillGrowthTurnInput): DistillGrowthTurnResult {
  const evidence: GrowthEvidence[] = [];
  const trimmedUserMessage = input.userMessage.trim();
  evidence.push(createEvidence(`evidence-user-${input.now}`, trimmedUserMessage, input.now));

  const goalTitle = extractGoalTitle(trimmedUserMessage);
  if (goalTitle) {
    evidence.push(createEvidence(`evidence-goal-${input.now}`, `目标线索：${goalTitle}`, input.now));
  }

  const insightId = `insight-${input.now}`;
  const awareness: AwarenessEpisode = {
    id: `awareness-${input.now}`,
    userId: input.userId,
    source: "chat",
    createdAt: input.now,
    title: goalTitle ? `目标线索：${goalTitle}` : "对话轮次候选观察",
    keyMoments: [
      trimmedUserMessage,
      input.ocResponse.trim(),
      input.growthEvent ? `关系事件：${input.growthEvent}` : "",
    ].filter(Boolean),
    behaviorSignals: [
      goalTitle ? `明确目标表达：${goalTitle}` : "",
      input.snapshot.realtimeContext.tasks.length
        ? `当前 AirJelly 待办：${input.snapshot.realtimeContext.tasks.map((task) => task.title).join("；")}`
        : "",
    ].filter(Boolean),
    candidateMemoryUpdates: goalTitle ? [`用户可能在推进：${goalTitle}`] : [],
    openThreads: goalTitle ? ["需要等待更多证据或用户确认后再写入长期记忆。"] : ["本轮信息较弱，暂时只保留为 awareness。"],
    relatedInsightIds: goalTitle ? [insightId] : [],
  };

  if (!goalTitle) {
    return { evidence, insights: [], awareness };
  }

  return {
    evidence,
    awareness,
    insights: [
      {
        id: insightId,
        userId: input.userId,
        type: "goal",
        title: goalTitle,
        text: `你反复在朝这个目标靠近：${goalTitle}。`,
        evidenceIds: evidence.map((item) => item.id),
        confidence: 0.45,
        status: "latent",
        createdAt: input.now,
        updatedAt: input.now,
      },
    ],
  };
}
