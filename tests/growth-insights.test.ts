import { describe, expect, it } from "vitest";
import { mergeGrowthArtifacts, rejectInsight } from "../electron/services/growth-insights";

describe("growth insights service", () => {
  it("raises confidence when the same insight appears again", () => {
    const merged = mergeGrowthArtifacts({
      existingEvidence: [
        { id: "e-1", source: "chat", text: "我想做一个会慢慢理解人的成长伙伴。", timestamp: 1 },
      ],
      existingInsights: [
        {
          id: "i-1",
          userId: "user-001",
          type: "goal",
          title: "做一个会慢慢理解人的成长伙伴",
          text: "你反复在朝这个目标靠近：做一个会慢慢理解人的成长伙伴。",
          evidenceIds: ["e-1"],
          confidence: 0.45,
          status: "latent",
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      incomingEvidence: [
        { id: "e-2", source: "chat", text: "我还是想做一个会慢慢理解人的成长伙伴。", timestamp: 2 },
      ],
      incomingInsights: [
        {
          id: "i-2",
          userId: "user-001",
          type: "goal",
          title: "做一个会慢慢理解人的成长伙伴",
          text: "你反复在朝这个目标靠近：做一个会慢慢理解人的成长伙伴。",
          evidenceIds: ["e-2"],
          confidence: 0.45,
          status: "latent",
          createdAt: 2,
          updatedAt: 2,
        },
      ],
      now: 2,
    });

    expect(merged.evidence).toHaveLength(2);
    expect(merged.insights).toHaveLength(1);
    expect(merged.insights[0]).toEqual(
      expect.objectContaining({
        evidenceIds: ["e-1", "e-2"],
        confidence: 0.7,
        updatedAt: 2,
      }),
    );
  });

  it("marks an insight rejected and stores feedback", () => {
    const rejected = rejectInsight({
      insights: [
        {
          id: "i-1",
          userId: "user-001",
          type: "goal",
          title: "做一个会慢慢理解人的成长伙伴",
          text: "你反复在朝这个目标靠近：做一个会慢慢理解人的成长伙伴。",
          evidenceIds: ["e-1"],
          confidence: 0.7,
          status: "suggested",
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      insightId: "i-1",
      feedback: "方向不对",
      now: 3,
    });

    expect(rejected[0]).toEqual(
      expect.objectContaining({
        status: "rejected",
        userFeedback: "方向不对",
        updatedAt: 3,
      }),
    );
  });
});
