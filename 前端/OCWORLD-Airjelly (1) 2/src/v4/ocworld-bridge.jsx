// Runtime adapter for the static prototype.
// When this page is loaded inside the oc-world Electron shell, window.ocWorld is
// provided by preload.ts and these calls hit the real Hermes/TTS/AirJelly/image APIs.

(function initOCWorldBridge() {
  const DEFAULT_USER_ID = "user-001";
  const DEFAULT_CHARACTER_ID = "char-001";
  let activeAudio = null;

  function nativeApi() {
    // 优先级: API Proxy服务 > Electron preload
    return window.OCAPI?.compat || window.OCRuntime || window.ocWorld || null;
  }

  function fallbackReply(text) {
    const t = String(text || "").toLowerCase();
    if (!t.trim()) return "嗯，我在听。";
    if (t.includes("累") || t.includes("困") || t.includes("焦虑")) {
      return "看得出来你已经绷了一会儿。先把最能展示的一条链路跑通，剩下的慢慢补。";
    }
    if (t.includes("计划") || t.includes("plan")) {
      return "先选一个最小可演示动作：问一句、回一句、读出来，再生成一张图。";
    }
    if (t.includes("画") || t.includes("图") || t.includes("头像")) {
      return "可以，我会把这句话变成一张更像 OC 的视觉草图。";
    }
    return "我把这件事记下来了。现在这版可以先用于演示，接上真实运行时后会走 Hermes 和本地记忆。";
  }

  function pickLastUserMessage(messages, fallbackText) {
    const lastUserMessage = [...(messages || [])].reverse().find((message) => message.role === "user");
    return lastUserMessage?.content || fallbackText || "";
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
    utterance.lang = /[a-z]/i.test(text) && !/[\u4e00-\u9fa5]/.test(text) ? "en-US" : "zh-CN";
    synth.speak(utterance);
    return true;
  }

  async function sendChat(input) {
    const api = nativeApi();
    const text = pickLastUserMessage(input?.messages, input?.text);

    if (!api?.chat?.sendMessage) {
      return {
        text: fallbackReply(text),
        emotion: "thinking",
        growthEvent: null,
        intimacy: null,
        stage: null,
        source: "mock",
        runtime: "browser-fallback",
      };
    }

    const userMessages = (input?.messages || [])
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

  async function synthesizeAndPlay(text) {
    const api = nativeApi();
    if (!text?.trim()) return { provider: "none", played: false };

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
    await nativeApi()?.tts?.cancelActive?.().catch(() => false);
  }

  async function generateImage(input) {
    const api = nativeApi();
    if (!api?.imageGen?.generate) {
      throw new Error("Image generation is only available inside the oc-world Electron runtime.");
    }
    const payload = typeof input === "string" ? { prompt: input } : input;
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

  window.OCRuntime = {
    userId: DEFAULT_USER_ID,
    characterId: DEFAULT_CHARACTER_ID,
    hasNative: () => Boolean(nativeApi()),
    sendChat,
    speak: synthesizeAndPlay,
    cancelSpeech,
    generateImage,
    getHermesStatus: () => safeInvoke(() => nativeApi()?.hermes?.getStatus?.(), { state: nativeApi() ? "unknown" : "browser" }),
    getTtsStatus: () => safeInvoke(() => nativeApi()?.tts?.getStatus?.(), {
      provider: window.speechSynthesis ? "browser" : "none",
      configured: Boolean(window.speechSynthesis),
      voiceType: null,
      lastError: null,
    }),
    getAirJellyContext: () => safeInvoke(() => nativeApi()?.airjelly?.getContext?.(), {
      events: [],
      tasks: [],
      appUsage: [],
      source: "mock",
    }),
    onHermesStatusChanged: (callback) => nativeApi()?.hermes?.onStatusChanged?.(callback) || (() => {}),
  };

  window.claude = window.claude || {};
  window.claude.complete = async (payload) => {
    const result = await sendChat(payload || {});
    return result.text;
  };
})();
