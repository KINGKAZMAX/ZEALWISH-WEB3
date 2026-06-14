import {
  chatKey,
  CHAT_BASE_URL,
  CHAT_MODEL,
  preflight,
  readBody,
  sendJson,
  fetchWithTimeout,
} from './_lib/stepfun.js';

export default async function handler(req, res) {
  if (preflight(req, res, 'POST')) return;

  const { description } = readBody(req);
  const key = chatKey();

  if (typeof description !== 'string' || !description.trim() || !key) {
    return sendJson(res, 200, { gender: 'female', warning: 'default' });
  }

  try {
    const response = await fetchWithTimeout(`${CHAT_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
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
      return sendJson(res, 200, { gender: 'female', warning: 'default' });
    }

    const data = await response.json();
    const text = (data.choices?.[0]?.message?.content || '').toLowerCase().trim();
    const gender = text.includes('male') && !text.includes('female') ? 'male' : 'female';
    return sendJson(res, 200, { gender });
  } catch {
    return sendJson(res, 200, { gender: 'female', warning: 'default' });
  }
}
