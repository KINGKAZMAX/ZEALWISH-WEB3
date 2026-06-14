import type { GrowthProfile, GrowthInsight } from "../../src/types";

function toConfirmedItem(insight: GrowthInsight, confirmedAt: number) {
  return {
    id: insight.id,
    title: insight.title,
    text: insight.text,
    evidenceIds: insight.evidenceIds,
    confidence: insight.confidence,
    confirmedAt,
  };
}

export function confirmInsightToProfile(input: {
  profile: GrowthProfile;
  insight: GrowthInsight;
  now: number;
}): GrowthProfile {
  const confirmedItem = toConfirmedItem(input.insight, input.now);
  const nextProfile = {
    ...input.profile,
    updatedAt: input.now,
  };

  if (input.insight.type === "goal") {
    return {
      ...nextProfile,
      goals: [...nextProfile.goals.filter((item) => item.id !== input.insight.id), confirmedItem],
    };
  }

  if (input.insight.type === "strength") {
    return {
      ...nextProfile,
      strengths: [...nextProfile.strengths.filter((item) => item.id !== input.insight.id), confirmedItem],
    };
  }

  if (input.insight.type === "preference") {
    return {
      ...nextProfile,
      preferences: [...nextProfile.preferences.filter((item) => item.id !== input.insight.id), confirmedItem],
    };
  }

  if (input.insight.type === "open_question") {
    return {
      ...nextProfile,
      openQuestions: [...nextProfile.openQuestions.filter((item) => item.id !== input.insight.id), confirmedItem],
    };
  }

  return nextProfile;
}

export function buildConfirmedProfileSummary(profile: GrowthProfile) {
  const sections = [
    profile.goals.length
      ? `长期目标：${profile.goals.map((item) => item.title).join("；")}`
      : "",
    profile.strengths.length
      ? `已确认优势：${profile.strengths.map((item) => item.title).join("；")}`
      : "",
    profile.preferences.length
      ? `沟通偏好：${profile.preferences.map((item) => item.title).join("；")}`
      : "",
    profile.openQuestions.length
      ? `开放问题：${profile.openQuestions.map((item) => item.title).join("；")}`
      : "",
  ].filter(Boolean);

  return sections.join("\n");
}
