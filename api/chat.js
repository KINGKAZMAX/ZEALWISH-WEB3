import {
  chatKey,
  CHAT_BASE_URL,
  CHAT_MODEL,
  preflight,
  readBody,
  sendJson,
  fetchWithTimeout,
  fallbackChatReply,
} from './_lib/stepfun.js';

export const config = { supportsResponseStreaming: true };

const FALLBACK_WARNING = 'Chat API key not configured — deterministic companion reply.';
const UPSTREAM_WARNING = 'Chat upstream unavailable — deterministic companion reply.';

function sseHeaders(res) {
  res.statusCode = 200;
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

export default async function handler(req, res) {
  if (preflight(req, res, 'POST')) return;

  const body = readBody(req);
  const { system, messages, stream } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return sendJson(res, 400, { error: 'messages is required and must be a non-empty array' });
  }

  if (!messages.every((m) => m && typeof m.role === 'string' && typeof m.content === 'string' && m.content.length > 0)) {
    return sendJson(res, 400, { error: 'each message needs a string role and content' });
  }

  const wantsStream = stream === true;
  const key = chatKey();

  if (!key) {
    const text = fallbackChatReply(messages);
    if (wantsStream) {
      sseHeaders(res);
      return streamFallback(res, text, FALLBACK_WARNING);
    }
    return sendJson(res, 200, { text, source: 'fallback', warning: FALLBACK_WARNING });
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
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
      }, 45000);

      if (!response.ok) {
        console.error('Chat API error:', response.status);
        response.body?.cancel?.().catch(() => {});
        return sendJson(res, 200, {
          text: fallbackChatReply(messages),
          source: 'fallback',
          warning: UPSTREAM_WARNING,
        });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return sendJson(res, 200, { text, source: 'llm' });
    } catch (err) {
      console.error('Chat failed:', err?.message);
      return sendJson(res, 200, {
        text: fallbackChatReply(messages),
        source: 'fallback',
        warning: UPSTREAM_WARNING,
      });
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
        Authorization: `Bearer ${key}`,
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
    console.error('Chat stream failed:', err?.message);
    if (!accumulated) {
      return streamFallback(res, fallbackChatReply(messages), UPSTREAM_WARNING);
    }
    return sseFinish(res, {
      done: true,
      text: accumulated,
      source: 'llm',
      warning: 'Stream interrupted — partial reply.',
    });
  }
}
