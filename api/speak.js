import {
  ttsKey,
  TTS_ENDPOINT,
  TTS_MODEL,
  TTS_VOICE_MALE,
  TTS_VOICE_FEMALE,
  preflight,
  readBody,
  sendJson,
  fetchWithTimeout,
} from './_lib/stepfun.js';

export default async function handler(req, res) {
  if (preflight(req, res, 'POST')) return;

  const key = ttsKey();
  if (!key) {
    // 503 so the client falls back to browser speechSynthesis.
    return sendJson(res, 503, { error: 'TTS not configured' });
  }

  const { text, gender = 'female' } = readBody(req);
  if (typeof text !== 'string' || !text.trim()) {
    return sendJson(res, 400, { error: 'text is required' });
  }

  const voice = gender === 'male' ? TTS_VOICE_MALE : TTS_VOICE_FEMALE;
  const input = text.trim().slice(0, 800);

  try {
    const response = await fetchWithTimeout(TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input,
        voice,
        response_format: 'mp3',
        sample_rate: 24000,
        speed: 1,
      }),
    }, 20000);

    if (!response.ok) {
      console.error('TTS API error:', response.status);
      response.body?.cancel?.().catch(() => {});
      return sendJson(res, 502, { error: 'TTS failed' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
    return sendJson(res, 200, { audioBase64, mimeType: 'audio/mpeg' });
  } catch (err) {
    console.error('TTS failed:', err?.message);
    return sendJson(res, 502, { error: 'TTS failed' });
  }
}
