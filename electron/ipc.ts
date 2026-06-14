import { BrowserWindow, ipcMain } from "electron";
import { chat, generateGreeting } from "./services/chat-engine";
import { getAirJellyContext } from "./services/airjelly";
import { runManualDistillationPipeline } from "./services/growth-pipeline";
import { confirmInsightToProfile } from "./services/growth-profile";
import { rejectInsight } from "./services/growth-insights";
import { hermesManager } from "./services/hermes-manager";
import { getTtsStatus, synthesizeSpeech } from "./services/tts";
import { getAsrStatus, StepFunAsrSession } from "./services/stepfun-asr";
import { generateImage } from "./services/image-gen";
import { evaluateContextRecall, startRecallPolling, stopAllRecallPolling, stopRecallPolling } from "./services/recall-service";
import {
  listTimeline,
  loadCharacter,
  loadGrowthInsights,
  loadGrowthProfile,
  loadOCHistory,
  loadRecentSummaries,
  loadRelationship,
  loadRevealQueue,
  saveCharacter,
  saveGrowthInsights,
  saveGrowthProfile,
  saveRelationship,
  saveRevealQueue,
} from "./services/memory";
import {
  appendConfirmedMemoryNote,
  listAwarenessEpisodes,
  listRecentRecallEvents,
  listWorkItems,
  loadLongTermMemory,
  loadProjectsState,
} from "./services/unified-memory";
import { getStage } from "./services/relationship";
import type {
  CharacterConfig,
  AsrAudioPayload,
  AsrStartPayload,
  AsrStopPayload,
  ChatCancelPayload,
  ChatSendPayload,
  ImageGenPayload,
  RecallEvent,
  RecallEvaluatePayload,
  TtsCancelPayload,
  TtsSynthesizePayload,
} from "../src/types";

const ipcChannels = {
  chatSendMessage: "chat:send-message",
  chatCancelActive: "chat:cancel-active",
  chatGetGreeting: "chat:get-greeting",
  ttsSynthesize: "tts:synthesize",
  ttsCancelActive: "tts:cancel-active",
  ttsGetStatus: "tts:get-status",
  asrStart: "asr:start",
  asrAudio: "asr:audio",
  asrStop: "asr:stop",
  asrGetStatus: "asr:get-status",
  asrTranscript: "asr:transcript",
  asrError: "asr:error",
  characterGetCurrent: "character:get-current",
  characterSaveCurrent: "character:save-current",
  timelineList: "timeline:list",
  relationshipGet: "relationship:get",
  relationshipSave: "relationship:save",
  relationshipSetIntimacyForDemo: "relationship:set-intimacy-for-demo",
  memorySummaries: "memory:summaries",
  memoryHistory: "memory:history",
  memoryGetLongTerm: "memory:get-long-term",
  memoryGetVoice: "memory:get-voice",
  memoryRunDistill: "memory:run-distill",
  awarenessList: "awareness:list",
  workItemsList: "work-items:list",
  projectsList: "projects:list",
  recallListRecent: "recall:list-recent",
  recallEvaluateNow: "recall:evaluate-now",
  recallStartPolling: "recall:start-polling",
  recallStopPolling: "recall:stop-polling",
  recallHint: "recall:hint",
  growthGetLatestReveal: "growth:get-latest-reveal",
  growthListInsights: "growth:list-insights",
  growthGetProfile: "growth:get-profile",
  growthConfirmInsight: "growth:confirm-insight",
  growthDismissReveal: "growth:dismiss-reveal",
  growthRejectInsight: "growth:reject-insight",
  airjellyGetContext: "airjelly:get-context",
  hermesGetStatus: "hermes:get-status",
  imageGenGenerate: "image-gen:generate",
} as const;

let registered = false;
let detachHermesListener: (() => void) | null = null;
const activeChatControllers = new Map<string, AbortController>();
const activeTtsControllers = new Map<string, AbortController>();
const activeAsrSessions = new Map<string, StepFunAsrSession>();

