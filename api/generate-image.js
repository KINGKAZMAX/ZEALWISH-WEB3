import {
  imageKey,
  IMAGE_BASE_URL,
  IMAGE_MODEL,
  preflight,
  readBody,
  sendJson,
  fetchWithTimeout,
} from './_lib/stepfun.js';

const SIZE_MAP = {
  '16:9': '1280x800',
  '9:16': '800x1280',
};

// One image request, with a single retry on 5xx / network error.
async function generateOne(prompt, size, key) {
  const requestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size,
      response_format: 'b64_json',
    }),
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetchWithTimeout(`${IMAGE_BASE_URL}/images/generations`, requestInit, 50000);
      if (!response.ok) {
        console.error('Image API error:', response.status);
        response.body?.cancel?.().catch(() => {});
        if (response.status >= 500 && attempt === 0) continue;
        return null;
      }
      const data = await response.json();
      const imageB64 = data.data?.[0]?.b64_json;
      if (!imageB64) return null;
      return imageB64.startsWith('data:') ? imageB64 : `data:image/png;base64,${imageB64}`;
    } catch (err) {
      console.error('Image generation failed:', err?.message);
      if (attempt === 0) continue;
      return null;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (preflight(req, res, 'POST')) return;

  const key = imageKey();
  if (!key) {
    return sendJson(res, 503, { error: 'Image generation not configured' });
  }

  const { prompt, aspectRatio = '1:1', count = 1 } = readBody(req);
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return sendJson(res, 400, { error: 'prompt is required' });
  }

  const size = SIZE_MAP[aspectRatio] || '1024x1024';
  // step-1x returns one image per call; fan out for a selection grid (cap 4).
  const n = Math.min(4, Math.max(1, Number(count) || 1));

  const results = await Promise.all(
    Array.from({ length: n }, () => generateOne(prompt, size, key))
  );
  const dataUrls = results.filter(Boolean);

  if (!dataUrls.length) {
    return sendJson(res, 502, { error: 'Image generation failed' });
  }

  // dataUrl kept for backward compatibility (first option).
  return sendJson(res, 200, { dataUrl: dataUrls[0], dataUrls });
}
