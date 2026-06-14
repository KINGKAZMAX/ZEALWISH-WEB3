import type {
  AirJellyContext,
  AwarenessEpisode,
  AsrAudioPayload,
  AsrErrorEvent,
  AsrProviderStatus,
  AsrStartPayload,
  AsrStopPayload,
  AsrTranscriptEvent,
  CharacterConfig,
  ChatCancelPayload,
  ChatHistoryEntry,
  ChatResponse,
  ChatResult,
  ChatSendPayload,
  GrowthInsight,
  GrowthProfile,
  HermesRuntimeStatus,
  ImageGenPayload,
  ImageGenResult,
  LongTermMemory,
  ManualDistillationResult,
  MemorySummary,
  ProjectsState,
  RecallEvent,
  RecallEvaluatePayload,
  RecallHintEvent,
  Relationship,
  RevealCandidate,
  TtsCancelPayload,
  TtsProviderStatus,
  TtsSynthesizePayload,
  TtsSynthesizeResult,
  TimelineItem,
  WorkItem,
} from "./index";

declare global {
  interface Window {
    /** Phaser game engine (loaded dynamically for WorldView) */
    Phaser?: typeof import("phaser");
    /** Internal state reference for the WorldView Phaser scene */
    __worldState?: Record<string, unknown>;
    ocWorld?: {
      getAppPath: () => string;
      chat: {
        sendMessage: (payload: ChatSendPayload) => Promise<ChatResult>;
        cancelActive: (payload: ChatCancelPayload) => Promise<boolean>;
        getGreeting: (payload: { characterId: string; userId: string }) => Promise<ChatResponse>;
      };
      tts: {
        synthesize: (payload: TtsSynthesizePayload) => Promise<TtsSynthesizeResult>;
        cancelActive: (payload?: TtsCancelPayload) => Promise<boolean>;
        getStatus: () => Promise<TtsProviderStatus>;
      };
      asr: {
        start: (payload: AsrStartPayload) => Promise<AsrProviderStatus>;
        sendAudio: (payload: AsrAudioPayload) => void;
        stop: (payload: AsrStopPayload) => Promise<boolean>;
        getStatus: () => Promise<AsrProviderStatus>;
        onTranscript: (callback: (event: AsrTranscriptEvent) => void) => () => void;
        onError: (callback: (event: AsrErrorEvent) => void) => () => void;
      };
      character: {
        getCurrent: (characterId: string) => Promise<CharacterConfig>;
        saveCurrent: (payload: { characterId: string; character: CharacterConfig }) => Promise<CharacterConfig>;
      };
      timeline: {
        list: (userId: string) => Promise<TimelineItem[]>;
      };
      relationship: {
        get: (userId: string) => Promise<Relationship>;
        save: (payload: { userId: string; relationship: Relationship }) => Promise<Relationship>;
        setIntimacyForDemo: (payload: { userId: string; intimacy: number }) => Promise<Relationship>;
      };
      memory: {
        summaries: (userId: string) => Promise<MemorySummary[]>;
        history: (userId: string) => Promise<ChatHistoryEntry[]>;
        getLongTerm: (userId: string) => Promise<LongTermMemory>;
        getVoice: (userId: string) => Promise<{ userId: string; voiceMarkdown: string; updatedAt: number }>;
        runDistill: (payload: { userId: string; characterId?: string }) => Promise<ManualDistillationResult>;
      };
      awareness: {
        list: (payload: { userId: string; limit?: number }) => Promise<AwarenessEpisode[]>;
      };
      workItems: {
        list: (userId: string) => Promise<WorkItem[]>;
      };
      projects: {
        list: (userId: string) => Promise<ProjectsState>;
      };
      recall: {
        listRecent: (payload: { userId: string; limit?: number }) => Promise<RecallEvent[]>;
        evaluateNow: (payload: RecallEvaluatePayload) => Promise<RecallEvent[]>;
        startPolling: (payload: RecallEvaluatePayload) => Promise<boolean>;
        stopPolling: (payload: RecallEvaluatePayload) => Promise<boolean>;
        onHint: (callback: (event: RecallHintEvent) => void) => () => void;
      };
      growth: {
        getLatestReveal: (userId: string) => Promise<(RevealCandidate & { text?: string; title?: string }) | null>;
        listInsights: (userId: string) => Promise<GrowthInsight[]>;
        getProfile: (userId: string) => Promise<GrowthProfile>;
        confirmInsight: (payload: { userId: string; insightId: string }) => Promise<(RevealCandidate & { text?: string; title?: string }) | null>;
        dismissReveal: (payload: { userId: string; candidateId: string }) => Promise<(RevealCandidate & { text?: string; title?: string }) | null>;
        rejectInsight: (payload: { userId: string; insightId: string; feedback?: string }) => Promise<(RevealCandidate & { text?: string; title?: string }) | null>;
      };
      airjelly: {
        getContext: () => Promise<AirJellyContext>;
      };
      hermes: {
        getStatus: () => Promise<HermesRuntimeStatus>;
        onStatusChanged: (callback: (status: HermesRuntimeStatus) => void) => () => void;
      };
      imageGen: {
        generate: (payload: ImageGenPayload) => Promise<ImageGenResult>;
      };
    };
  }
}

export {};
