import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env from parent project
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

loadEnv();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const CHAT_API_KEY = process.env.CHAT_API_KEY || process.env.STEPFUN_API_KEY || process.env.STEP_API_KEY;
const CHAT_BASE_URL = process.env.CHAT_BASE_URL || 'https://api.stepfun.com';
const CHAT_MODEL = process.env.CHAT_MODEL || 'step-3.7-flash';

const TTS_API_KEY = process.env.STEPFUN_API_KEY || process.env.STEP_API_KEY || process.env.CHAT_API_KEY;
const TTS_ENDPOINT = process.env.STEPFUN_TTS_ENDPOINT || 'https://api.stepfun.com/v1/audio/speech';
const TTS_MODEL = process.env.STEPFUN_TTS_MODEL || 'stepaudio-2.5-tts';
const TTS_VOICE_MALE = 'cixingnansheng';
const TTS_VOICE_FEMALE = 'tianmeinvsheng';

const IMAGE_API_KEY = process.env.IMAGE_GEN_API_KEY || process.env.STEPFUN_API_KEY || process.env.STEP_API_KEY;
const IMAGE_BASE_URL = process.env.IMAGE_GEN_BASE_URL || 'https://api.stepfun.com/v1';
const IMAGE_MODEL = process.env.IMAGE_GEN_MODEL || 'step-1x-medium';

const VISION_API_KEY = process.env.VISION_API_KEY || process.env.STEPFUN_API_KEY || process.env.STEP_API_KEY;
const VISION_BASE_URL = process.env.VISION_BASE_URL || 'https://api.stepfun.com/v1';
const VISION_MODEL = process.env.VISION_MODEL || 'step-3.7-flash';

const FALLBACK_WARNING = 'Chat API key not configured — deterministic companion reply.';
const UPSTREAM_WARNING = 'Chat upstream unavailable — deterministic companion reply.';

function fallbackChatReply(messages = []) {
  const last = [...messages].reverse().find((message) => message?.role === 'user')?.content || '';
  const text = String(last).toLowerCase();
  if (text.includes('memory') || text.includes('remember')) return 'I saved the signal and can carry it into the next step.';
  if (text.includes('plan') || text.includes('next')) return 'Pick the smallest next step first. I will keep the passport context ready.';
  if (text.includes('tired') || text.includes('sleep')) return 'Take the quieter route for now. I will stay available without demanding attention.';
  return 'Signal received. Your ZEALWISH passport can keep growing from this moment.';
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// --- SSE helpers (same protocol as api/chat.js) ---

function sseHeaders(res) {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
}

function sseWrite(res, payload) {
  if (res.writableEnded) return;
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function sseFinish(res, donePayload) {
  if (res.writableEnded) return;
  sseWrite(res, donePayload);
  res.write('data: [DONE]\n\n');
  res.end();
}

function streamFallback(res, text, warning) {
  sseWrite(res, { delta: text });
  sseFinish(res, { done: true, text, source: 'fallback', warning });
}

app.post('/api/generate-image', async (req, res) => {
  if (!IMAGE_API_KEY) {
    return res.status(503).json({ error: 'Image generation not configured' });
  }

  const { prompt, aspectRatio = '1:1', imageSize, count = 1 } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const size = imageSize || ({ '16:9': '1280x800', '9:16': '800x1280' }[aspectRatio] || '1024x1024');
  const n = Math.min(4, Math.max(1, Number(count) || 1));

  const generateOne = async () => {
    try {
      const response = await fetchWithRetry(`${IMAGE_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${IMAGE_API_KEY}`,
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt,
          n: 1,
          size,
          response_format: 'b64_json',
        }),
      }, { timeout: 50000 });
      if (!response.ok) {
        console.error('Image API error:', response.status);
        response.body?.cancel?.().catch(() => {});
        return null;
      }
      const data = await response.json();
      const imageB64 = data.data?.[0]?.b64_json;
      if (!imageB64) return null;
      return imageB64.startsWith('data:') ? imageB64 : `data:image/png;base64,${imageB64}`;
    } catch (err) {
      console.error('Image generation failed:', err.message);
      return null;
    }
  };

  const results = await Promise.all(Array.from({ length: n }, () => generateOne()));
  const dataUrls = results.filter(Boolean);
  if (!dataUrls.length) {
    return res.status(502).json({ error: 'Image generation failed' });
  }
  res.json({ dataUrl: dataUrls[0], dataUrls });
});

