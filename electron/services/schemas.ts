import { z } from "zod";
import type {
  AirJellyContext,
  CharacterConfig,
  ChatHistoryEntry,
  GrowthEvidence,
  GrowthInsight,
  GrowthProfile,
  MemorySummary,
  Project,
  ProjectsState,
  RecallEvent,
  RecallSignalState,
  Relationship,
  RevealCandidate,
  WorkItem,
} from "../../src/types";

const appEventSchema = z.object({
  title: z.string(),
  appName: z.string(),
  durationSeconds: z.number(),
  timestamp: z.number(),
});

const taskSchema = z.object({
  title: z.string(),
  progressSummary: z.string(),
  dueDate: z.number().optional(),
});

const appUsageSchema = z.object({
  appName: z.string(),
  totalSeconds: z.number(),
});

const airJellyContextSchema = z.object({
  events: z.array(appEventSchema),
  tasks: z.array(taskSchema),
  appUsage: z.array(appUsageSchema),
  source: z.enum(["mock", "airjelly"]),
});

const summarySchema = z.object({
  period: z.string(),
  topics: z.array(z.string()),
  emotions: z.array(z.string()),
  keyMoments: z.array(z.string()),
  relationshipSignals: z.object({
    closeness: z.number(),
    note: z.string(),
  }),
});

const relationshipSchema = z.object({
  userId: z.string(),
  userName: z.string().default("主人"),
  intimacy: z.number(),
  stage: z.enum(["stranger", "acquaintance", "friend", "close_friend", "soulmate"]),
  preferences: z.object({
    topics: z.array(z.string()),
    avoid: z.array(z.string()),
    communicationStyle: z.string(),
  }),
  keyMoments: z.array(
    z.object({
      date: z.string(),
      event: z.string(),
      impact: z.number(),
    }),
  ),
  lastInteraction: z.number(),
  moodBaseline: z.string(),
});

const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  personality: z.string(),
  catchphrase: z.string(),
  relationshipSetup: z.string(),
  avatarLabel: z.string(),
  avatarPath: z.string().optional(),
});

const historySchema = z.object({
  timestamp: z.number(),
  userMessage: z.string(),
  ocResponse: z.string(),
  emotion: z.enum(["idle", "happy", "shy", "thinking", "sad", "angry"]),
});

const growthEvidenceSchema = z.object({
  id: z.string(),
  source: z.enum(["chat", "relationship", "manual"]),
  text: z.string(),
  timestamp: z.number(),
  ref: z
    .object({
      messageId: z.string().optional(),
    })
    .optional(),
});

const growthInsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["goal", "strength", "evidence", "plan", "preference", "open_question"]),
  title: z.string(),
  text: z.string(),
  evidenceIds: z.array(z.string()),
  confidence: z.number(),
  status: z.enum(["latent", "suggested", "confirmed", "rejected", "archived"]),
  createdAt: z.number(),
  updatedAt: z.number(),
  lastSuggestedAt: z.number().optional(),
  userFeedback: z.string().optional(),
});

const confirmedGrowthItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  evidenceIds: z.array(z.string()),
  confidence: z.number(),
  confirmedAt: z.number(),
});

const growthProfileSchema = z.object({
  userId: z.string(),
  updatedAt: z.number(),
  goals: z.array(confirmedGrowthItemSchema),
  strengths: z.array(confirmedGrowthItemSchema),
  preferences: z.array(confirmedGrowthItemSchema),
  openQuestions: z.array(confirmedGrowthItemSchema),
});

const revealCandidateSchema = z.object({
  id: z.string(),
  userId: z.string(),
  insightId: z.string(),
  reason: z.string(),
  priority: z.number(),
  status: z.enum(["pending", "shown", "dismissed", "confirmed"]),
  createdAt: z.number(),
  shownAt: z.number().optional(),
});

const awarenessEpisodeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  source: z.enum(["chat", "airjelly", "manual"]),
  createdAt: z.number(),
  title: z.string(),
  keyMoments: z.array(z.string()),
  behaviorSignals: z.array(z.string()),
  candidateMemoryUpdates: z.array(z.string()),
  openThreads: z.array(z.string()),
  relatedInsightIds: z.array(z.string()).default([]),
});

