import type { AsrProviderStatus, AsrStartPayload, AsrTranscriptEvent } from "../../src/types";

const DEFAULT_ASR_ENDPOINT = "https://api.stepfun.com/step_plan/v1/audio/asr/sse";
const DEFAULT_ASR_MODEL = "stepaudio-2.5-asr";
const DEFAULT_ASR_LANGUAGE = "zh";
const DEFAULT_ASR_TIMEOUT_MS = 60_000;
const DEFAULT_ASR_PARTIAL_INTERVAL_MS = 1_600;

interface StepFunAsrSessionOptions {
  onTranscript: (event: AsrTranscriptEvent) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

interface StepFunAsrEvent {
  type?: string;
  delta?: string;
  text?: string;
  message?: string;
}

let lastError: string | null = null;

function getEnvValue(name: string) {
  const value = process.env[name];

  if (!value || value === "undefined" || value === "null") {
    return undefined;
  }

  return value.trim();
}

function getNumberEnv(name: string, fallback: number) {
  const rawValue = getEnvValue(name);

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : fallback;
}

function getStepFunApiKey() {
  return getEnvValue("STEPFUN_API_KEY") || getEnvValue("STEP_API_KEY");
}

function getAsrEndpoint() {
  return getEnvValue("STEPFUN_ASR_ENDPOINT") || DEFAULT_ASR_ENDPOINT;
}

function getAsrModel() {
  return getEnvValue("STEPFUN_ASR_MODEL") || DEFAULT_ASR_MODEL;
}

function normalizeLanguage(language?: string) {
  const resolvedLanguage = language || getEnvValue("STEPFUN_ASR_LANGUAGE") || DEFAULT_ASR_LANGUAGE;

  if (resolvedLanguage.toLowerCase() === "zh-cn") {
    return "zh";
  }

  return resolvedLanguage;
}

function getHotwords() {
  const rawValue = getEnvValue("STEPFUN_ASR_HOTWORDS");

  if (!rawValue) {
    return undefined;
  }

  const hotwords = rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return hotwords.length ? hotwords : undefined;
}

function getEnableItn() {
  const rawValue = getEnvValue("STEPFUN_ASR_ENABLE_ITN");

  if (!rawValue) {
    return true;
  }

  return !["0", "false", "no"].includes(rawValue.toLowerCase());
}

function isAsrConfigured() {
  return Boolean(getStepFunApiKey());
}

export function getAsrStatus(): AsrProviderStatus {
  return {
    provider: "stepfun",
    configured: isAsrConfigured(),
    resourceId: getAsrModel(),
    lastError,
  };
}

function buildAsrRequestBody(payload: AsrStartPayload, audio: Buffer) {
  const prompt = getEnvValue("STEPFUN_ASR_PROMPT");
  const hotwords = getHotwords();

  return {
    audio: {
      data: audio.toString("base64"),
      input: {
        transcription: {
          language: normalizeLanguage(payload.language),
          ...(hotwords ? { hotwords } : {}),
          ...(prompt ? { prompt } : {}),
          model: getAsrModel(),
          enable_itn: getEnableItn(),
        },
        format: {
          type: "pcm",
          codec: "pcm_s16le",
          rate: 16000,
          bits: 16,
          channel: 1,
        },
      },
    },
  };
}

function parseStepFunEvent(data: string): StepFunAsrEvent | null {
  const trimmedData = data.trim();

  if (!trimmedData || trimmedData === "[DONE]") {
    return null;
  }

  return JSON.parse(trimmedData) as StepFunAsrEvent;
}

async function readSseEvents(
  response: Response,
  sessionId: string,
  onTranscript: (event: AsrTranscriptEvent) => void,
  options: { forceInterim?: boolean } = {},
) {
  if (!response.body) {
    throw new Error("StepFun ASR response did not include an SSE body");
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let pendingText = "";
  let eventLines: string[] = [];
  let accumulatedText = "";
  let emittedFinal = false;

  const emitEvent = (data: string) => {
    const event = parseStepFunEvent(data);

    if (!event) {
      return;
    }

    if (event.type === "error") {
      throw new Error(event.message || "StepFun ASR failed");
    }

    if (event.type === "transcript.text.delta") {
      accumulatedText += event.delta || "";
      if (accumulatedText) {
        onTranscript({
          sessionId,
          text: accumulatedText,
          isFinal: false,
        });
      }
      return;
    }

    if (event.type === "transcript.text.done") {
      const finalText = (event.text || accumulatedText).trim();
      if (finalText) {
        emittedFinal = true;
        onTranscript({
          sessionId,
          text: finalText,
          isFinal: !options.forceInterim,
        });
      }
    }
  };

  const flushEvent = () => {
    if (!eventLines.length) {
      return;
    }

    emitEvent(eventLines.join("\n"));
    eventLines = [];
  };

  const consumeLine = (line: string) => {
    const normalizedLine = line.endsWith("\r") ? line.slice(0, -1) : line;

    if (!normalizedLine) {
      flushEvent();
      return;
    }

    if (normalizedLine.startsWith(":")) {
      return;
    }

    if (normalizedLine.startsWith("data:")) {
      eventLines.push(normalizedLine.slice(5).trimStart());
      return;
    }

    if (normalizedLine.trimStart().startsWith("{")) {
      eventLines.push(normalizedLine.trim());
    }
  };

  for (;;) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    pendingText += decoder.decode(value, { stream: true });
    const lines = pendingText.split("\n");
    pendingText = lines.pop() ?? "";
    lines.forEach(consumeLine);
  }

  pendingText += decoder.decode();

  if (pendingText) {
    pendingText.split("\n").forEach(consumeLine);
  }

  flushEvent();

  if (accumulatedText.trim() && !emittedFinal) {
    onTranscript({
      sessionId,
      text: accumulatedText.trim(),
      isFinal: !options.forceInterim,
    });
  }
}

async function transcribeAudio(
  payload: AsrStartPayload,
  audio: Buffer,
  options: StepFunAsrSessionOptions,
  transcribeOptions: { forceInterim?: boolean } = {},
) {
  const apiKey = getStepFunApiKey();

  if (!apiKey) {
    throw new Error("StepFun ASR is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getNumberEnv("STEPFUN_ASR_TIMEOUT_MS", DEFAULT_ASR_TIMEOUT_MS));

  try {
    const response = await fetch(getAsrEndpoint(), {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify(buildAsrRequestBody(payload, audio)),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`StepFun ASR HTTP ${response.status}${errorText ? `: ${errorText}` : ""}`);
    }

    await readSseEvents(response, payload.sessionId, options.onTranscript, transcribeOptions);
  } finally {
    clearTimeout(timeout);
  }
}

function getPartialIntervalMs() {
  const interval = getNumberEnv("STEPFUN_ASR_PARTIAL_INTERVAL_MS", DEFAULT_ASR_PARTIAL_INTERVAL_MS);

  if (interval <= 0) {
    return 0;
  }

  return Math.max(600, interval);
}

export class StepFunAsrSession {
  private chunks: Buffer[] = [];
  private isClosing = false;
  private isClosed = false;
  private partialTimer: ReturnType<typeof setTimeout> | null = null;
  private partialInFlight = false;
  private partialQueued = false;
  private lastPartialByteLength = 0;
  private lastPartialText = "";
  private readonly partialIntervalMs = getPartialIntervalMs();

  constructor(
    private readonly payload: AsrStartPayload,
    private readonly options: StepFunAsrSessionOptions,
  ) {}

  async start() {
    if (!isAsrConfigured()) {
      throw new Error("StepFun ASR is not configured");
    }
  }

  sendAudio(audio: ArrayBuffer) {
    if (this.isClosing || this.isClosed || audio.byteLength === 0) {
      return;
    }

    this.chunks.push(Buffer.from(audio));
    this.schedulePartialTranscription();
  }

  async finish() {
    if (this.isClosing || this.isClosed) {
      return;
    }

    this.isClosing = true;
    this.clearPartialTimer();

    try {
      const audio = Buffer.concat(this.chunks);
      this.chunks = [];

      if (audio.byteLength > 0) {
        await transcribeAudio(this.payload, audio, this.options);
      }

      lastError = null;
    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error(String(error));
      lastError = resolvedError.message;
      this.options.onError(resolvedError);
    } finally {
      this.close();
    }
  }

  close() {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;
    this.isClosing = true;
    this.clearPartialTimer();
    this.chunks = [];
    this.options.onClose();
  }

  private clearPartialTimer() {
    if (!this.partialTimer) {
      return;
    }

    clearTimeout(this.partialTimer);
    this.partialTimer = null;
  }

  private schedulePartialTranscription() {
    if (this.partialIntervalMs <= 0 || this.partialTimer || this.isClosing || this.isClosed) {
      return;
    }

    this.partialTimer = setTimeout(() => {
      this.partialTimer = null;
      void this.runPartialTranscription();
    }, this.partialIntervalMs);
  }

  private async runPartialTranscription() {
    if (this.isClosing || this.isClosed) {
      return;
    }

    if (this.partialInFlight) {
      this.partialQueued = true;
      return;
    }

    const audio = Buffer.concat(this.chunks);

    if (!audio.byteLength || audio.byteLength === this.lastPartialByteLength) {
      return;
    }

    this.partialInFlight = true;
    this.lastPartialByteLength = audio.byteLength;

    try {
      await transcribeAudio(
        this.payload,
        audio,
        {
          ...this.options,
          onTranscript: (event) => {
            if (this.isClosing || this.isClosed) {
              return;
            }

            const text = event.text.trim();

            if (!text || text === this.lastPartialText) {
              return;
            }

            this.lastPartialText = text;
            this.options.onTranscript({
              ...event,
              text,
              isFinal: false,
            });
          },
        },
        { forceInterim: true },
      );
      lastError = null;
    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error(String(error));
      lastError = resolvedError.message;
    } finally {
      this.partialInFlight = false;

      if (this.partialQueued && !this.isClosing && !this.isClosed) {
        this.partialQueued = false;
        this.schedulePartialTranscription();
      }
    }
  }
}
