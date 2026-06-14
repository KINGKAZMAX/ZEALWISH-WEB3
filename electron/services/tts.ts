import { randomUUID } from "node:crypto";
import type { TtsProviderStatus, TtsSynthesizePayload, TtsSynthesizeResult } from "../../src/types";

// StepFun TTS defaults
const DEFAULT_STEPFUN_TTS_ENDPOINT = "https://api.stepfun.com/step_plan/v1/audio/speech";
const DEFAULT_STEPFUN_TTS_MODEL = "stepaudio-2.5-tts";
const DEFAULT_STEPFUN_TTS_VOICE = "cixingnansheng";

// StepFun voice mapping by gender — auto-select based on character gender
const STEPFUN_VOICES: Record<string, string> = {
  female: "cixingnvsheng",
  male: "cixingnansheng",
  other: "cixingnansheng",
};

// Fallback env-based override per gender
function getStepFunVoiceForGender(gender?: string): string {
  if (gender && STEPFUN_VOICES[gender]) {
    return getEnvValue(`STEPFUN_TTS_VOICE_${gender.toUpperCase()}`) || STEPFUN_VOICES[gender];
  }
  return getTtsVoice();
}

// MiMo TTS defaults (via openai-next API)
const DEFAULT_MIMO_TTS_ENDPOINT = "https://api.openai-next.com/v1/audio/speech";
const DEFAULT_MIMO_TTS_MODEL = "MiMo-V2.5-TTS";
const DEFAULT_MIMO_TTS_VOICE = "zh_female_xiaohe_uranus_bigtts";

const DEFAULT_TTS_FORMAT = "mp3";
const DEFAULT_TTS_SAMPLE_RATE = 24_000;
const DEFAULT_TTS_SPEED = 1;
const DEFAULT_TTS_VOLUME = 1;

interface TtsOptions {
  signal?: AbortSignal;
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

function getMiMoApiKey() {
  return getEnvValue("MIMO_API_KEY") || getEnvValue("ANTHROPIC_AUTH_TOKEN") || getEnvValue("OPENAI_API_KEY");
}

function getTtsProvider() {
  const envProvider = getEnvValue("OC_TTS_PROVIDER") || getEnvValue("TTS_PROVIDER");
  if (envProvider) return envProvider;
  if (getStepFunApiKey()) return "stepfun";
  if (getMiMoApiKey()) return "mimo";
  return "browser";
}

function shouldUseStepFun() {
  return ["stepfun", "stepfun-tts", "stepaudio", "stepaudio-tts"].includes(getTtsProvider());
}

function shouldUseMiMo() {
  return ["mimo", "mimo-tts", "openai-next", "openai"].includes(getTtsProvider());
}

function getTtsEndpoint() {
  if (shouldUseMiMo()) {
    return getEnvValue("MIMO_TTS_ENDPOINT") || DEFAULT_MIMO_TTS_ENDPOINT;
  }
  return getEnvValue("STEPFUN_TTS_ENDPOINT") || DEFAULT_STEPFUN_TTS_ENDPOINT;
}

function getTtsModel() {
  if (shouldUseMiMo()) {
    return getEnvValue("MIMO_TTS_MODEL") || DEFAULT_MIMO_TTS_MODEL;
  }
  return getEnvValue("STEPFUN_TTS_MODEL") || DEFAULT_STEPFUN_TTS_MODEL;
}

function getTtsVoice(overrideVoice?: string) {
  if (overrideVoice) return overrideVoice;
  if (shouldUseMiMo()) {
    return getEnvValue("MIMO_TTS_VOICE") || DEFAULT_MIMO_TTS_VOICE;
  }
  return getEnvValue("STEPFUN_TTS_VOICE") || DEFAULT_STEPFUN_TTS_VOICE;
}

function getTtsFormat() {
  return getEnvValue("TTS_FORMAT") || getEnvValue("STEPFUN_TTS_FORMAT") || DEFAULT_TTS_FORMAT;
}

function getMimeType(encoding: string) {
  if (encoding === "mp3") {
    return "audio/mpeg";
  }

  if (encoding === "wav") {
    return "audio/wav";
  }

  if (encoding === "flac") {
    return "audio/flac";
  }

  if (encoding === "opus") {
    return "audio/ogg; codecs=opus";
  }

  if (encoding === "pcm") {
    return "audio/pcm";
  }

  return "application/octet-stream";
}

function buildTtsBody(text: string, overrideVoice?: string) {
  const model = getTtsModel();
  const voice = getTtsVoice(overrideVoice);
  const response_format = getTtsFormat();

  // MiMo/OpenAI compatible format
  if (shouldUseMiMo()) {
    return {
      model,
      input: text,
      voice,
      response_format,
      speed: getNumberEnv("TTS_SPEED", DEFAULT_TTS_SPEED),
    };
  }

  // StepFun format with additional options
  const instruction = getEnvValue("STEPFUN_TTS_INSTRUCTION");
  return {
    model,
    input: text,
    voice,
    response_format,
    sample_rate: getNumberEnv("STEPFUN_TTS_SAMPLE_RATE", DEFAULT_TTS_SAMPLE_RATE),
    speed: getNumberEnv("STEPFUN_TTS_SPEED", DEFAULT_TTS_SPEED),
    volume: getNumberEnv("STEPFUN_TTS_VOLUME", DEFAULT_TTS_VOLUME),
    ...(instruction ? { instruction } : {}),
  };
}

function getApiKey() {
  if (shouldUseMiMo()) {
    return getMiMoApiKey();
  }
  return getStepFunApiKey();
}

export function getTtsStatus(): TtsProviderStatus {
  const provider = getTtsProvider();

  if (provider === "browser") {
    return {
      provider: "browser",
      configured: true,
      voiceType: null,
      lastError,
    };
  }

  return {
    provider: shouldUseMiMo() ? "stepfun" : "stepfun", // Use stepfun as provider name for compatibility
    configured: Boolean(getApiKey()),
    voiceType: getTtsVoice(),
    lastError,
  };
}

export async function synthesizeSpeech(
  payload: TtsSynthesizePayload,
  options: TtsOptions & { characterGender?: string } = {},
): Promise<TtsSynthesizeResult> {
  const text = payload.text.trim();
  const apiKey = getApiKey();
  const requestId = payload.requestId || randomUUID();

 // Auto-resolve voice from character gender when using StepFun
  const resolvedVoice = shouldUseStepFun() && options.characterGender
    ? getStepFunVoiceForGender(options.characterGender)
    : undefined;

  if (!text) {
    throw new Error("TTS text is empty");
  }

  if (!apiKey) {
    throw new Error("TTS is not configured. Please set MIMO_API_KEY or STEPFUN_API_KEY");
  }

  const encoding = getTtsFormat();
  const response = await fetch(getTtsEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: options.signal,
    body: JSON.stringify(buildTtsBody(text, resolvedVoice)),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    lastError = `TTS HTTP ${response.status}${errorText ? `: ${errorText}` : ""}`;
    throw new Error(lastError);
  }

  const audio = Buffer.from(await response.arrayBuffer());

  if (!audio.byteLength) {
    lastError = "TTS response did not include audio data";
    throw new Error(lastError);
  }

  lastError = null;

  return {
    provider: "stepfun",
    requestId,
    audioBase64: audio.toString("base64"),
    mimeType: getMimeType(encoding),
    encoding,
    durationMs: null,
  };
}
