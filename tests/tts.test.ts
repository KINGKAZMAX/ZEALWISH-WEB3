import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppTTS, createBrowserTTS, splitSpeechText } from "../src/lib/tts";

class FakeUtterance {
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public text: string) {}
}

class FakeAudio {
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  pause = vi.fn();
  load = vi.fn();
  removeAttribute = vi.fn();

  constructor(public src: string) {}

  play() {
    Promise.resolve().then(() => this.onended?.());
    return Promise.resolve();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser TTS", () => {
  it("speaks with a Chinese voice when speech synthesis is available", () => {
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);

    const voice = { lang: "zh-CN", default: false } as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn(() => [voice]),
      cancel: vi.fn(),
      speak: vi.fn(),
    } as unknown as SpeechSynthesis;
    const tts = createBrowserTTS({ speechSynthesis: synth } as Window);

    tts.speak("你好");

    expect(synth.cancel).toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "你好",
        lang: "zh-CN",
        rate: 0.96,
        voice,
      }),
    );
  });

  it("splits long replies into natural speech chunks", () => {
    const chunks = splitSpeechText(
      "第一句会先讲清楚。第二句继续补充上下文。第三句再给一个行动建议。",
      12,
    );

    expect(chunks).toEqual(["第一句会先讲清楚。", "第二句继续补充上下文。", "第三句再给一个行动建议。"]);
  });

  it("continues queued speech chunks when a chunk ends", () => {
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);

    const spoken: FakeUtterance[] = [];
    const synth = {
      getVoices: vi.fn(() => []),
      cancel: vi.fn(),
      speak: vi.fn((utterance: FakeUtterance) => {
        spoken.push(utterance);
      }),
      resume: vi.fn(),
    } as unknown as SpeechSynthesis;
    const tts = createBrowserTTS({ speechSynthesis: synth } as Window);

    tts.speak("第一句会先讲清楚。".repeat(20));
    spoken[0].onend?.();

    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(spoken[1].text.length).toBeGreaterThan(0);
  });

  it("cancels active speech", () => {
    const synth = {
      getVoices: vi.fn(() => []),
      cancel: vi.fn(),
      speak: vi.fn(),
      resume: vi.fn(),
    } as unknown as SpeechSynthesis;
    const tts = createBrowserTTS({ speechSynthesis: synth } as Window);

    tts.cancel();

    expect(synth.cancel).toHaveBeenCalled();
  });

  it("uses Electron StepFun TTS when available", async () => {
    vi.stubGlobal("Audio", FakeAudio);

    const synthesize = vi.fn(async () => ({
      provider: "stepfun" as const,
      requestId: "tts-1",
      audioBase64: "AAAA",
      mimeType: "audio/mpeg",
      encoding: "mp3",
      durationMs: null,
    }));
    const cancelActive = vi.fn(async () => false);
    const tts = createAppTTS({
      ocWorld: {
        tts: {
          synthesize,
          cancelActive,
          getStatus: vi.fn(),
        },
      },
      speechSynthesis: {
        getVoices: vi.fn(() => []),
        cancel: vi.fn(),
        speak: vi.fn(),
      },
    } as unknown as Window);

    tts.speak("你好");

    await vi.waitFor(() => {
      expect(synthesize).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "你好",
          interrupt: true,
        }),
      );
    });
  });
});
