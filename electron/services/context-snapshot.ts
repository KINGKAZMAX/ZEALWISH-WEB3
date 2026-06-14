import type { ContextSnapshot } from "../../src/types";
import {
  loadCharacter,
  loadGrowthInsights,
  loadGrowthProfile,
  loadOCHistory,
  loadRecentSummaries,
  loadRelationship,
} from "./memory";
import { getAirJellyContext } from "./airjelly";
import { getMemoryFeatureFlags } from "./feature-flags";
import { ensureUnifiedMemoryRepository, loadRetrievedMemoryBundle } from "./unified-memory";

function createEmptyRetrievedMemoryBundle() {
  return {
    longTermFacts: "",
    voiceHints: "",
    systemReminders: "",
    activeProjects: [],
    relevantWorkItems: [],
    recentAwarenessHighlights: [],
  };
}

export async function buildContextSnapshot(input: {
  userId: string;
  characterId: string;
  recentChatLimit?: number;
  summariesLimit?: number;
  dataRoot?: string;
}): Promise<ContextSnapshot> {
  const flags = getMemoryFeatureFlags();
  if (flags.unifiedMemory) {
    await ensureUnifiedMemoryRepository(input.userId, input.dataRoot);
  }

  const [airjellyCtx, wxMemories, recentChat, relationship, character, growthProfile, insights, retrievedMemoryBundle] = await Promise.all([
    getAirJellyContext(input.dataRoot),
    loadRecentSummaries(input.userId, input.summariesLimit ?? 3, input.dataRoot),
    loadOCHistory(input.userId, input.recentChatLimit ?? 10, input.dataRoot),
    loadRelationship(input.userId, input.dataRoot),
    loadCharacter(input.characterId, input.dataRoot),
    loadGrowthProfile(input.userId, input.dataRoot),
    loadGrowthInsights(input.userId, input.dataRoot),
    flags.unifiedMemory ? loadRetrievedMemoryBundle(input.userId, input.dataRoot) : Promise.resolve(createEmptyRetrievedMemoryBundle()),
  ]);

  return {
    builtAt: Date.now(),
    airjellyCtx,
    wxMemories,
    recentChat,
    relationship,
    character,
    growthProfile,
    latentInsights: insights.filter((item) => item.status === "latent" || item.status === "suggested"),
    retrievedMemoryBundle,
    realtimeContext: airjellyCtx,
    socialMemory: wxMemories,
    conversationState: {
      recentChat,
    },
    relationshipState: relationship,
    characterState: character,
  };
}
