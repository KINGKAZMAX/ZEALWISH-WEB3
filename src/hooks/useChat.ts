import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createAppTTS } from "../lib/tts";
import { createVoiceInput, type VoiceInputState } from "../lib/voice-input";
import type {
  CharacterConfig,
  ChatHistoryEntry,
  ChatResult,
  Emotion,
  GrowthInsight,
  GrowthProfile,
  HermesRuntimeStatus,
  PendingChatMessage,
  RecallHintEvent,
  Relationship,
  RevealCandidate,
  TimelineItem,
} from "../types";

const defaultCharacterId = "char-001";
const defaultUserId = "user-001";

type RevealHint = (RevealCandidate & { text?: string; title?: string }) | null;

const defaultHermesStatus: HermesRuntimeStatus = {
  state: "disabled",
  pid: null,
  restartCount: 0,
  lastError: null,
  lastStartedAt: null,
  lastHealthCheckAt: null,
};

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function createEmptyProfile(): GrowthProfile {
  return {
    userId: defaultUserId,
    updatedAt: 0,
    goals: [],
    strengths: [],
    preferences: [],
    openQuestions: [],
  };
}

export function useChat() {
  const [character, setCharacter] = useState<CharacterConfig | null>(null);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [history, setHistory] = useState<ChatHistoryEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [emotion, setEmotion] = useState<Emotion>("idle");
  const [greeting, setGreeting] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingChatMessage[]>([]);
  const [ttsEnabled, setTtsEnabledState] = useState(true);
  const [voiceInputState, setVoiceInputState] = useState<VoiceInputState>("idle");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [hermesStatus, setHermesStatus] = useState<HermesRuntimeStatus>(defaultHermesStatus);
  const [activeReveal, setActiveReveal] = useState<RevealHint>(null);
  const [growthInsights, setGrowthInsights] = useState<GrowthInsight[]>([]);
  const [growthProfile, setGrowthProfile] = useState<GrowthProfile>(createEmptyProfile());
  const [revealBusy, setRevealBusy] = useState(false);
  const [activeRecallHint, setActiveRecallHint] = useState<RecallHintEvent | null>(null);
  const pendingMessagesRef = useRef<PendingChatMessage[]>([]);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestCounterRef = useRef(0);
  const activeRequestIdRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);
  const ttsEnabledRef = useRef(true);
  const ttsRef = useRef(createAppTTS(undefined, defaultCharacterId));
  const voiceInputRef = useRef(createVoiceInput());
  const lastFinalVoiceTextRef = useRef("");

  const cancelSpeech = useCallback(() => {
    ttsRef.current.cancel();
  }, []);

  const cancelActiveAgentTurn = useCallback(() => {
    if (!window.ocWorld) {
      return;
    }

    void window.ocWorld.chat.cancelActive({
      characterId: defaultCharacterId,
      userId: defaultUserId,
    });
  }, []);

  const refreshGrowthState = useCallback(async () => {
    if (!window.ocWorld) {
      return;
    }

    const [reveal, insights, profile] = await Promise.all([
      window.ocWorld.growth.getLatestReveal(defaultUserId),
      window.ocWorld.growth.listInsights(defaultUserId),
      window.ocWorld.growth.getProfile(defaultUserId),
    ]);

    setActiveReveal(reveal);
    setGrowthInsights(insights);
    setGrowthProfile(profile);
  }, []);

  const interruptActiveTurn = useCallback(() => {
    cancelSpeech();
    cancelActiveAgentTurn();
    activeRequestIdRef.current = null;
    isSendingRef.current = false;
    setIsSending(false);
    setEmotion("idle");
  }, [cancelActiveAgentTurn, cancelSpeech]);

  const setTtsEnabled = useCallback((enabled: boolean) => {
    ttsEnabledRef.current = enabled;
    setTtsEnabledState(enabled);

    if (!enabled) {
      ttsRef.current.cancel();
    }
  }, []);

  const syncPendingMessages = useCallback((messages: PendingChatMessage[]) => {
    pendingMessagesRef.current = messages;
    setPendingMessages(messages);
  }, []);

  const boot = useCallback(async () => {
    if (!window.ocWorld) {
      return;
    }

    const [loadedCharacter, loadedRelationship, loadedHistory, loadedTimeline, loadedGreeting, loadedHermesStatus, loadedReveal, loadedInsights, loadedProfile] =
      await Promise.all([
        window.ocWorld.character.getCurrent(defaultCharacterId),
        window.ocWorld.relationship.get(defaultUserId),
        window.ocWorld.memory.history(defaultUserId),
        window.ocWorld.timeline.list(defaultUserId),
        window.ocWorld.chat.getGreeting({ characterId: defaultCharacterId, userId: defaultUserId }),
        window.ocWorld.hermes.getStatus().catch(() => defaultHermesStatus),
        window.ocWorld.growth.getLatestReveal(defaultUserId),
        window.ocWorld.growth.listInsights(defaultUserId),
        window.ocWorld.growth.getProfile(defaultUserId),
      ]);

    setCharacter(loadedCharacter);
    setRelationship(loadedRelationship);
    setHistory(loadedHistory);
    setTimeline(loadedTimeline);
    setGreeting(loadedGreeting.text);
    setEmotion(loadedGreeting.emotion);
    setHermesStatus(loadedHermesStatus);
    setActiveReveal(loadedReveal);
    setGrowthInsights(loadedInsights);
    setGrowthProfile(loadedProfile);
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current);
      }

      ttsRef.current.cancel();
      void voiceInputRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (!window.ocWorld) {
      return;
    }

    return window.ocWorld.hermes.onStatusChanged((status) => {
      setHermesStatus(status);
    });
  }, []);

  useEffect(() => {
    if (!window.ocWorld) {
      return;
    }

    const unsubscribe = window.ocWorld.recall.onHint((hint) => {
      setActiveRecallHint(hint);
    });
    void window.ocWorld.recall.startPolling({
      userId: defaultUserId,
      characterId: defaultCharacterId,
    });

    return () => {
      unsubscribe();
      void window.ocWorld?.recall.stopPolling({
        userId: defaultUserId,
        characterId: defaultCharacterId,
      });
    };
  }, []);

  const submitPendingTurn = useCallback(async () => {
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }

    if (!window.ocWorld || !pendingMessagesRef.current.length) {
      return null;
    }

    const turnMessages = [...pendingMessagesRef.current];
    const requestId = `${Date.now()}-${requestCounterRef.current + 1}`;
    requestCounterRef.current += 1;
    activeRequestIdRef.current = requestId;
    isSendingRef.current = true;
    setIsSending(true);
    setEmotion("thinking");

    try {
      const result = (await window.ocWorld.chat.sendMessage({
        characterId: defaultCharacterId,
        userId: defaultUserId,
        userMessage: turnMessages.map((message) => message.content).join("\n"),
        userMessages: turnMessages.map((message) => message.content),
        requestId,
        interrupt: true,
      })) as ChatResult;

      if (activeRequestIdRef.current !== requestId) {
        return null;
      }

      const resolvedIds = new Set(turnMessages.map((message) => message.id));
      const remainingMessages = pendingMessagesRef.current.filter((message) => !resolvedIds.has(message.id));
      syncPendingMessages(remainingMessages);

      const nextUserEntry: ChatHistoryEntry = {
        timestamp: Date.now(),
        userMessage: turnMessages.map((message) => message.content).join("\n"),
        ocResponse: result.text,
        emotion: result.emotion,
      };

      setHistory((current) => [...current, nextUserEntry]);
      setEmotion(result.emotion);
      setRelationship((current) =>
        current
          ? {
              ...current,
              intimacy: result.intimacy,
              stage: result.stage,
            }
          : current,
      );
      setTimeline(await window.ocWorld.timeline.list(defaultUserId));
      await refreshGrowthState();

      if (ttsEnabledRef.current) {
        ttsRef.current.speak(result.text);
      }

      return result;
    } catch (error) {
      if (isAbortError(error) || activeRequestIdRef.current !== requestId) {
        return null;
      }

      return null;
    } finally {
      if (activeRequestIdRef.current === requestId) {
        isSendingRef.current = false;
        setIsSending(false);
      }
    }
  }, [refreshGrowthState, syncPendingMessages]);

  const scheduleSubmit = useCallback(() => {
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
    }

    submitTimerRef.current = setTimeout(() => {
      void submitPendingTurn();
    }, 320);
  }, [submitPendingTurn]);

  const sendMessage = useCallback(async (userMessage: string) => {
    const content = userMessage.trim();

    if (!window.ocWorld || !content) {
      return null;
    }

    cancelSpeech();

    const nextMessage: PendingChatMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
      content,
    };
    syncPendingMessages([...pendingMessagesRef.current, nextMessage]);

    if (isSendingRef.current) {
      activeRequestIdRef.current = null;
      cancelActiveAgentTurn();
    }

    scheduleSubmit();

    return null;
  }, [cancelActiveAgentTurn, cancelSpeech, scheduleSubmit, syncPendingMessages]);

  const stopVoiceInput = useCallback(async () => {
    await voiceInputRef.current.stop();
    lastFinalVoiceTextRef.current = "";
    setVoiceInputState(voiceInputRef.current.isSupported() ? "idle" : "unsupported");
  }, []);

  const startVoiceInput = useCallback(async () => {
    if (!voiceInputRef.current.isSupported()) {
      setVoiceInputState("unsupported");
      return;
    }

    cancelSpeech();
    setVoiceTranscript("");
    setVoiceInputState("listening");

    try {
      await voiceInputRef.current.start({
        userId: defaultUserId,
        onTranscript: (event) => {
          setVoiceTranscript(event.text);

          if (!event.isFinal) {
            return;
          }

          const text = event.text.trim();
          if (!text || text === lastFinalVoiceTextRef.current) {
            return;
          }

          lastFinalVoiceTextRef.current = text;
          void sendMessage(text);
        },
        onError: () => {
          setVoiceInputState("error");
        },
      });
    } catch {
      setVoiceInputState("error");
    }
  }, [cancelSpeech, sendMessage]);

  const toggleVoiceInput = useCallback(() => {
    if (voiceInputState === "listening") {
      void stopVoiceInput();
      return;
    }

    void startVoiceInput();
  }, [startVoiceInput, stopVoiceInput, voiceInputState]);

  const setDemoIntimacy = useCallback(async (intimacy: number) => {
    if (!window.ocWorld) {
      return;
    }

    const nextRelationship = await window.ocWorld.relationship.setIntimacyForDemo({
      userId: defaultUserId,
      intimacy,
    });

    setRelationship(nextRelationship);
  }, []);

  const confirmReveal = useCallback(async (insightId: string) => {
    if (!window.ocWorld) {
      return;
    }

    setRevealBusy(true);
    try {
      await window.ocWorld.growth.confirmInsight({ userId: defaultUserId, insightId });
      await refreshGrowthState();
    } finally {
      setRevealBusy(false);
    }
  }, [refreshGrowthState]);

  const dismissReveal = useCallback(async (candidateId: string) => {
    if (!window.ocWorld) {
      return;
    }

    setRevealBusy(true);
    try {
      await window.ocWorld.growth.dismissReveal({ userId: defaultUserId, candidateId });
      await refreshGrowthState();
    } finally {
      setRevealBusy(false);
    }
  }, [refreshGrowthState]);

  const rejectReveal = useCallback(async (insightId: string) => {
    if (!window.ocWorld) {
      return;
    }

    setRevealBusy(true);
    try {
      await window.ocWorld.growth.rejectInsight({
        userId: defaultUserId,
        insightId,
        feedback: "这个理解不对",
      });
      await refreshGrowthState();
    } finally {
      setRevealBusy(false);
    }
  }, [refreshGrowthState]);

  const dismissRecallHint = useCallback(() => {
    setActiveRecallHint(null);
  }, []);

  return useMemo(
    () => ({
      character,
      relationship,
      history,
      timeline,
      emotion,
      greeting,
      isSending,
      pendingMessages,
      ttsEnabled,
      voiceInputState,
      voiceTranscript,
      hermesStatus,
      activeReveal,
      growthInsights,
      growthProfile,
      revealBusy,
      activeRecallHint,
      cancelSpeech,
      interruptActiveTurn,
      sendMessage,
      setTtsEnabled,
      startVoiceInput,
      stopVoiceInput,
      toggleVoiceInput,
      setDemoIntimacy,
      confirmReveal,
      dismissReveal,
      rejectReveal,
      dismissRecallHint,
      refreshState: boot,
      defaultCharacterId,
      defaultUserId,
    }),
    [
      character,
      relationship,
      history,
      timeline,
      emotion,
      greeting,
      isSending,
      pendingMessages,
      ttsEnabled,
      voiceInputState,
      voiceTranscript,
      hermesStatus,
      activeReveal,
      growthInsights,
      growthProfile,
      revealBusy,
      activeRecallHint,
      cancelSpeech,
      interruptActiveTurn,
      sendMessage,
      setTtsEnabled,
      startVoiceInput,
      stopVoiceInput,
      toggleVoiceInput,
      setDemoIntimacy,
      confirmReveal,
      dismissReveal,
      rejectReveal,
      dismissRecallHint,
      boot,
    ],
  );
}