app.post('/api/analyze-photo', async (req, res) => {
  if (!VISION_API_KEY) {
    return res.status(503).json({ error: 'Vision analysis not configured' });
  }

  const { imageDataUrl } = req.body;
  if (!imageDataUrl) {
    return res.status(400).json({ error: 'imageDataUrl is required' });
  }

  try {
    const response = await fetchWithRetry(`${VISION_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VISION_API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze the appearance of the person in this photo for creating a virtual character. Reply ONLY with raw JSON (no markdown code fences):
{"keywords":["keyword1","keyword2",...],"description":"a complete character appearance description"}

Requirements:
- keywords: extract 8-15 short keywords covering hair style and color, eyes and facial features, body type, outfit, accessories, and overall vibe
- description: a 2-3 sentence English character description suitable for generating an anime / pixel / cyber style virtual character
- if there is no person in the photo, imagine a character inspired by the image content`
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl }
            }
          ]
        }],
        max_tokens: 600,
      }),
    }, { timeout: 25000 });

    if (!response.ok) {
      console.error('Vision API error:', response.status);
      response.body?.cancel?.().catch(() => {});
      return res.status(502).json({ error: 'Photo analysis failed' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = { keywords: [], description: text };
    }

    res.json({
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      description: typeof parsed.description === 'string' ? parsed.description : '',
    });
  } catch (err) {
    console.error('Photo analysis failed:', err.message);
    res.status(502).json({ error: 'Photo analysis failed' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { system, messages, stream } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages is required and must be a non-empty array' });
  }

  if (!messages.every((m) => m && typeof m.role === 'string' && typeof m.content === 'string' && m.content.length > 0)) {
    return res.status(400).json({ error: 'each message needs a string role and content' });
  }

  const wantsStream = stream === true;

  if (!CHAT_API_KEY) {
    const text = fallbackChatReply(messages);
    if (wantsStream) {
      sseHeaders(res);
      return streamFallback(res, text, FALLBACK_WARNING);
    }
    return res.json({ text, source: 'fallback', warning: FALLBACK_WARNING });
  }

  const payload = {
    model: CHAT_MODEL,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...messages,
    ],
    max_tokens: 512,
    stream: wantsStream,
  };

  if (!wantsStream) {
    try {
      const response = await fetchWithTimeout(`${CHAT_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHAT_API_KEY}`,
        },
        body: JSON.stringify(payload),
      }, 45000);

      if (!response.ok) {
        console.error('Chat API error:', response.status);
        response.body?.cancel?.().catch(() => {});
        return res.json({ text: fallbackChatReply(messages), source: 'fallback', warning: UPSTREAM_WARNING });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return res.json({ text, source: 'llm' });
    } catch (err) {
      console.error('Chat failed:', err.message);
      return res.json({ text: fallbackChatReply(messages), source: 'fallback', warning: UPSTREAM_WARNING });
    }
  }

  // --- Streaming (SSE) path ---
  sseHeaders(res);

  let clientGone = false;
  res.on?.('close', () => { clientGone = true; });

  let accumulated = '';
  try {
    const response = await fetchWithTimeout(`${CHAT_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHAT_API_KEY}`,
      },
      body: JSON.stringify(payload),
    }, 45000);

    if (!response.ok || !response.body) {
      console.error('Chat API stream error:', response.status);
      response.body?.cancel?.().catch(() => {});
      return streamFallback(res, fallbackChatReply(messages), UPSTREAM_WARNING);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let upstreamDone = false;

    while (!upstreamDone) {
      if (clientGone) {
        reader.cancel().catch(() => {});
        return;
      }
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (!line.startsWith('data:')) continue;
        const dataStr = line.slice(5).trim();
        if (dataStr === '[DONE]') {
          upstreamDone = true;
          break;
        }
        try {
          const chunk = JSON.parse(dataStr);
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            accumulated += delta;
            sseWrite(res, { delta });
          }
        } catch {
          // Ignore malformed upstream chunks.
        }
      }
    }

    if (!accumulated) {
      console.error('Chat API stream returned no content');
      return streamFallback(res, fallbackChatReply(messages), UPSTREAM_WARNING);
    }
    return sseFinish(res, { done: true, text: accumulated, source: 'llm' });
  } catch (err) {
    console.error('Chat stream failed:', err.message);
    if (!accumulated) {
      return streamFallback(res, fallbackChatReply(messages), UPSTREAM_WARNING);
    }
    return sseFinish(res, { done: true, text: accumulated, source: 'llm', warning: 'Stream interrupted — partial reply.' });
  }
});

