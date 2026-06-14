import type {
  ChatCancelPayload,
  ChatResponse,
  ChatResult,
  ChatSendPayload,
  ImageGenPayload,
  ImageGenResult,
  MemorySummary,
  ChatHistoryEntry,
  TtsCancelPayload,
  TtsProviderStatus,
  TtsSynthesizePayload,
  TtsSynthesizeResult,
  HermesRuntimeStatus,
  AirJellyContext,
} from "../../src/types";

interface CapabilityServices {
  chat: (payload: ChatSendPayload, options?: { signal?: AbortSignal }) => Promise<ChatResult>;
  generateGreeting: (payload: { userId: string; characterId: string }) => Promise<ChatResponse>;
  loadOCHistory: (userId: string, limit: number, dataRoot?: string) => Promise<ChatHistoryEntry[]>;
  loadRecentSummaries: (userId: string, weeks: number, dataRoot?: string) => Promise<MemorySummary[]>;
  getAirJellyContext: (dataRoot?: string) => Promise<AirJellyContext>;
  hermesManager: { getStatus: () => HermesRuntimeStatus };
  getTtsStatus: () => TtsProviderStatus;
  synthesizeSpeech: (payload: TtsSynthesizePayload, options?: { signal?: AbortSignal }) => Promise<TtsSynthesizeResult>;
  generateImage: (payload: ImageGenPayload, characterId?: string, dataRoot?: string) => Promise<ImageGenResult>;
}

interface CapabilityContext {
  dataRoot?: string;
  defaultCharacterId?: string;
}

interface CreateOcWorldCapabilitiesOptions {
  context?: CapabilityContext;
  services: CapabilityServices;
}

function getChatSessionKey(payload: ChatCancelPayload) {
  return `${payload.userId}:${payload.characterId}`;
}

function getTtsRequestId(payload: TtsSynthesizePayload) {
  return payload.requestId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createOcWorldCapabilities(options: CreateOcWorldCapabilitiesOptions) {
  const { services } = options;
  const context = options.context ?? {};
  const activeChatControllers = new Map<string, AbortController>();
  const activeTtsControllers = new Map<string, AbortController>();

  return {
    chat: {
      async sendMessage(payload: ChatSendPayload) {
        const sessionKey = getChatSessionKey(payload);
        if (payload.interrupt !== false) {
          activeChatControllers.get(sessionKey)?.abort();
          activeChatControllers.delete(sessionKey);
        }

        const controller = new AbortController();
        activeChatControllers.set(sessionKey, controller);

        try {
          return await services.chat(payload, { signal: controller.signal });
        } finally {
          if (activeChatControllers.get(sessionKey) === controller) {
            activeChatControllers.delete(sessionKey);
          }
        }
      },
      async cancelActive(payload: ChatCancelPayload) {
        const sessionKey = getChatSessionKey(payload);
        const controller = activeChatControllers.get(sessionKey);
        if (!controller) {
          return false;
        }
        controller.abort();
        activeChatControllers.delete(sessionKey);
        return true;
      },
      getGreeting(payload: { userId: string; characterId: string }) {
        return services.generateGreeting(payload);
      },
    },
    memory: {
      history(userId: string, limit: number) {
        return services.loadOCHistory(userId, limit, context.dataRoot);
      },
      summaries(userId: string, weeks: number) {
        return services.loadRecentSummaries(userId, weeks, context.dataRoot);
      },
    },
    airjelly: {
      getContext() {
        return services.getAirJellyContext(context.dataRoot);
      },
    },
    hermes: {
      async getStatus() {
        return services.hermesManager.getStatus();
      },
    },
    tts: {
      async getStatus() {
        return services.getTtsStatus();
      },
      async synthesize(payload: TtsSynthesizePayload) {
        if (payload.interrupt !== false) {
          for (const controller of activeTtsControllers.values()) {
            controller.abort();
          }
          activeTtsControllers.clear();
        }

        const requestId = getTtsRequestId(payload);
        const controller = new AbortController();
        activeTtsControllers.set(requestId, controller);

        try {
          return await services.synthesizeSpeech({ ...payload, requestId }, { signal: controller.signal });
        } finally {
          if (activeTtsControllers.get(requestId) === controller) {
            activeTtsControllers.delete(requestId);
          }
        }
      },
      async cancelActive(payload: TtsCancelPayload = {}) {
        if (payload.requestId) {
          const controller = activeTtsControllers.get(payload.requestId);
          if (!controller) {
            return false;
          }
          controller.abort();
          activeTtsControllers.delete(payload.requestId);
          return true;
        }

        const hadActive = activeTtsControllers.size > 0;
        for (const controller of activeTtsControllers.values()) {
          controller.abort();
        }
        activeTtsControllers.clear();
        return hadActive;
      },
    },
    image: {
      generate(payload: ImageGenPayload, characterId = context.defaultCharacterId || "char-001") {
        return services.generateImage(payload, characterId, context.dataRoot);
      },
    },
  };
}
