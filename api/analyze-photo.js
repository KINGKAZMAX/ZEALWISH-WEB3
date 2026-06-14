import {
  visionKey,
  VISION_BASE_URL,
  VISION_MODEL,
  preflight,
  readBody,
  sendJson,
  fetchWithTimeout,
} from './_lib/stepfun.js';

const VISION_PROMPT = `Analyze the appearance of the person in this photo for creating a virtual character. Reply ONLY with raw JSON (no markdown code fences):
{"keywords":["keyword1","keyword2",...],"description":"a complete character appearance description"}

Requirements:
- keywords: extract 8-15 short keywords covering hair style and color, eyes and facial features, body type, outfit, accessories, and overall vibe
- description: a 2-3 sentence English character description suitable for generating an anime / pixel / cyber style virtual character
- if there is no person in the photo, imagine a character inspired by the image content`;

export default async function handler(req, res) {
  if (preflight(req, res, 'POST')) return;

  const key = visionKey();
  if (!key) {
    return sendJson(res, 503, { error: 'Vision analysis not configured' });
  }

  const { imageDataUrl } = readBody(req);
  if (typeof imageDataUrl !== 'string' || !imageDataUrl.trim()) {
    return sendJson(res, 400, { error: 'imageDataUrl is required' });
  }

  try {
    const response = await fetchWithTimeout(`${VISION_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: VISION_PROMPT },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        }],
        max_tokens: 600,
      }),
    }, 25000);

    if (!response.ok) {
      console.error('Vision API error:', response.status);
      response.body?.cancel?.().catch(() => {});
      return sendJson(res, 502, { error: 'Photo analysis failed' });
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

    return sendJson(res, 200, {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      description: typeof parsed.description === 'string' ? parsed.description : '',
    });
  } catch (err) {
    console.error('Photo analysis failed:', err?.message);
    return sendJson(res, 502, { error: 'Photo analysis failed' });
  }
}
