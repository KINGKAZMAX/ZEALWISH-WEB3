import { afterEach, describe, expect, it, vi } from "vitest";
import { getAsrStatus, StepFunAsrSession } from "../electron/services/stepfun-asr";
import type { AsrTranscriptEvent } from "../src/types";

const touchedKeys = [
  "STEPFUN_API_KEY",
  "STEP_API_KEY",
  "STEPFUN_ASR_ENDPOINT",
  "STEPFUN_ASR_MODEL",
  "STEPFUN_ASR_LANGUAGE",
  "STEPFUN_ASR_ENABLE_ITN",
  "STEPFUN_ASR_HOTWORDS",
  "STEPFUN_ASR_PROMPT",
  "STEPFUN_ASR_TIMEOUT_MS",
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

function createSseResponse(events: string[]) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const event of events) {
          controller.enqueue(new TextEncoder().encode(`data: ${event}\n\n`));
        }
        controller.close();
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    },
  );
}

describe("StepFun ASR service", () => {
  it("reports StepFun ASR status", () => {
    process.env.STEPFUN_API_KEY = "step-key";
    process.env.STEPFUN_ASR_MODEL = "stepaudio-2.5-asr";

    expect(getAsrStatus()).toEqual({
      provider: "stepfun",
      configured: true,
      resourceId: "stepaudio-2.5-asr",
      lastError: null,
    });
  });

  it("submits accumulated PCM audio and emits SSE transcripts", async () => {
    process.env.STEPFUN_API_KEY = "step-key";
    process.env.STEPFUN_ASR_ENDPOINT = "https://example.com/v1/audio/asr/sse";
    process.env.STEPFUN_ASR_MODEL = "stepaudio-2.5-asr";
    process.env.STEPFUN_ASR_HOTWORDS = "OC, Hermes";
    process.env.STEPFUN_ASR_PROMPT = "请记录用户语音。";

    const transcripts: AsrTranscriptEvent[] = [];
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));

      expect(_url).toBe("https://example.com/v1/audio/asr/sse");
      expect(init.headers).toEqual(
        expect.objectContaining({
          Accept: "text/event-stream",
          Authorization: "Bearer step-key",
          "Content-Type": "application/json",
        }),
      );
      expect(body.audio.data).toBe(Buffer.from([1, 2, 3, 4]).toString("base64"));
      expect(body.audio.input).toEqual({
        transcription: {
          language: "zh",
          hotwords: ["OC", "Hermes"],
          prompt: "请记录用户语音。",
          model: "stepaudio-2.5-asr",
          enable_itn: true,
        },
        format: {
          type: "pcm",
          codec: "pcm_s16le",
          rate: 16000,
          bits: 16,
          channel: 1,
        },
      });

      return createSseResponse([
        JSON.stringify({ type: "transcript.text.delta", delta: "你好" }),
        JSON.stringify({ type: "transcript.text.delta", delta: "世界" }),
        JSON.stringify({ type: "transcript.text.done", text: "你好世界" }),
        "[DONE]",
      ]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const session = new StepFunAsrSession(
      { sessionId: "asr-1", userId: "user-1", language: "zh-CN" },
      {
        onTranscript: (event) => transcripts.push(event),
        onError: (error) => {
          throw error;
        },
        onClose: vi.fn(),
      },
    );

    await session.start();
    session.sendAudio(new Uint8Array([1, 2]).buffer);
    session.sendAudio(new Uint8Array([3, 4]).buffer);
    await session.finish();

    expect(transcripts).toEqual([
      { sessionId: "asr-1", text: "你好", isFinal: false },
      { sessionId: "asr-1", text: "你好世界", isFinal: false },
      { sessionId: "asr-1", text: "你好世界", isFinal: true },
    ]);
  });
});
