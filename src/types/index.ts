export type Emotion = "idle" | "happy" | "shy" | "thinking" | "sad" | "angry";

export interface AppEvent {
  title: string;
  appName: string;
  durationSeconds: number;
  timestamp: number;
}

export interface TaskSummary {
  title: string;
  progressSummary: string;
  dueDate?: number;
}

export interface AppUsage {
  appName: string;
  totalSeconds: number;
}

export interface AirJellyContext {
  events: AppEvent[];
  tasks: TaskSummary[];
  appUsage: AppUsage[];
  source: "mock" | "airjelly";
}

export interface ChatMessage {
  timestamp: number;
  sender: string;
  content: string;
  type: "text" | "image" | "voice" | "quote" | "emoji";
}

export interface MemorySummary {
  period: string;
  topics: string[];
  emotions: string[];
  keyMoments: string[];
  relationshipSignals: {
    closeness: number;
    note: string;
  };
}

export interface GrowthMoment {
  date: string;
  event: string;
  impact: number;
}

export type RelationshipStage =
  | "stranger"
  | "acquaintance"
  | "friend"
  | "close_friend"
  | "soulmate";

export interface Relationship {
  userId: string;
  userName: string;
  intimacy: number;
  stage: RelationshipStage;
  preferences: {
    topics: string[];
    avoid: string[];
    communicationStyle: string;
  };
  keyMoments: GrowthMoment[];
  lastInteraction: number;
  moodBaseline: string;
}

export type CharacterGender = "female" | "male" | "other";

export interface CharacterConfig {
  id: string;
  name: string;
  personality: string;
  catchphrase: string;
  relationshipSetup: string;
  avatarLabel: string;
  avatarPath?: string;
  gender?: CharacterGender;
}

export interface ChatHistoryEntry {
  timestamp: number;
  userMessage: string;
  ocResponse: string;
  emotion: Emotion;
}

export interface PendingChatMessage {
  id: string;
  timestamp: number;
  content: string;
}

export interface ChatSendPayload {
  characterId: string;
  userId: string;
  userMessage: string;
  userMessages?: string[];
  requestId?: string;
  interrupt?: boolean;
}

export interface ChatCancelPayload {
  characterId: string;
  userId: string;
}

export interface ChatResponse {
  text: string;
  emotion: Emotion;
  growthEvent: string | null;
}

export interface ChatResult extends ChatResponse {
  intimacy: number;
  stage: RelationshipStage;
  source: AirJellyContext["source"];
}

export type GrowthInsightType =
  | "goal"
  | "strength"
  | "evidence"
  | "plan"
  | "preference"
  | "open_question";

export type GrowthInsightStatus =
  | "latent"
  | "suggested"
  | "confirmed"
  | "rejected"
  | "archived";

export type GrowthEvidenceSource = "chat" | "relationship" | "manual";

export interface GrowthEvidence {
  id: string;
  source: GrowthEvidenceSource;
  text: string;
  timestamp: number;
  ref?: {
    messageId?: string;
  };
}

export interface GrowthInsight {
  id: string;
  userId: string;
  type: GrowthInsightType;
  title: string;
  text: string;
  evidenceIds: string[];
  confidence: number;
  status: GrowthInsightStatus;
  createdAt: number;
  updatedAt: number;
  lastSuggestedAt?: number;
  userFeedback?: string;
}

export interface ConfirmedGrowthItem {
  id: string;
  title: string;
  text: string;
  evidenceIds: string[];
  confidence: number;
  confirmedAt: number;
}

export interface GrowthProfile {
  userId: string;
  updatedAt: number;
  goals: ConfirmedGrowthItem[];
  strengths: ConfirmedGrowthItem[];
  preferences: ConfirmedGrowthItem[];
  openQuestions: ConfirmedGrowthItem[];
}

export interface RevealCandidate {
  id: string;
  userId: string;
  insightId: string;
  reason: string;
  priority: number;
  status: "pending" | "shown" | "dismissed" | "confirmed";
  createdAt: number;
  shownAt?: number;
}

export interface LongTermMemory {
  userId: string;
  memoryMarkdown: string;
  voiceMarkdown: string;
  systemRemindersMarkdown: string;
  updatedAt: number;
}

export type AwarenessSource = "chat" | "airjelly" | "manual";

export interface AwarenessEpisode {
  id: string;
  userId: string;
  source: AwarenessSource;
  createdAt: number;
  title: string;
  keyMoments: string[];
  behaviorSignals: string[];
  candidateMemoryUpdates: string[];
  openThreads: string[];
  relatedInsightIds: string[];
}