function getChatSessionKey(payload: ChatCancelPayload) {
  return `${payload.userId}:${payload.characterId}`;
}

function abortActiveChat(payload: ChatCancelPayload) {
  const sessionKey = getChatSessionKey(payload);
  const activeController = activeChatControllers.get(sessionKey);

  if (!activeController) {
    return false;
  }

  activeController.abort();
  activeChatControllers.delete(sessionKey);
  return true;
}

function getTtsRequestId(payload: TtsSynthesizePayload) {
  return payload.requestId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function abortActiveTts(payload: TtsCancelPayload = {}) {
  if (payload.requestId) {
    const activeController = activeTtsControllers.get(payload.requestId);

    if (!activeController) {
      return false;
    }

    activeController.abort();
    activeTtsControllers.delete(payload.requestId);
    return true;
  }

  const hadActiveTts = activeTtsControllers.size > 0;

  for (const controller of activeTtsControllers.values()) {
    controller.abort();
  }

  activeTtsControllers.clear();
  return hadActiveTts;
}

async function stopAsrSession(payload: AsrStopPayload) {
  const session = activeAsrSessions.get(payload.sessionId);

  if (!session) {
    return false;
  }

  await session.finish();
  activeAsrSessions.delete(payload.sessionId);
  return true;
}

async function getLatestReveal(userId: string) {
  const [queue, insights] = await Promise.all([loadRevealQueue(userId), loadGrowthInsights(userId)]);
  const shownCandidate = queue.find((item) => item.status === "shown");
  if (shownCandidate) {
    const shownInsight = insights.find((item) => item.id === shownCandidate.insightId);
    return shownInsight ? { ...shownCandidate, text: shownInsight.text, title: shownInsight.title } : null;
  }

  const pendingIndex = queue.findIndex((item) => item.status === "pending");
  if (pendingIndex === -1) {
    return null;
  }

  const pendingCandidate = queue[pendingIndex];
  const shownAt = Date.now();
  const promotedCandidate = {
    ...pendingCandidate,
    status: "shown" as const,
    shownAt,
  };
  const nextQueue = queue.map((item, index) => (index === pendingIndex ? promotedCandidate : item));
  await saveRevealQueue(userId, nextQueue);

  const insight = insights.find((item) => item.id === promotedCandidate.insightId);
  return insight ? { ...promotedCandidate, text: insight.text, title: insight.title } : null;
}

function broadcastRecallHint(event: RecallEvent) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(ipcChannels.recallHint, {
      ...event,
      emittedAt: Date.now(),
    });
  }
}

