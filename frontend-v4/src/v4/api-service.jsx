// ZEALWISH v4 — API service adapter.
// Thin wrapper that routes frontend calls to window.OCRuntime
// (which is set up by ocworld-bridge.jsx from window.ocWorld).

const ApiService = {
  async sendMessage({ userId, characterId, userMessage, userMessages = [] }) {
    const runtime = window.OCRuntime;
    if (!runtime?.sendChat) {
      return {
        text: '嗯，我在听。',
        emotion: 'idle',
        source: 'mock',
      };
    }

    const messages = userMessages.length
      ? userMessages.map((m) => ({ role: 'user', content: m }))
      : [{ role: 'user', content: userMessage }];

    try {
      const result = await runtime.sendChat({
        userId: userId || runtime.userId,
        characterId: characterId || runtime.characterId,
        messages: [...messages, { role: 'user', content: userMessage }],
        text: userMessage,
      });
      return result;
    } catch (err) {
      console.warn('[ApiService] sendChat failed:', err);
      return {
        text: '我把这件事记下来了。接上真实运行时后会走完整流程。',
        emotion: 'thinking',
        source: 'fallback',
      };
    }
  },

  async generateImage({ prompt, aspectRatio, imageSize }) {
    const runtime = window.OCRuntime;
    if (!runtime?.generateImage) {
      throw new Error('Image generation requires the Electron runtime.');
    }
    return runtime.generateImage({ prompt, aspectRatio, imageSize });
  },

  async synthesize(text) {
    const runtime = window.OCRuntime;
    if (!runtime?.speak) return { provider: 'none', played: false };
    return runtime.speak(text);
  },

  cancelSpeech() {
    const runtime = window.OCRuntime;
    if (runtime?.cancelSpeech) runtime.cancelSpeech();
  },

  getHermesStatus() {
    const runtime = window.OCRuntime;
    return runtime?.getHermesStatus?.() || { state: 'browser' };
  },

  getTtsStatus() {
    const runtime = window.OCRuntime;
    return runtime?.getTtsStatus?.() || {
      provider: window.speechSynthesis ? 'browser' : 'none',
      configured: false,
    };
  },

  getAirJellyContext() {
    const runtime = window.OCRuntime;
    return runtime?.getAirJellyContext?.() || { source: 'mock', events: [] };
  },
};

window.ApiService = ApiService;