app.post('/api/speak', async (req, res) => {
  if (!TTS_API_KEY) {
    return res.status(503).json({ error: 'TTS not configured' });
  }

  const { text, gender = 'female' } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const voice = gender === 'male' ? TTS_VOICE_MALE : TTS_VOICE_FEMALE;
    const response = await fetchWithTimeout(TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TTS_API_KEY}`,
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: String(text).trim().slice(0, 800),
        voice,
        response_format: 'mp3',
        sample_rate: 24000,
        speed: 1,
      }),
    }, 20000);

    if (!response.ok) {
      console.error('TTS API error:', response.status);
      response.body?.cancel?.().catch(() => {});
      return res.status(502).json({ error: 'TTS failed' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
    res.json({ audioBase64, mimeType: 'audio/mpeg' });
  } catch (err) {
    console.error('TTS failed:', err.message);
    res.status(502).json({ error: 'TTS failed' });
  }
});

app.post('/api/detect-gender', async (req, res) => {
  const { description } = req.body;
  if (!description || !CHAT_API_KEY) {
    return res.json({ gender: 'female', warning: 'default' });
  }

  try {
    const response = await fetchWithTimeout(`${CHAT_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHAT_API_KEY}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [{
          role: 'user',
          content: `Based on this character description, answer with exactly one word, "male" or "female". No other content.\n\nDescription: ${description}`,
        }],
        // step-3.7-flash is a reasoning model; very low max_tokens yields
        // empty content (finish_reason "length"), so allow headroom.
        max_tokens: 200,
      }),
    }, 15000);

    if (!response.ok) {
      response.body?.cancel?.().catch(() => {});
      return res.json({ gender: 'female', warning: 'default' });
    }

    const data = await response.json();
    const text = (data.choices?.[0]?.message?.content || '').toLowerCase().trim();
    const gender = text.includes('male') && !text.includes('female') ? 'male' : 'female';
    res.json({ gender });
  } catch {
    res.json({ gender: 'female', warning: 'default' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    chat: Boolean(CHAT_API_KEY),
    tts: Boolean(TTS_API_KEY),
    image: Boolean(IMAGE_API_KEY),
    vision: Boolean(VISION_API_KEY),
  });
});

app.get('/api/runtime-status', (_req, res) => {
  res.json({
    native: false,
    hermes: null,
    tts: { configured: false, provider: 'browser' },
    airjelly: { source: 'mock' },
  });
});

async function fetchWithRetry(url, options, { maxRetries = 2, baseDelay = 1000, timeout = 25000 } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || res.status < 500) return res;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[retry] ${res.status} on attempt ${attempt + 1}, waiting ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt < maxRetries && (err.name === 'AbortError' || err.code === 'ECONNRESET')) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[retry] ${err.name} on attempt ${attempt + 1}, waiting ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

const PORT = process.env.API_PORT || 7291;
app.listen(PORT, () => {
  console.log(`[ocworld-api] running on http://localhost:${PORT}`);
  console.log(`[ocworld-api] CHAT:      ${CHAT_API_KEY ? 'configured' : 'NOT configured'} (${CHAT_MODEL})`);
  console.log(`[ocworld-api] TTS:       ${TTS_API_KEY ? 'configured' : 'NOT configured'} (${TTS_MODEL})`);
  console.log(`[ocworld-api] IMAGE_GEN: ${IMAGE_API_KEY ? 'configured' : 'NOT configured'} (${IMAGE_MODEL})`);
  console.log(`[ocworld-api] VISION:    ${VISION_API_KEY ? 'configured' : 'NOT configured'} (${VISION_MODEL})`);
});