export function registerIpcHandlers() {
  if (registered) {
    return;
  }

  registered = true;
  detachHermesListener = hermesManager.onStatusChanged((status) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send("hermes:status-changed", status);
    }
  });

  ipcMain.handle(ipcChannels.chatSendMessage, async (_event, payload: ChatSendPayload) => {
    const sessionKey = getChatSessionKey(payload);

    if (payload.interrupt !== false) {
      abortActiveChat(payload);
    }

    const controller = new AbortController();
    activeChatControllers.set(sessionKey, controller);

    try {
      return await chat(payload, { signal: controller.signal });
    } finally {
      if (activeChatControllers.get(sessionKey) === controller) {
        activeChatControllers.delete(sessionKey);
      }
    }
  });
  ipcMain.handle(ipcChannels.chatCancelActive, async (_event, payload: ChatCancelPayload) => abortActiveChat(payload));
  ipcMain.handle(ipcChannels.chatGetGreeting, async (_event, payload) => generateGreeting(payload));
  ipcMain.handle(ipcChannels.ttsSynthesize, async (_event, payload: TtsSynthesizePayload) => {
    if (payload.interrupt !== false) {
      abortActiveTts();
    }

    const requestId = getTtsRequestId(payload);
    const controller = new AbortController();
    activeTtsControllers.set(requestId, controller);

    // Auto-resolve character gender for voice selection
    let characterGender: string | undefined;
    if (payload.characterId) {
      try {
        const character = await loadCharacter(payload.characterId);
        characterGender = character?.gender;
      } catch {
        // If character load fails, fall back to default voice
      }
    }

    try {
      return await synthesizeSpeech({ ...payload, requestId }, { signal: controller.signal, characterGender });
    } finally {
      if (activeTtsControllers.get(requestId) === controller) {
        activeTtsControllers.delete(requestId);
      }
    }
  });
  ipcMain.handle(ipcChannels.ttsCancelActive, async (_event, payload?: TtsCancelPayload) => abortActiveTts(payload));
  ipcMain.handle(ipcChannels.ttsGetStatus, async () => getTtsStatus());
  ipcMain.handle(ipcChannels.asrStart, async (event, payload: AsrStartPayload) => {
    activeAsrSessions.get(payload.sessionId)?.close();

    const session = new StepFunAsrSession(payload, {
      onTranscript: (transcript) => {
        event.sender.send(ipcChannels.asrTranscript, transcript);
      },
      onError: (error) => {
        event.sender.send(ipcChannels.asrError, {
          sessionId: payload.sessionId,
          message: error.message,
        });
      },
      onClose: () => {
        activeAsrSessions.delete(payload.sessionId);
      },
    });

    await session.start();
    activeAsrSessions.set(payload.sessionId, session);
    return getAsrStatus();
  });
  ipcMain.on(ipcChannels.asrAudio, (_event, payload: AsrAudioPayload) => {
    activeAsrSessions.get(payload.sessionId)?.sendAudio(payload.audio);
  });
  ipcMain.handle(ipcChannels.asrStop, async (_event, payload: AsrStopPayload) => stopAsrSession(payload));
  ipcMain.handle(ipcChannels.asrGetStatus, async () => getAsrStatus());
  ipcMain.handle(ipcChannels.characterGetCurrent, async (_event, characterId: string) => loadCharacter(characterId));
  ipcMain.handle(
    ipcChannels.characterSaveCurrent,
    async (_event, payload: { characterId: string; character: CharacterConfig }) =>
      saveCharacter(payload.characterId, payload.character),
  );
  ipcMain.handle(ipcChannels.timelineList, async (_event, userId: string) => listTimeline(userId));
  ipcMain.handle(ipcChannels.relationshipGet, async (_event, userId: string) => loadRelationship(userId));
  ipcMain.handle(
    ipcChannels.relationshipSave,
    async (_event, payload: { userId: string; relationship: import("../src/types").Relationship }) =>
      saveRelationship(payload.userId, payload.relationship),
  );
  ipcMain.handle(
    ipcChannels.relationshipSetIntimacyForDemo,
    async (_event, payload: { userId: string; intimacy: number }) => {
      const relationship = await loadRelationship(payload.userId);
      const next = {
        ...relationship,
        intimacy: Math.max(0, Math.min(100, payload.intimacy)),
        stage: getStage(payload.intimacy),
      };
      return saveRelationship(payload.userId, next);
    },
  );
  ipcMain.handle(ipcChannels.memorySummaries, async (_event, userId: string) => loadRecentSummaries(userId, 10));
  ipcMain.handle(ipcChannels.memoryHistory, async (_event, userId: string) => loadOCHistory(userId, 20));
  ipcMain.handle(ipcChannels.memoryGetLongTerm, async (_event, userId: string) => loadLongTermMemory(userId));
  ipcMain.handle(ipcChannels.memoryGetVoice, async (_event, userId: string) => {
    const longTermMemory = await loadLongTermMemory(userId);
    return {
      userId,
      voiceMarkdown: longTermMemory.voiceMarkdown,
      updatedAt: longTermMemory.updatedAt,
    };
  });
  ipcMain.handle(ipcChannels.memoryRunDistill, async (_event, payload: { userId: string; characterId?: string }) =>
    runManualDistillationPipeline(payload),
  );
  ipcMain.handle(ipcChannels.awarenessList, async (_event, payload: { userId: string; limit?: number }) =>
    listAwarenessEpisodes(payload.userId, payload.limit ?? 20),
  );
  ipcMain.handle(ipcChannels.workItemsList, async (_event, userId: string) => listWorkItems(userId));
  ipcMain.handle(ipcChannels.projectsList, async (_event, userId: string) => loadProjectsState(userId));
  ipcMain.handle(ipcChannels.recallListRecent, async (_event, payload: { userId: string; limit?: number }) =>
    listRecentRecallEvents(payload.userId, payload.limit ?? 20),
  );
  ipcMain.handle(ipcChannels.recallEvaluateNow, async (_event, payload: RecallEvaluatePayload) => {
    const events = await evaluateContextRecall({
      ...payload,
      dataRoot: process.cwd(),
    });
    for (const event of events) {
      broadcastRecallHint(event);
    }
    return events;
  });
  ipcMain.handle(ipcChannels.recallStartPolling, async (_event, payload: RecallEvaluatePayload) =>
    startRecallPolling({
      ...payload,
      dataRoot: process.cwd(),
      onHint: broadcastRecallHint,
    }),
  );
  ipcMain.handle(ipcChannels.recallStopPolling, async (_event, payload: RecallEvaluatePayload) =>
    stopRecallPolling({
      ...payload,
      dataRoot: process.cwd(),
    }),
  );
  ipcMain.handle(ipcChannels.growthGetLatestReveal, async (_event, userId: string) => getLatestReveal(userId));
  ipcMain.handle(ipcChannels.growthListInsights, async (_event, userId: string) => loadGrowthInsights(userId));
  ipcMain.handle(ipcChannels.growthGetProfile, async (_event, userId: string) => loadGrowthProfile(userId));
  ipcMain.handle(ipcChannels.growthConfirmInsight, async (_event, payload: { userId: string; insightId: string }) => {
    const [insights, profile, queue] = await Promise.all([
      loadGrowthInsights(payload.userId),
      loadGrowthProfile(payload.userId),
      loadRevealQueue(payload.userId),
    ]);
    const insight = insights.find((item) => item.id === payload.insightId);
    if (!insight) {
      return null;
    }

    const now = Date.now();
    await Promise.all([
      saveGrowthInsights(
        payload.userId,
        insights.map((item) =>
          item.id === payload.insightId ? { ...item, status: "confirmed" as const, updatedAt: now } : item,
        ),
      ),
      saveGrowthProfile(payload.userId, confirmInsightToProfile({ profile, insight, now })),
      appendConfirmedMemoryNote({
        insightId: insight.id,
        title: insight.title,
        text: insight.text,
        type: insight.type === "preference" ? "voice" : "memory",
        now,
      }),
      saveRevealQueue(
        payload.userId,
        queue.map((item) =>
          item.insightId === payload.insightId ? { ...item, status: "confirmed" as const, shownAt: now } : item,
        ),
      ),
    ]);

    return getLatestReveal(payload.userId);
  });
  ipcMain.handle(ipcChannels.growthDismissReveal, async (_event, payload: { userId: string; candidateId: string }) => {
    const queue = await loadRevealQueue(payload.userId);
    await saveRevealQueue(
      payload.userId,
      queue.map((item) =>
        item.id === payload.candidateId ? { ...item, status: "dismissed" as const, shownAt: Date.now() } : item,
      ),
    );
    return getLatestReveal(payload.userId);
  });
  ipcMain.handle(ipcChannels.growthRejectInsight, async (_event, payload: { userId: string; insightId: string; feedback?: string }) => {
    const [insights, queue] = await Promise.all([loadGrowthInsights(payload.userId), loadRevealQueue(payload.userId)]);
    await Promise.all([
      saveGrowthInsights(
        payload.userId,
        rejectInsight({
          insights,
          insightId: payload.insightId,
          feedback: payload.feedback,
          now: Date.now(),
        }),
      ),
      saveRevealQueue(
        payload.userId,
        queue.map((item) =>
          item.insightId === payload.insightId ? { ...item, status: "dismissed" as const, shownAt: Date.now() } : item,
        ),
      ),
    ]);
    return getLatestReveal(payload.userId);
  });
  ipcMain.handle(ipcChannels.airjellyGetContext, async () => getAirJellyContext());
  ipcMain.handle(ipcChannels.hermesGetStatus, async () => hermesManager.getStatus());
  ipcMain.handle(ipcChannels.imageGenGenerate, async (_event, payload: ImageGenPayload) => generateImage(payload));
}

