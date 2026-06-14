import { afterEach, describe, expect, it, vi } from "vitest";
import { getTtsStatus, synthesizeSpeech } from "../electron/services/tts";

const touchedKeys = [
  "OC_TTS_PROVIDER",
  "TTS_PROVIDER",
  "STEPFUN_API_KEY",
  "STEP_API_KEY",
  "STEPFUN_TTS_ENDPOINT",
  "STEPFUN_TTS_MODEL",
  "STEPFUN_TTS_VOICE",
  "STEPFUN_TTS_FORMAT",
  "STEPFUN_TTS_SAMPLE_RATE",
  "STEPFUN_TTS_SPEED",
  "STEPFUN_TTS_VOLUME",
  "STEPFUN_TTS_INSTRUCTION",
  "MIMO_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "OPENAI_API_KEY",
  "MIMO_TTS_ENDPOINT",
  "MIMO_TTS_MODEL",
  "MIMO_TTS_VOICE",
] as const;
const originalEnv = Object.fromEntries(touchedKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  vi.unstubAllGlobals();

  for (const key of touchedKeys) {
    const originalValue = originalEnv[key];

    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
});

describe("StepFun TTS service", () => {
  it("reports browser fallback when StepFun is not configured", () => {
    delete process.env.OC_TTS_PROVIDER;
    delete process.env.TTS_PROVIDER;
    delete process.env.STEPFUN_API_KEY;
    delete process.env.STEP_API_KEY;
    delete process.env.MIMO_API_KEY;
    delete process.env.ANTHROPIC_AUTH_TOKEN;
    delete process.env.OPENAI_API_KEY;

    expect(getTtsStatus()).toEqual({
      provider: "browser",
      configured: true,
      voiceType: null,
      lastError: null,
    });
  });

  it("reports StepFun when explicitly selected", () => {
    process.env.OC_TTS_PROVIDER = "stepfun";
    process.env.STEPFUN_API_KEY = "step-key";
    process.env.STEPFUN_TTS_VOICE = "cixingnansheng";

    expect(getTtsStatus()).toEqual({
      provider: "stepfun",
      configured: true,
      voiceType: "cixingnansheng",
      lastError: null,
    });
  });

  it("synthesizes speech through the StepFun audio speech API", async () => {
    process.env.OC_TTS_PROVIDER = "stepfun";
    process.env.STEPFUN_API_KEY = "step-key";
    process.env.STEPFUN_TTS_ENDPOINT = "https://example.com/v1/audio/speech";
    process.env.STEPFUN_TTS_MODEL = "stepaudio-2.5-tts";
    process.env.STEPFUN_TTS_VOICE = "cixingnansheng";
    process.env.STEPFUN_TTS_FORMAT = "mp3";
    process.env.STEPFUN_TTS_SAMPLE_RATE = "24000";
    process.env.STEPFUN_TTS_SPEED = "1.1";
    process.env.STEPFUN_TTS_VOLUME = "0.9";
    process.env.STEPFUN_TTS_INSTRUCTION = "语气自然，像日常对话";

    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));

      expect(_url).toBe("https://example.com/v1/audio/speech");
      expect(init.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer step-key",
          "Content-Type": "application/json",
        }),
      );
      expect(body).toEqual({
        model: "stepaudio-2.5-tts",
        input: "你好",
        voice: "cixingnansheng",
        response_format: "mp3",
        sample_rate: 24000,
        speed: 1.1,
        volume: 0.9,
        instruction: "语气自然，像日常对话",
      });

      return new Response(Buffer.from("audio"), {
        status: 200,
        headers: { "Content-Type": "audio/mpeg" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(synthesizeSpeech({ text: "你好", requestId: "tts-1" })).resolves.toEqual({
      provider: "stepfun",
      requestId: "tts-1",
      audioBase64: Buffer.from("audio").toString("base64"),
      mimeType: "audio/mpeg",
      encoding: "mp3",
      durationMs: null,
    });
  });
});
