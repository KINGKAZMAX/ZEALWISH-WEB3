export type TtsState = "unsupported" | "idle" | "speaking";

export interface TtsController {
  isSupported(): boolean;
  speak(text: string): void;
  cancel(): void;
}

const preferredVoiceNames = [/siri/i, /premium/i, /enhanced/i, /tingting/i, /meijia/i, /sinji/i, /xiaoxiao/i];

function getVoiceScore(voice: SpeechSynthesisVoice) {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  let score = 0;

  if (lang === "zh-cn" || lang === "cmn-cn") {
    score += 60;
  } else if (lang.startsWith("zh") || lang.startsWith("cmn")) {
    score += 45;
  }

  if (voice.localService) {
    score += 4;
  }

  if (voice.default) {
    score += 3;
  }

  if (preferredVoiceNames.some((pattern) => pattern.test(name))) {
    score += 12;
  }

  return score;
}

function pickVoice(synth: SpeechSynthesis) {
  const voices = synth.getVoices();

  if (!voices.length) {
    return null;
  }

  return [...voices].sort((left, right) => getVoiceScore(right) - getVoiceScore(left))[0] || null;
}

function normalizeSpeechText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSpeechText(text: string, maxChunkLength = 90) {
  const normalizedText = normalizeSpeechText(text);

  if (!normalizedText) {
    return [];
  }

  const sentenceParts = normalizedText.match(/[^。！？!?；;]+[。！？!?；;]?/g) ?? [normalizedText];
  const chunks: string[] = [];
  let buffer = "";

  const flush = () => {
    if (!buffer.trim()) {
      return;
    }

    chunks.push(buffer.trim());
    buffer = "";
  };

  const pushPart = (part: string) => {
    const trimmedPart = part.trim();

    if (!trimmedPart) {
      return;
    }

    if (trimmedPart.length > maxChunkLength) {
      flush();

      for (let index = 0; index < trimmedPart.length; index += maxChunkLength) {
        chunks.push(trimmedPart.slice(index, index + maxChunkLength).trim());
      }

      return;
    }

    const nextBuffer = `${buffer}${trimmedPart}`;

    if (buffer && nextBuffer.length > maxChunkLength) {
      flush();
      buffer = trimmedPart;
      return;
    }

    buffer = nextBuffer;
  };

  sentenceParts.forEach(pushPart);
  flush();

  return chunks;
}

export function createBrowserTTS(win: Window | undefined = typeof window === "undefined" ? undefined : window) {
  const synth = win?.speechSynthesis;
  let queue: string[] = [];
  let runId = 0;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  const stopKeepAlive = () => {
    if (!keepAliveTimer) {
      return;
    }

    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  };

  const startKeepAlive = () => {
    stopKeepAlive();

    keepAliveTimer = setInterval(() => {
      synth?.resume();
    }, 4_000);
  };

  const speakNextChunk = (currentRunId: number) => {
    if (!synth || currentRunId !== runId) {
      return;
    }

    const nextChunk = queue.shift();

    if (!nextChunk) {
      stopKeepAlive();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextChunk);
    utterance.lang = "zh-CN";
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => speakNextChunk(currentRunId);
    utterance.onerror = () => speakNextChunk(currentRunId);

    const voice = pickVoice(synth);
    if (voice) {
      utterance.voice = voice;
    }

    synth.speak(utterance);
  };

  const controller: TtsController = {
    isSupported() {
      return Boolean(synth && typeof SpeechSynthesisUtterance !== "undefined");
    },

    speak(text: string) {
      if (!this.isSupported() || !synth || !text.trim()) {
        return;
      }

      queue = splitSpeechText(text);
      runId += 1;
      synth.cancel();

      if (queue.length > 1) {
        startKeepAlive();
      }

      speakNextChunk(runId);
    },

    cancel() {
      runId += 1;
      queue = [];
      stopKeepAlive();
      synth?.cancel();
    },
  };

  synth?.getVoices();

  return controller;
}

function createAudioElement(audioBase64: string, mimeType: string) {
  if (typeof Audio === "undefined") {
    throw new Error("Audio playback is not available");
  }

  return new Audio(`data:${mimeType};base64,${audioBase64}`);
}

export function
createAppTTS(win: Window | undefined = typeof window === "undefined" ? undefined : window, characterId?: string) {
  const browserTTS = createBrowserTTS(win);
  let currentAudio: HTMLAudioElement | null = null;
  let runId = 0;

  const cancelAudio = () => {
    if (!currentAudio) {
      return;
    }

    currentAudio.pause();
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  };

  const playAudio = (audioBase64: string, mimeType: string, currentRunId: number) =>
    new Promise<void>((resolve, reject) => {
      const audio = createAudioElement(audioBase64, mimeType);
      currentAudio = audio;
      audio.onended = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }

        resolve();
      };
      audio.onerror = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }

        reject(new Error("TTS audio playback failed"));
      };

      audio
        .play()
        .then(() => {
          if (currentRunId !== runId) {
            cancelAudio();
          }
        })
        .catch(reject);
    });

  const speakWithRemoteTTS = async (text: string, currentRunId: number) => {
    const remoteTTS = win?.ocWorld?.tts;

    if (!remoteTTS) {
      browserTTS.speak(text);
      return;
    }

    const chunks = splitSpeechText(text, 120);

    for (let index = 0; index < chunks.length; index += 1) {
      if (currentRunId !== runId) {
        return;
      }

      const chunk = chunks[index];

      try {
        const result = await remoteTTS.synthesize({
          text: chunk,
          requestId: `${Date.now()}-${currentRunId}-${index}`,
          characterId,
          interrupt: true,
        });

        if (currentRunId !== runId) {
          return;
        }

        await playAudio(result.audioBase64, result.mimeType, currentRunId);
      } catch {
        if (currentRunId === runId) {
          browserTTS.speak(chunks.slice(index).join(""));
        }

        return;
      }
    }
  };

  const controller: TtsController = {
    isSupported() {
      return Boolean(win?.ocWorld?.tts) || browserTTS.isSupported();
    },

    speak(text: string) {
      const normalizedText = text.trim();

      if (!normalizedText) {
        return;
      }

      runId += 1;
      const currentRunId = runId;
      browserTTS.cancel();
      cancelAudio();

      void speakWithRemoteTTS(normalizedText, currentRunId);
    },

    cancel() {
      runId += 1;
      cancelAudio();
      browserTTS.cancel();
      void win?.ocWorld?.tts?.cancelActive();
    },
  };

  return controller;
}