export function unregisterIpcHandlers() {
  if (!registered) {
    return;
  }

  registered = false;
  detachHermesListener?.();
  detachHermesListener = null;
  for (const controller of activeChatControllers.values()) {
    controller.abort();
  }
  activeChatControllers.clear();
  abortActiveTts();
  for (const session of activeAsrSessions.values()) {
    session.close();
  }
  activeAsrSessions.clear();
  stopAllRecallPolling();

  ipcMain.removeHandler(ipcChannels.chatSendMessage);
  ipcMain.removeHandler(ipcChannels.chatCancelActive);
  ipcMain.removeHandler(ipcChannels.chatGetGreeting);
  ipcMain.removeHandler(ipcChannels.ttsSynthesize);
  ipcMain.removeHandler(ipcChannels.ttsCancelActive);
  ipcMain.removeHandler(ipcChannels.ttsGetStatus);
  ipcMain.removeHandler(ipcChannels.asrStart);
  ipcMain.removeAllListeners(ipcChannels.asrAudio);
  ipcMain.removeHandler(ipcChannels.asrStop);
  ipcMain.removeHandler(ipcChannels.asrGetStatus);
  ipcMain.removeHandler(ipcChannels.characterGetCurrent);
  ipcMain.removeHandler(ipcChannels.characterSaveCurrent);
  ipcMain.removeHandler(ipcChannels.timelineList);
  ipcMain.removeHandler(ipcChannels.relationshipGet);
  ipcMain.removeHandler(ipcChannels.relationshipSave);
  ipcMain.removeHandler(ipcChannels.relationshipSetIntimacyForDemo);
  ipcMain.removeHandler(ipcChannels.memorySummaries);
  ipcMain.removeHandler(ipcChannels.memoryHistory);
  ipcMain.removeHandler(ipcChannels.memoryGetLongTerm);
  ipcMain.removeHandler(ipcChannels.memoryGetVoice);
  ipcMain.removeHandler(ipcChannels.memoryRunDistill);
  ipcMain.removeHandler(ipcChannels.awarenessList);
  ipcMain.removeHandler(ipcChannels.workItemsList);
  ipcMain.removeHandler(ipcChannels.projectsList);
  ipcMain.removeHandler(ipcChannels.recallListRecent);
  ipcMain.removeHandler(ipcChannels.recallEvaluateNow);
  ipcMain.removeHandler(ipcChannels.recallStartPolling);
  ipcMain.removeHandler(ipcChannels.recallStopPolling);
  ipcMain.removeHandler(ipcChannels.growthGetLatestReveal);
  ipcMain.removeHandler(ipcChannels.growthListInsights);
  ipcMain.removeHandler(ipcChannels.growthGetProfile);
  ipcMain.removeHandler(ipcChannels.growthConfirmInsight);
  ipcMain.removeHandler(ipcChannels.growthDismissReveal);
  ipcMain.removeHandler(ipcChannels.growthRejectInsight);
  ipcMain.removeHandler(ipcChannels.airjellyGetContext);
  ipcMain.removeHandler(ipcChannels.hermesGetStatus);
  ipcMain.removeHandler(ipcChannels.imageGenGenerate);
}
