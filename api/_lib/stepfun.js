// Shared helpers for ZEALWISH Vercel serverless functions.
// Zero npm dependencies — Node >= 18 (global fetch) only.

const env = (name) => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
};

// --- Key resolution (never expose these values in responses) ---

export function chatKey() {
  return env('CHAT_API_KEY') || env('STEPFUN_API_KEY') || env('STEP_API_KEY');
}

export function ttsKey() {
  return env('STEPFUN_API_KEY') || env('STEP_API_KEY') || env('CHAT_API_KEY');
}

export function imageKey() {
  return env('IMAGE_GEN_API_KEY') || env('STEPFUN_API_KEY') || env('STEP_API_KEY');
}

export function visionKey() {
  return env('VISION_API_KEY') || env('STEPFUN_API_KEY') || env('STEP_API_KEY');
}

// --- Endpoint / model configuration with StepFun defaults ---

export const CHAT_BASE_URL = env('CHAT_BASE_URL') || 'https://api.stepfun.com';
export const CHAT_MODEL = env('CHAT_MODEL') || 'step-3.7-flash';

export const TTS_ENDPOINT = env('STEPFUN_TTS_ENDPOINT') || 'https://api.stepfun.com/v1/audio/speech';
export const TTS_MODEL = env('STEPFUN_TTS_MODEL') || 'stepaudio-2.5-tts';
export const TTS_VOICE_MALE = 'cixingnansheng';
export const TTS_VOICE_FEMALE = 'tianmeinvsheng';

export const IMAGE_BASE_URL = env('IMAGE_GEN_BASE_URL') || 'https://api.stepfun.com/v1';
export const IMAGE_MODEL = env('IMAGE_GEN_MODEL') || 'step-1x-medium';

export const VISION_BASE_URL = env('VISION_BASE_URL') || 'https://api.stepfun.com/v1';
export const VISION_MODEL = env('VISION_MODEL') || 'step-3.7-flash';

// --- HTTP plumbing ---

export function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

/**
 * Handles CORS preflight and method enforcement.
 * Returns true when the request has been fully answered (caller should stop).
 */
export function preflight(req, res, allowedMethod) {
  applyCors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  if (req.method !== allowedMethod) {
    sendJson(res, 405, { error: `Method not allowed. Use ${allowedMethod}.` });
    return true;
  }
  return false;
}

/** Defensively returns the parsed JSON body as an object. */
export function readBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  return body && typeof body === 'object' ? body : {};
}

/** fetch with an AbortController timeout (milliseconds). */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// --- Deterministic companion fallback (English only) ---

export function fallbackChatReply(messages = []) {
  const last = [...messages].reverse().find((message) => message?.role === 'user')?.content || '';
  const text = String(last).toLowerCase();
  if (text.includes('memory') || text.includes('remember')) {
    return 'I saved the signal and can carry it into the next step.';
  }
  if (text.includes('plan') || text.includes('next')) {
    return 'Pick the smallest next step first. I will keep the passport context ready.';
  }
  if (text.includes('tired') || text.includes('sleep')) {
    return 'Take the quieter route for now. I will stay available without demanding attention.';
  }
  return 'Signal received. Your ZEALWISH passport can keep growing from this moment.';
}
