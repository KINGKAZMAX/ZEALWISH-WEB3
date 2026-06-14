import type { Relationship, RelationshipStage } from "../../src/types";

export function containsPositive(message: string) {
  return /(谢谢|辛苦|喜欢|太好了|爱你|开心|棒)/.test(message);
}

export function containsNegative(message: string) {
  return /(烦|滚|闭嘴|别吵|无语|算了)/.test(message);
}

export function containsPersonal(message: string) {
  return /(我觉得|我有点|我最近|我昨天|压力|焦虑|难受|开心|害怕)/.test(message);
}

export function calculateIntimacyDelta(userMessage: string, currentIntimacy: number): number {
  let delta = 1;

  if (containsPositive(userMessage)) {
    delta += 2;
  }

  if (containsPersonal(userMessage)) {
    delta += 2;
  }

  if (userMessage.trim().length > 40) {
    delta += 1;
  }

  if (containsNegative(userMessage)) {
    delta -= 2;
  }

  if (userMessage.trim().length < 3) {
    delta -= 1;
  }

  const multiplier = Math.max(0.3, 1 - currentIntimacy / 150);
  return Math.max(-5, Math.min(5, Math.round(delta * multiplier)));
}

export function getStage(intimacy: number): RelationshipStage {
  if (intimacy < 20) {
    return "stranger";
  }

  if (intimacy < 50) {
    return "acquaintance";
  }

  if (intimacy < 80) {
    return "friend";
  }

  if (intimacy < 95) {
    return "close_friend";
  }

  return "soulmate";
}

export function updateRelationshipState(
  relationship: Relationship,
  intimacyDelta: number,
  growthEvent: string | null,
): Relationship {
  const nextIntimacy = Math.max(0, Math.min(100, relationship.intimacy + intimacyDelta));
  const nextKeyMoments = growthEvent
    ? [
        ...relationship.keyMoments,
        {
          date: new Date().toISOString(),
          event: growthEvent,
          impact: intimacyDelta,
        },
      ]
    : relationship.keyMoments;

  return {
    ...relationship,
    intimacy: nextIntimacy,
    stage: getStage(nextIntimacy),
    lastInteraction: Date.now(),
    keyMoments: nextKeyMoments,
  };
}
