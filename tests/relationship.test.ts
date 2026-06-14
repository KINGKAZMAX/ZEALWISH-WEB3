import { describe, expect, it } from "vitest";
import { calculateIntimacyDelta, getStage, updateRelationshipState } from "../electron/services/relationship";
import { DEFAULT_RELATIONSHIP } from "../electron/services/demo-fallback";

describe("relationship service", () => {
  it("increases intimacy for positive personal message", () => {
    const delta = calculateIntimacyDelta("我最近压力有点大，但还是想把 demo 跑通，谢谢你盯着我", 40);
    expect(delta).toBeGreaterThan(0);
  });

  it("maps stage by intimacy", () => {
    expect(getStage(10)).toBe("stranger");
    expect(getStage(35)).toBe("acquaintance");
    expect(getStage(65)).toBe("friend");
    expect(getStage(85)).toBe("close_friend");
    expect(getStage(99)).toBe("soulmate");
  });

  it("returns immutable relationship update", () => {
    const next = updateRelationshipState(DEFAULT_RELATIONSHIP, 5, "她第一次公开夸你做出来了");

    expect(next).not.toBe(DEFAULT_RELATIONSHIP);
    expect(next.intimacy).toBe(DEFAULT_RELATIONSHIP.intimacy + 5);
    expect(next.keyMoments.length).toBe(DEFAULT_RELATIONSHIP.keyMoments.length + 1);
  });
});
