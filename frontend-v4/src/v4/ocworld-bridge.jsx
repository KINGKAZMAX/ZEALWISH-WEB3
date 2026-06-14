// Runtime adapter for ZEALWISH v4.
// Browser preview uses the HTTP API gateway first, then Electron preload, then safe demo fallbacks.

(function initOCWorldBridge() {
  const DEFAULT_USER_ID = "user-001";
  const DEFAULT_CHARACTER_ID = "char-001";
  const ZEALWISH_BROWSER_AVATAR_FALLBACK = "assets/zealwish-main-character.png";
  const ZEALWISH_DEFAULT_LOCAL_API_BASE = "http://127.0.0.1:7291/api";
  const LOCAL_PREVIEW_PORTS = new Set(["8789", "8790", "8000", "8080"]);
  let activeAudio = null;
  let runtimeStatusCache = null;

  function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function resolveApiBase() {
    const explicit = window.ZEALWISH_API_BASE || localStorage.getItem("zealwish.apiBase");
    if (explicit) return trimTrailingSlash(explicit);

    const host = window.location?.hostname || "";
    const port = window.location?.port || "";
    const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (isLocalhost && LOCAL_PREVIEW_PORTS.has(port)) return ZEALWISH_DEFAULT_LOCAL_API_BASE;

    return "/api";
  }

  function withLeadingSlash(path) {
    return String(path || "").startsWith("/") ? path : `/${path}`;
  }

  async function fetchHttpApi(path, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${resolveApiBase()}${withLeadingSlash(path)}`, {
        ...options,
        signal: controller.signal,
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP ${response.status}`);
      }
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function getHttpApi(path, timeoutMs = 10000) {
    return fetchHttpApi(path, {}, timeoutMs);
  }

  function postHttpApi(path, body, timeoutMs = 60000) {
    return fetchHttpApi(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    }, timeoutMs);
  }

  function electronApi() {
    return window.OCAPI?.compat || window.ocWorld || null;
  }

  function fallbackReply(text) {
    const t = String(text || "").toLowerCase();
    if (!t.trim()) return "I am here and listening.";
    if (t.includes("tired") || t.includes("sleep") || t.includes("anxious")) {
      return "Take the smallest next step first. I will stay with you while the rest becomes clearer.";
    }
    if (t.includes("plan")) {
      return "Start with one demonstrable loop: ask, answer, remember, then improve the next reply.";
    }
    if (t.includes("draw") || t.includes("image") || t.includes("avatar")) {
      return "I can turn that signal into a character visual once the image API is available.";
    }
    return "I saved the signal. This browser preview can keep working while the full ZEALWISH runtime comes online.";
  }

  function pickLastUserMessage(messages, fallbackText) {
    const lastUserMessage = [...(messages || [])].reverse().find((message) => message.role === "user");
    return lastUserMessage?.content || fallbackText || "";
  }

  function normalizeMessages(input, text) {
    const messages = Array.isArray(input?.messages) ? input.messages : [];
    if (messages.length) return messages;
    return [{ role: "user", content: text }];
  }

  function playAudioDataUrl(dataUrl) {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }

    const audio = new Audio(dataUrl);
    activeAudio = audio;
    audio.addEventListener("ended", () => {
      if (activeAudio === audio) activeAudio = null;
    });
    return audio.play();
  }

  function speakWithBrowser(text) {
    const synth = window.speechSynthesis;
    if (!synth || !text?.trim()) return false;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    synth.speak(utterance);
    return true;
  }

  async function getRuntimeStatus() {
    const now = Date.now();
    if (runtimeStatusCache && now - runtimeStatusCache.createdAt < 900) return runtimeStatusCache.promise;
    runtimeStatusCache = {
      createdAt: now,
      promise: getHttpApi("/runtime-status", 4000).catch(() => null),
    };
    return runtimeStatusCache.promise;
  }

  async function sendChat(input) {
    const text = pickLastUserMessage(input?.messages, input?.text);
    const messages = normalizeMessages(input, text);

    try {
      const result = await postHttpApi("/chat", {
        system: input?.system,
        messages,
      }, 45000);
      return {
        ...result,
        text: result?.text || fallbackReply(text),
        source: result?.source || "http-api",
        runtime: "http-api",
      };
    } catch (error) {
      console.warn("[ZEALWISH_API] HTTP chat failed, trying local runtime.", error);
    }

    const api = electronApi();
    if (!api?.chat?.sendMessage) {
      return {
        text: fallbackReply(text),
        emotion: "thinking",
        growthEvent: null,
        intimacy: null,
        stage: null,
        source: "browser-fallback",
        runtime: "browser-fallback",
      };
    }

    const userMessages = messages
      .filter((message) => message.role === "user")
      .slice(-3)
      .map((message) => message.content)
      .filter(Boolean);

    const result = await api.chat.sendMessage({
      userId: input?.userId || DEFAULT_USER_ID,
      characterId: input?.characterId || DEFAULT_CHARACTER_ID,
      userMessage: text,
      userMessages: userMessages.length ? userMessages : [text],
      interrupt: true,
    });

    return {
      ...result,
      text: result?.text || fallbackReply(text),
      runtime: "oc-world",
    };
  }

  async function synthesizeAndPlay(text, gender) {
    const api = electronApi();
    if (!text?.trim()) return { provider: "none", played: false };

    try {
      const result = await postHttpApi("/speak", { text, gender }, 45000);
      const dataUrl = `data:${result.mimeType};base64,${result.audioBase64}`;
      await playAudioDataUrl(dataUrl);
      return { ...result, provider: result.provider || "http-api", played: true };
    } catch (error) {
      console.warn("[ZEALWISH_API] HTTP TTS failed, trying local runtime.", error);
    }

    if (api?.tts?.synthesize) {
      try {
        const result = await api.tts.synthesize({
          text,
          userId: DEFAULT_USER_ID,
          interrupt: true,
        });
        const dataUrl = `data:${result.mimeType};base64,${result.audioBase64}`;
        await playAudioDataUrl(dataUrl);
        return { ...result, played: true };
      } catch (error) {
        console.warn("[OCWorldBridge] Remote TTS failed, using browser speech.", error);
      }
    }

    const played = speakWithBrowser(text);
    return { provider: "browser", played };
  }

  async function cancelSpeech() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }
    window.speechSynthesis?.cancel();
    await electronApi()?.tts?.cancelActive?.().catch(() => false);
  }

  async function generateImage(input) {
    const payload = typeof input === "string" ? { prompt: input } : input;

    try {
      const result = await postHttpApi("/generate-image", payload, 120000);
      return {
        ...result,
        dataUrl: result?.dataUrl || ZEALWISH_BROWSER_AVATAR_FALLBACK,
        source: result?.source || "http-api",
      };
    } catch (error) {
      console.warn("[ZEALWISH_API] HTTP image generation failed, trying local runtime.", error);
    }

    const api = electronApi();
    if (!api?.imageGen?.generate) {
      return {
        requestId: `browser-${Date.now()}`,
        dataUrl: ZEALWISH_BROWSER_AVATAR_FALLBACK,
        mimeType: "image/png",
        source: "browser-fallback",
        prompt: payload?.prompt,
      };
    }

    const result = await api.imageGen.generate(payload);
    return {
      ...result,
      dataUrl: `data:${result.mimeType};base64,${result.imageBase64}`,
    };
  }

  async function safeInvoke(fn, fallback = null) {
    try {
      const value = await fn();
      return value ?? fallback;
    } catch (error) {
      console.warn("[OCWorldBridge] Runtime call failed.", error);
      return fallback;
    }
  }

  const existingRuntime = window.OCRuntime || {};

  window.OCRuntime = {
    ...existingRuntime,
    userId: DEFAULT_USER_ID,
    characterId: DEFAULT_CHARACTER_ID,
    apiBase: resolveApiBase,
    hasNative: () => Boolean(electronApi()),
    hasHttpApi: async () => Boolean(await getHttpApi("/health", 2500).catch(() => null)),
    sendChat,
    speak: synthesizeAndPlay,
    cancelSpeech,
    generateImage,
    getHermesStatus: () => safeInvoke(async () => {
      const status = await getRuntimeStatus();
      return status?.hermes || electronApi()?.hermes?.getStatus?.() || { state: status ? "http-api" : "browser" };
    }, { state: "browser" }),
    getTtsStatus: () => safeInvoke(async () => {
      const status = await getRuntimeStatus();
      return status?.tts || electronApi()?.tts?.getStatus?.() || {
        provider: window.speechSynthesis ? "browser" : "none",
        configured: Boolean(window.speechSynthesis),
        voiceType: null,
        lastError: null,
      };
    }, {
      provider: window.speechSynthesis ? "browser" : "none",
      configured: Boolean(window.speechSynthesis),
      voiceType: null,
      lastError: null,
    }),
    getAirJellyContext: () => safeInvoke(async () => {
      const status = await getRuntimeStatus();
      return status?.airjelly || electronApi()?.airjelly?.getContext?.() || {
        events: [],
        tasks: [],
        appUsage: [],
        source: "mock",
      };
    }, {
      events: [],
      tasks: [],
      appUsage: [],
      source: "mock",
    }),
    onHermesStatusChanged: (callback) => electronApi()?.hermes?.onStatusChanged?.(callback) || (() => {}),
  };

  window.ZEALWISH_API = {
    ...(window.ZEALWISH_API || {}),
    resolveApiBase,
    getHttpApi,
    postHttpApi,
    speak: synthesizeAndPlay,
    cancelSpeech,
  };

  window.claude = window.claude || {};
  window.claude.complete = async (payload) => {
    const result = await sendChat(payload || {});
    return result.text;
  };
})();
