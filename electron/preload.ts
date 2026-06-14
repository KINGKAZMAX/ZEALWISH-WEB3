import { contextBridge, ipcRenderer } from "electron";

const hermesStatusChangedChannel = "hermes:status-changed";

contextBridge.exposeInMainWorld("ocWorld", {
  getAppPath: () => process.cwd(),
  chat: {
    sendMessage: (payload: import("../src/types").ChatSendPayload) => ipcRenderer.invoke("chat:send-message", payload),
    cancelActive: (payload: import("../src/types").ChatCancelPayload) =>
      ipcRenderer.invoke("chat:cancel-active", payload),
    getGreeting: (payload: { characterId: string; userId: string }) =>
      ipcRenderer.invoke("chat:get-greeting", payload),
  },
  tts: {
    synthesize: (payload: import("../src/types").TtsSynthesizePayload) => ipcRenderer.invoke("tts:synthesize", payload),
    cancelActive: (payload?: import("../src/types").TtsCancelPayload) => ipcRenderer.invoke("tts:cancel-active", payload),
    getStatus: () => ipcRenderer.invoke("tts:get-status"),
  },
  asr: {
    start: (payload: import("../src/types").AsrStartPayload) => ipcRenderer.invoke("asr:start", payload),
    sendAudio: (payload: import("../src/types").AsrAudioPayload) => ipcRenderer.send("asr:audio", payload),
    stop: (payload: import("../src/types").AsrStopPayload) => ipcRenderer.invoke("asr:stop", payload),
    getStatus: () => ipcRenderer.invoke("asr:get-status"),
    onTranscript: (callback: (event: import("../src/types").AsrTranscriptEvent) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, transcript: import("../src/types").AsrTranscriptEvent) => {
        callback(transcript);
      };

      ipcRenderer.on("asr:transcript", listener);

      return () => {
        ipcRenderer.removeListener("asr:transcript", listener);
      };
    },
    onError: (callback: (event: import("../src/types").AsrErrorEvent) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, error: import("../src/types").AsrErrorEvent) => {
        callback(error);
      };

      ipcRenderer.on("asr:error", listener);

      return () => {
        ipcRenderer.removeListener("asr:error", listener);
      };
    },
  },
  character: {
    getCurrent: (characterId: string) => ipcRenderer.invoke("character:get-current", characterId),
    saveCurrent: (payload: { characterId: string; character: import("../src/types").CharacterConfig }) =>
      ipcRenderer.invoke("character:save-current", payload),
  },
  timeline: {
    list: (userId: string) => ipcRenderer.invoke("timeline:list", userId),
  },
  relationship: {
    get: (userId: string) => ipcRenderer.invoke("relationship:get", userId),
    save: (payload: { userId: string; relationship: import("../src/types").Relationship }) =>
      ipcRenderer.invoke("relationship:save", payload),
    setIntimacyForDemo: (payload: { userId: string; intimacy: number }) =>
      ipcRenderer.invoke("relationship:set-intimacy-for-demo", payload),
  },
  memory: {
    summaries: (userId: string) => ipcRenderer.invoke("memory:summaries", userId),
    history: (userId: string) => ipcRenderer.invoke("memory:history", userId),
    getLongTerm: (userId: string) => ipcRenderer.invoke("memory:get-long-term", userId),
    getVoice: (userId: string) => ipcRenderer.invoke("memory:get-voice", userId),
    runDistill: (payload: { userId: string; characterId?: string }) => ipcRenderer.invoke("memory:run-distill", payload),
  },
  awareness: {
    list: (payload: { userId: string; limit?: number }) => ipcRenderer.invoke("awareness:list", payload),
  },
  workItems: {
    list: (userId: string) => ipcRenderer.invoke("work-items:list", userId),
  },
  projects: {
    list: (userId: string) => ipcRenderer.invoke("projects:list", userId),
  },
  recall: {
    listRecent: (payload: { userId: string; limit?: number }) => ipcRenderer.invoke("recall:list-recent", payload),
    evaluateNow: (payload: import("../src/types").RecallEvaluatePayload) => ipcRenderer.invoke("recall:evaluate-now", payload),
    startPolling: (payload: import("../src/types").RecallEvaluatePayload) => ipcRenderer.invoke("recall:start-polling", payload),
    stopPolling: (payload: import("../src/types").RecallEvaluatePayload) => ipcRenderer.invoke("recall:stop-polling", payload),
    onHint: (callback: (event: import("../src/types").RecallHintEvent) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, hint: import("../src/types").RecallHintEvent) => {
        callback(hint);
      };

      ipcRenderer.on("recall:hint", listener);

      return () => {
        ipcRenderer.removeListener("recall:hint", listener);
      };
    },
  },
  growth: {
    getLatestReveal: (userId: string) => ipcRenderer.invoke("growth:get-latest-reveal", userId),
    listInsights: (userId: string) => ipcRenderer.invoke("growth:list-insights", userId),
    getProfile: (userId: string) => ipcRenderer.invoke("growth:get-profile", userId),
    confirmInsight: (payload: { userId: string; insightId: string }) => ipcRenderer.invoke("growth:confirm-insight", payload),
    dismissReveal: (payload: { userId: string; candidateId: string }) => ipcRenderer.invoke("growth:dismiss-reveal", payload),
    rejectInsight: (payload: { userId: string; insightId: string; feedback?: string }) => ipcRenderer.invoke("growth:reject-insight", payload),
  },
  airjelly: {
    getContext: () => ipcRenderer.invoke("airjelly:get-context"),
  },
  hermes: {
    getStatus: () => ipcRenderer.invoke("hermes:get-status"),
    onStatusChanged: (callback: (status: import("../src/types").HermesRuntimeStatus) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: import("../src/types").HermesRuntimeStatus) => {
        callback(status);
      };

      ipcRenderer.on(hermesStatusChangedChannel, listener);

      return () => {
        ipcRenderer.removeListener(hermesStatusChangedChannel, listener);
      };
    },
  },
  imageGen: {
    generate: (payload: import("../src/types").ImageGenPayload) =>
      ipcRenderer.invoke("image-gen:generate", payload),
  },
});