export type WorkItemStatus = "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
export type WorkItemSource = "chat" | "airjelly" | "manual" | "distillation";

export interface WorkItemNote {
  at: number;
  text: string;
  source: WorkItemSource;
}

export interface WorkItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: WorkItemStatus;
  source: WorkItemSource;
  relatedSignals: string[];
  notes: WorkItemNote[];
  summary: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  workItemIds: string[];
  confidence: number;
  rationale: string;
  updatedAt: number;
}

export interface ProjectsState {
  version: 1;
  generatedAt: number;
  userId: string;
  projects: Project[];
}

export interface RecallEvent {
  id: string;
  userId: string;
  signal: string;
  text: string;
  source: "airjelly" | "memory" | "work-item";
  status: "candidate" | "shown" | "dismissed";
  createdAt: number;
}

export interface RecallSignalState {
  userId: string;
  signal: string;
  count: number;
  firstSeenAt: number;
  lastSeenAt: number;
  lastTriggeredAt?: number;
}

export interface RecallEvaluatePayload {
  userId: string;
  characterId?: string;
}

export interface RecallHintEvent extends RecallEvent {
  emittedAt: number;
}

export interface MemoryMergeDecision {
  episodeId: string;
  insightId: string | null;
  status: "merged" | "deferred" | "discarded";
  target: "memory" | "voice" | "none";
  reason: string;
  text: string;
}

export interface ManualDistillationResult {
  episode: AwarenessEpisode;
  memoryMergeDecisions: MemoryMergeDecision[];
  workItems: WorkItem[];
  projects: ProjectsState;
  recallEvents: RecallEvent[];
}

export interface RetrievedMemoryBundle {
  longTermFacts: string;
  voiceHints: string;
  systemReminders: string;
  activeProjects: Project[];
  relevantWorkItems: WorkItem[];
  recentAwarenessHighlights: AwarenessEpisode[];
}

export interface ContextSnapshot {
  builtAt: number;
  airjellyCtx: AirJellyContext;
  wxMemories: MemorySummary[];
  recentChat: ChatHistoryEntry[];
  relationship: Relationship;
  character: CharacterConfig;
  growthProfile: GrowthProfile;
  latentInsights: GrowthInsight[];
  retrievedMemoryBundle: RetrievedMemoryBundle;
  realtimeContext: AirJellyContext;
  socialMemory: MemorySummary[];
  conversationState: {
    recentChat: ChatHistoryEntry[];
  };
  relationshipState: Relationship;
  characterState: CharacterConfig;
}

export interface TtsSynthesizePayload {
  text: string;
  requestId?: string;
  userId?: string;
  characterId?: string;
  interrupt?: boolean;
}

export interface TtsCancelPayload {
  requestId?: string;
}

export interface TtsSynthesizeResult {
  provider: "stepfun";
  requestId: string;
  audioBase64: string;
  mimeType: string;
  encoding: string;
  durationMs: number | null;
}

export interface TtsProviderStatus {
  provider: "browser" | "stepfun";
  configured: boolean;
  voiceType: string | null;
  lastError: string | null;
}

export interface AsrStartPayload {
  sessionId: string;
  userId?: string;
  language?: string;
}

export interface AsrAudioPayload {
  sessionId: string;
  audio: ArrayBuffer;
}

export interface AsrStopPayload {
  sessionId: string;
}

export interface AsrTranscriptEvent {
  sessionId: string;
  text: string;
  isFinal: boolean;
}

export interface AsrErrorEvent {
  sessionId: string;
  message: string;
}

export interface AsrProviderStatus {
  provider: "stepfun";
  configured: boolean;
  resourceId: string | null;
  lastError: string | null;
}

export type HermesRuntimeState = "disabled" | "starting" | "healthy" | "unhealthy" | "crashed" | "stopped";

export interface HermesRuntimeStatus {
  state: HermesRuntimeState;
  pid: number | null;
  restartCount: number;
  lastError: string | null;
  lastStartedAt: number | null;
  lastHealthCheckAt: number | null;
}

export interface TimelineItem extends GrowthMoment {
  intimacyAfter: number;
}

export interface CreateCharacterInput {
  name: string;
  personality: string;
  catchphrase: string;
  relationshipSetup: string;
}

export interface ImageGenPayload {
  prompt: string;
  provider?: string;
  model?: string;
  aspectRatio?: string;
  imageSize?: string;
  imageConfig?: {
    aspectRatio?: string;
    imageSize?: string;
  };
  cacheKey?: string;
  force?: boolean;
}

export interface ImageGenResult {
  imageBase64: string;
  mimeType: string;
  savedPath?: string;
  cached?: boolean;
}
