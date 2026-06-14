import {
  chatKey,
  ttsKey,
  imageKey,
  visionKey,
  preflight,
  sendJson,
} from './_lib/stepfun.js';

export default async function handler(req, res) {
  if (preflight(req, res, 'GET')) return;

  return sendJson(res, 200, {
    status: 'ok',
    chat: Boolean(chatKey()),
    tts: Boolean(ttsKey()),
    image: Boolean(imageKey()),
    vision: Boolean(visionKey()),
  });
}
