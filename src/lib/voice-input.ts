import type { AsrTranscriptEvent } from "../types";

export type VoiceInputState = "unsupported" | "idle" | "listening" | "error";

interface VoiceInputStartOptions {
  userId: string;
  onTranscript: (event: AsrTranscriptEvent) => void;
  onError: (error: Error) => void;
}

interface VoiceInputController {
  isSupported(): boolean;
  start(options: VoiceInputStartOptions): Promise<string>;
  stop(): Promise<void>;
}

const targetSampleRate = 16_000;

function getAudioContext(win: Window) {
  const audioWindow = win as Window & {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
  return AudioContextCtor ? new AudioContextCtor() : null;
}

function resampleTo16k(input: Float32Array, sourceSampleRate: number) {
  if (sourceSampleRate === targetSampleRate) {
    return input;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(leftIndex + 1, input.length - 1);
    const fraction = sourceIndex - leftIndex;
    output[index] = input[leftIndex] + (input[rightIndex] - input[leftIndex]) * fraction;
  }

  return output;
}

function floatTo16BitPcm(input: Float32Array) {
  const output = new ArrayBuffer(input.length * 2);
  const view = new DataView(output);

  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]));
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return output;
}

export function createVoiceInput(win: Window | undefined = typeof window === "undefined" ? undefined : window): VoiceInputController {
  let sessionId: string | null = null;
  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let processor: ScriptProcessorNode | null = null;
  let detachTranscript: (() => void) | null = null;
  let detachError: (() => void) | null = null;

  const cleanupAudio = async () => {
    processor?.disconnect();
    source?.disconnect();
    processor = null;
    source = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;

    if (audioContext && audioContext.state !== "closed") {
      await audioContext.close();
    }

    audioContext = null;
  };

  const controller: VoiceInputController = {
    isSupported() {
      const audioWindow = win as (Window & {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      }) | undefined;

      return Boolean(
        win?.ocWorld?.asr &&
          typeof win.navigator?.mediaDevices?.getUserMedia === "function" &&
          (audioWindow?.AudioContext || audioWindow?.webkitAudioContext),
      );
    },

    async start(options) {
      if (!win || !this.isSupported()) {
        throw new Error("Voice input is not supported");
      }

      await this.stop();

      const currentSessionId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionId = currentSessionId;
      detachTranscript = win.ocWorld?.asr.onTranscript((event) => {
        if (event.sessionId === currentSessionId) {
          options.onTranscript(event);
        }
      }) ?? null;
      detachError = win.ocWorld?.asr.onError((event) => {
        if (event.sessionId === currentSessionId) {
          options.onError(new Error(event.message));
        }
      }) ?? null;

      await win.ocWorld?.asr.start({
        sessionId: currentSessionId,
        userId: options.userId,
        language: "zh-CN",
      });

      try {
        stream = await win.navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        audioContext = getAudioContext(win);

        if (!audioContext) {
          throw new Error("AudioContext is not available");
        }

        source = audioContext.createMediaStreamSource(stream);
        processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
          const activeSessionId = sessionId;
          if (!activeSessionId) {
            return;
          }

          const channel = event.inputBuffer.getChannelData(0);
          const resampled = resampleTo16k(channel, audioContext?.sampleRate ?? targetSampleRate);
          const audio = floatTo16BitPcm(resampled);
          win.ocWorld?.asr.sendAudio({ sessionId: activeSessionId, audio });
        };
        source.connect(processor);
        processor.connect(audioContext.destination);
      } catch (error) {
        await this.stop();
        options.onError(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }

      return currentSessionId;
    },

    async stop() {
      const currentSessionId = sessionId;
      sessionId = null;
      await cleanupAudio();

      if (currentSessionId) {
        await win?.ocWorld?.asr.stop({ sessionId: currentSessionId });
      }

      detachTranscript?.();
      detachTranscript = null;
      detachError?.();
      detachError = null;
    },
  };

  return controller;
}