const workItemNoteSchema = z.object({
  at: z.number(),
  text: z.string(),
  source: z.enum(["chat", "airjelly", "manual", "distillation"]),
});

const workItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "cancelled"]),
  source: z.enum(["chat", "airjelly", "manual", "distillation"]),
  relatedSignals: z.array(z.string()),
  notes: z.array(workItemNoteSchema),
  summary: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const projectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  workItemIds: z.array(z.string()),
  confidence: z.number(),
  rationale: z.string(),
  updatedAt: z.number(),
});

const projectsStateSchema = z.object({
  version: z.literal(1),
  generatedAt: z.number(),
  userId: z.string(),
  projects: z.array(projectSchema),
});

const recallEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  signal: z.string(),
  text: z.string(),
  source: z.enum(["airjelly", "memory", "work-item"]),
  status: z.enum(["candidate", "shown", "dismissed"]),
  createdAt: z.number(),
});

const recallSignalStateSchema = z.object({
  userId: z.string(),
  signal: z.string(),
  count: z.number(),
  firstSeenAt: z.number(),
  lastSeenAt: z.number(),
  lastTriggeredAt: z.number().optional(),
});

export const airJellyContextListSchema = airJellyContextSchema;
export const memorySummaryListSchema = z.array(summarySchema);
export const relationshipStateSchema = relationshipSchema;
export const characterConfigSchema = characterSchema;
export const chatHistoryListSchema = z.array(historySchema);
export const growthEvidenceListSchema = z.array(growthEvidenceSchema);
export const growthInsightListSchema = z.array(growthInsightSchema);
export const growthProfileStateSchema = growthProfileSchema;
export const revealQueueSchema = z.array(revealCandidateSchema);
export const awarenessEpisodeStateSchema = awarenessEpisodeSchema;
export const workItemStateSchema = workItemSchema;
export const workItemListSchema = z.array(workItemSchema);
export const projectsStateListSchema = projectsStateSchema;
export const recallEventListSchema = z.array(recallEventSchema);
export const recallSignalStateListSchema = z.array(recallSignalStateSchema);

export function parseAirJellyContext(value: unknown): AirJellyContext {
  return airJellyContextListSchema.parse(value) as AirJellyContext;
}

export function parseMemorySummaryList(value: unknown): MemorySummary[] {
  return memorySummaryListSchema.parse(value) as MemorySummary[];
}

export function parseRelationship(value: unknown): Relationship {
  return relationshipStateSchema.parse(value) as Relationship;
}

export function parseCharacter(value: unknown): CharacterConfig {
  return characterConfigSchema.parse(value) as CharacterConfig;
}

export function parseHistory(value: unknown): ChatHistoryEntry[] {
  return chatHistoryListSchema.parse(value) as ChatHistoryEntry[];
}

export function parseGrowthEvidenceList(value: unknown): GrowthEvidence[] {
  return growthEvidenceListSchema.parse(value) as GrowthEvidence[];
}

export function parseGrowthInsightList(value: unknown): GrowthInsight[] {
  return growthInsightListSchema.parse(value) as GrowthInsight[];
}

export function parseGrowthProfile(value: unknown): GrowthProfile {
  return growthProfileStateSchema.parse(value) as GrowthProfile;
}

export function parseRevealQueue(value: unknown): RevealCandidate[] {
  return revealQueueSchema.parse(value) as RevealCandidate[];
}

export function parseAwarenessEpisode(value: unknown) {
  return awarenessEpisodeStateSchema.parse(value);
}

export function parseWorkItem(value: unknown): WorkItem {
  return workItemStateSchema.parse(value) as WorkItem;
}

export function parseWorkItemList(value: unknown): WorkItem[] {
  return workItemListSchema.parse(value) as WorkItem[];
}

export function parseProjectsState(value: unknown): ProjectsState {
  return projectsStateListSchema.parse(value) as ProjectsState;
}

export function parseRecallEventList(value: unknown): RecallEvent[] {
  return recallEventListSchema.parse(value) as RecallEvent[];
}

export function parseRecallSignalStateList(value: unknown): RecallSignalState[] {
  return recallSignalStateListSchema.parse(value) as RecallSignalState[];
}
