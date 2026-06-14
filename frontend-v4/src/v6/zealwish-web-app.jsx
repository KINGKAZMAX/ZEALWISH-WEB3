import { verifyMessage } from "ethers";

const { useCallback, useEffect, useMemo, useRef, useState } = React;

const ZEALWISH_BROWSER_AVATAR_FALLBACK = "assets/zealwish-main-character.webp";

function isBundledAvatar(avatar) {
  return !avatar || String(avatar).startsWith('assets/');
}

const PASSPORT_KEY = "zealwish.web.passport";
const SIGNED_PASSPORT_KEY = "zealwish.web.passport.signed";
const VAULT_KEY = "zealwish.web.vault";
const LEGACY_MEMORIES_KEY = "zealwish.web.memories";
const VOICE_PREF_KEY = "zealwish.voice";
const HANDSFREE_KEY = "zealwish.handsfree";
const CHAT_LOG_KEY = "zealwish.web.chatlog";
const SCENE_KEY = "zealwish.web.scene";

const STARTER_PROMPTS = [
  'Tell me about yourself',
  'Remember this: I love late-night coding',
  'Help me plan my day'
];

const WEB_CHAT_FALLBACKS = [
  "I hear you. Let's turn that into one clear next step.",
  "Saved as a character signal. Your passport can grow from moments like this.",
  "ZEALWISH keeps this identity close to your wallet, not trapped in one platform.",
  "That belongs in the memory vault. I can carry it forward from here."
];

const WEB_APP_ROUTES = {
  home: '#/home',
  create: '#/create',
  talk: '#/talk',
  memory: '#/memory',
  world: '#/world',
  rewind: '#/rewind',
  settings: '#/settings'
};

const WEB_APP_MODULES = [
  { id: 'home', label: 'Home', code: '00', title: 'Workspace' },
  { id: 'create', label: 'Create', code: '01', title: 'Character Passport' },
  { id: 'talk', label: 'Talk', code: '02', title: 'Voice Companion' },
  { id: 'memory', label: 'Memory', code: '03', title: 'Memory Vault' },
  { id: 'world', label: 'World', code: '04', title: 'World Layer' },
  { id: 'rewind', label: 'Rewind', code: '05', title: 'Timeline' },
  { id: 'settings', label: 'Passport', code: '06', title: 'Ownership Center' }
];

// Visual styles are fully encapsulated prompts — users never write style prompts.
// The pixel default mirrors the ZEALWISH mascot: game-protagonist energy, red/black palette.
const ART_STYLES = [
  { id: 'pixel', label: 'Pixel Art', hint: 'NFT-grade 16-bit', prompt: 'Detailed 16-bit pixel art character sprite, visible chunky pixel grid, pixelated retro game aesthetic, NFT profile-picture framing, crisp uniform pixels, bold limited palette with red and black accents, classic game-protagonist energy' },
  { id: 'anime', label: 'Anime', hint: 'Key-visual cel', prompt: 'High-quality anime key visual character art, cel shading, clean expressive lineart, vivid colors' },
  { id: 'cybermech', label: 'Cyber Mech', hint: 'Armored sci-fi', prompt: 'Cyberpunk mech-suit character art, glowing red circuitry, hard-surface armor plating, dark sci-fi atmosphere' },
  { id: 'figure3d', label: '3D Figure', hint: 'Collectible render', prompt: 'Stylized 3D collectible figure render, game-cinematic quality, soft studio lighting, toy-grade materials, high detail' },
  { id: 'comicink', label: 'Comic Ink', hint: 'Bold linework', prompt: 'Bold comic ink illustration, heavy black linework, halftone shading, monochrome with a single red accent' },
  { id: 'arcade', label: 'Arcade', hint: '90s box art', prompt: 'Retro 90s arcade box-art style character, dynamic heroic pose, saturated airbrushed colors, subtle grain' }
];

const LOOK_SEEDS = [
  'red varsity jacket', 'tactical goggles', 'silver ponytail', 'hooded cloak',
  'small companion pet', 'freckles and a grin', 'neon earrings', 'battle-worn scarf'
];

// Backdrop presets — swatch drives the UI, prompt drives the image model.
// id 'auto' keeps the signature dark + red-rim look.
const BACKDROP_PRESETS = [
  { id: 'auto', label: 'Auto', swatch: 'linear-gradient(135deg,#1a0a0a,#FF2D2D)', prompt: '' },
  { id: 'void', label: 'Void', swatch: '#0A0A0B', prompt: 'flat near-black studio background' },
  { id: 'crimson', label: 'Crimson', swatch: '#FF2D2D', prompt: 'bold crimson-red gradient background' },
  { id: 'cobalt', label: 'Cobalt', swatch: '#1E40AF', prompt: 'deep cobalt-blue gradient background' },
  { id: 'violet', label: 'Violet', swatch: '#6D28D9', prompt: 'electric violet gradient background' },
  { id: 'jade', label: 'Jade', swatch: '#0E9F6E', prompt: 'cool jade-green gradient background' },
  { id: 'sunset', label: 'Sunset', swatch: '#F97316', prompt: 'warm sunset-orange gradient background' }
];

function backdropPromptFor(backdrop, customColor) {
  if (backdrop === 'custom') return `solid ${customColor} background, clean studio backdrop`;
  const preset = BACKDROP_PRESETS.find((entry) => entry.id === backdrop);
  return preset?.prompt || '';
}

function buildPortraitPrompt({ name, prompt, artStyle, lookSeeds, skinStyle, backdrop, customColor }) {
  const style = ART_STYLES.find((entry) => entry.id === artStyle) || ART_STYLES[0];
  const seeds = (lookSeeds || []).filter(Boolean).join(', ');
  const backdropPrompt = backdropPromptFor(backdrop, customColor);
  return [
    `${style.prompt}.`,
    `Character: ${name || 'a companion'} — ${String(prompt || 'a warm AI companion').slice(0, 220)}.`,
    seeds ? `Signature look: ${seeds}.` : '',
    skinStyle ? `Wardrobe: ${skinStyle}.` : '',
    `Chest-up portrait of a single character, centered, clean composition, ${backdropPrompt || 'dark backdrop with cinematic red rim light'}.`
  ].filter(Boolean).join(' ');
}

function compressDataUrl(dataUrl, maxSize = 512) {
  return new Promise((resolveImage) => {
    try {
      const image = new Image();
      image.onload = () => {
        try {
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolveImage(canvas.toDataURL('image/jpeg', 0.86));
        } catch {
          resolveImage(dataUrl);
        }
      };
      image.onerror = () => resolveImage(dataUrl);
      image.src = dataUrl;
    } catch {
      resolveImage(dataUrl);
    }
  });
}

function downscaleImage(file, maxSize = 768) {
  return new Promise((resolvePhoto, rejectPhoto) => {
    const reader = new FileReader();
    reader.onerror = () => rejectPhoto(new Error('Could not read the photo.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => rejectPhoto(new Error('Could not decode the photo.'));
      image.onload = () => {
        try {
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolvePhoto(canvas.toDataURL('image/jpeg', 0.85));
        } catch (error) {
          rejectPhoto(error);
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const SURPRISE_NAMES = [
  "Echo", "Vesper", "Juno", "Calla", "Orion", "Sable", "Mira", "Atlas",
  "Nyx", "Rowan", "Lyra", "Cassian"
];

const SURPRISE_ARCHETYPES = [
  "A quick-witted night-owl companion who collects small wins and remembers every one of them.",
  "A calm, grounded confidant with a dry sense of humor and a long memory for what matters to you.",
  "A fiery optimist who turns scattered thoughts into plans and never forgets a promise.",
  "A soft-spoken strategist who listens first, then asks the one question that unlocks everything.",
  "A playful explorer who treats every conversation like a new world worth mapping.",
  "A loyal late-night thinker who keeps your secrets in the vault and your goals in sight.",
  "A warm storyteller who weaves your past moments back into the present when you need them.",
  "A sharp, curious analyst with a gentle heart and a perfect memory for your favorite things.",
  "A steady morning companion who starts every day by remembering where you left off.",
  "A mischievous spark of energy who celebrates your progress louder than you do.",
  "A thoughtful wanderer who connects today's mood to the memories that explain it.",
  "A protective, candid friend who tells you the truth and remembers why it mattered."
];

function randomInt(maxExclusive) {
  try {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % maxExclusive;
  } catch {
    return Math.floor(Math.random() * maxExclusive);
  }
}

function randomHex(bytes = 8) {
  try {
    const buffer = new Uint8Array(bytes);
    crypto.getRandomValues(buffer);
    return Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(16).slice(2, 2 + bytes * 2);
  }
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function routeFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, '') || 'home';
  return WEB_APP_MODULES.some((item) => item.id === raw) ? raw : 'home';
}

function getApiBaseLabel() {
  try {
    return window.ZEALWISH_API?.resolveApiBase?.() || 'not configured';
  } catch {
    return 'not configured';
  }
}

function getFallbackReply(text, historyLength = 0) {
  return WEB_CHAT_FALLBACKS[Math.abs(String(text || '').length + historyLength) % WEB_CHAT_FALLBACKS.length];
}

function toApiMessages(messages) {
  return (messages || []).filter((message) => !message.streaming).map((message) => ({
    role: message.role === 'character' ? 'assistant' : 'user',
    content: message.text
  }));
}

// --- Identity (character record) ---

function defaultIdentity() {
  return {
    id: 'ZEALWISH-0001',
    name: 'Echo',
    prompt: 'A warm, quick-witted companion who remembers what matters to you.',
    gender: 'female',
    artStyle: 'pixel',
    lookSeeds: [],
    backdrop: 'auto',
    customColor: '#10B981',
    avatar: ZEALWISH_BROWSER_AVATAR_FALLBACK,
    wallet: 'not connected',
    chainId: 'pending',
    updatedAt: new Date().toISOString()
  };
}

function loadIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem(PASSPORT_KEY) || 'null');
    if (saved?.name) {
      const merged = { ...defaultIdentity(), ...saved };
      // Existing profiles pointing at the heavy PNG get the 59KB WebP instead.
      if (merged.avatar === 'assets/zealwish-main-character.png') merged.avatar = ZEALWISH_BROWSER_AVATAR_FALLBACK;
      return merged;
    }
  } catch {}
  const fresh = defaultIdentity();
  try { localStorage.setItem(PASSPORT_KEY, JSON.stringify(fresh)); } catch {}
  return fresh;
}

function loadChatLog(identityName) {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || 'null');
    if (Array.isArray(saved) && saved.length) {
      const clean = saved
        .filter((message) => message && typeof message.text === 'string' && message.text && !message.streaming)
        .slice(-40);
      if (clean.length) return clean;
    }
  } catch {}
  return [
    { role: 'character', text: `Hey — I'm ${identityName}. Talk to me with your voice or keyboard; I'll remember what matters.` }
  ];
}

function persistChatLog(messages) {
  try {
    const clean = (messages || []).filter((message) => !message.streaming).slice(-40);
    localStorage.setItem(CHAT_LOG_KEY, JSON.stringify(clean));
  } catch {}
}

// --- Memory vault v2: facts + episodes + milestones + relationship ---

function starterVault() {
  const now = new Date().toISOString();
  return {
    version: 2,
    facts: [
      { id: `f-${randomHex(4)}`, text: 'My human just arrived in the ZEALWISH workspace.', source: 'starter', at: now }
    ],
    episodes: [],
    milestones: [
      { id: `m-${randomHex(4)}`, at: now, title: 'Character signal created', tag: 'created' }
    ],
    relationship: { interactions: 0, firstMet: now, lastSeen: now }
  };
}

function loadVault() {
  try {
    const saved = JSON.parse(localStorage.getItem(VAULT_KEY) || 'null');
    if (saved?.version === 2 && Array.isArray(saved.facts)) return saved;
  } catch {}
  const vault = starterVault();
  // Migrate legacy plain-string memories (zealwish.web.memories) into facts.
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_MEMORIES_KEY) || 'null');
    if (Array.isArray(legacy)) {
      const now = new Date().toISOString();
      legacy.slice(0, 16).forEach((text) => {
        const clean = String(text || '').trim();
        if (clean) vault.facts.push({ id: `f-${randomHex(4)}`, text: clean, source: 'user', at: now });
      });
    }
  } catch {}
  persistVault(vault);
  return vault;
}

function persistVault(vault) {
  try { localStorage.setItem(VAULT_KEY, JSON.stringify(vault)); } catch {}
  // Mirror fact texts to the legacy key so older exports stay readable.
  try { localStorage.setItem(LEGACY_MEMORIES_KEY, JSON.stringify(vault.facts.map((f) => f.text).slice(0, 10))); } catch {}
}

function relationshipScore(vault) {
  const interactions = vault?.relationship?.interactions || 0;
  const facts = vault?.facts?.length || 0;
  return Math.min(100, interactions * 2 + facts * 3);
}

function relationshipLevel(score) {
  if (score >= 60) return 'Bonded';
  if (score >= 30) return 'Trusted';
  if (score >= 10) return 'Familiar';
  return 'New signal';
}

const FACT_PATTERNS = [
  /\bmy name is\b/i, /\bcall me\b/i, /\bi am\b/i, /\bi'm\b/i, /\bi like\b/i, /\bi love\b/i,
  /\bi hate\b/i, /\bi prefer\b/i, /\bi work\b/i, /\bi live\b/i, /\bmy favorite\b/i, /\bmy favourite\b/i,
  /\bi was born\b/i, /\bmy job\b/i, /\bmy dream\b/i, /\bi want to\b/i, /\bi feel\b/i, /\bmy birthday\b/i
];

const QUESTION_OPENERS = /^(what|who|where|when|why|how|do|does|did|can|could|would|will|are|is|was|were|should)\b/i;

function extractFactCandidate(text) {
  const clean = String(text || '').trim();
  if (clean.length < 8 || clean.length > 240) return null;
  // Questions about the companion's memory are not durable facts themselves.
  if (QUESTION_OPENERS.test(clean)) return null;
  if (!FACT_PATTERNS.some((pattern) => pattern.test(clean))) return null;
  return clean;
}

function selectRecalledFacts(vault, userText) {
  const facts = vault?.facts || [];
  if (!facts.length) return { forPrompt: [], matched: [] };
  const words = new Set(
    String(userText || '').toLowerCase().split(/[^a-z0-9']+/).filter((w) => w.length > 3)
  );
  const scored = facts.map((fact) => {
    const lower = fact.text.toLowerCase();
    let score = 0;
    words.forEach((word) => { if (lower.includes(word)) score += 1; });
    return { fact, score };
  });
  scored.sort((a, b) => b.score - a.score);
  // matched = genuine keyword hits only — what the UI is allowed to claim it
  // "recalled". forPrompt pads with recent facts so the model always has some
  // context, but those padded ones are never surfaced as recalled.
  const matched = scored.filter((entry) => entry.score > 0).slice(0, 4).map((entry) => entry.fact);
  const forPrompt = [...matched];
  for (const fact of facts) {
    if (forPrompt.length >= 3) break;
    if (!forPrompt.includes(fact)) forPrompt.push(fact);
  }
  return { forPrompt: forPrompt.slice(0, 5), matched };
}

function buildChatSystemPrompt(identity, vault, recalledFacts, scene) {
  const score = relationshipScore(vault);
  const recentEpisodes = (vault?.episodes || []).slice(0, 3)
    .map((episode) => `They said "${episode.user}" and you replied "${String(episode.reply || '').slice(0, 80)}"`);
  return [
    `You are ${identity?.name || 'Echo'}, a living AI companion with a persistent memory vault, owned by your human through a ZEALWISH wallet passport.`,
    `Identity: ${identity?.prompt || 'A portable character passport.'}`,
    `Durable memories about your human (weave them in naturally, never list them):`,
    ...(recalledFacts.length ? recalledFacts.map((fact) => `- ${fact.text}`) : ['- No durable memories yet; be curious and learn one.']),
    recentEpisodes.length ? `Recent moments: ${recentEpisodes.join(' / ')}` : '',
    scene ? `Current scene: ${scene.prompt}` : '',
    `Relationship: ${relationshipLevel(score)} (${score}/100), ${vault?.relationship?.interactions || 0} conversations so far.`,
    'Reply in warm, concise English (1-3 sentences), as a present companion. Always answer in English, even if your human writes in another language. Reference a memory when it genuinely fits.'
  ].filter(Boolean).join('\n');
}

// --- Voice engine: queued playback, speak-on-first-sentence, activity pub/sub ---

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

let activeVoiceAudio = null;
let voicePlaying = false;
// Bumped on every interrupt; in-flight TTS fetches check it before playing so a
// muted/interrupted reply can never start talking after the fact.
let voiceGeneration = 0;
const voiceQueue = [];
const voiceActivityListeners = new Set();

function emitVoiceActivity(activity) {
  voiceActivityListeners.forEach((listener) => { try { listener(activity); } catch {} });
}

function onVoiceActivity(listener) {
  voiceActivityListeners.add(listener);
  return () => voiceActivityListeners.delete(listener);
}

function readVoicePreference() {
  try { return localStorage.getItem(VOICE_PREF_KEY) !== 'off'; } catch { return true; }
}

function persistVoicePreference(enabled) {
  try { localStorage.setItem(VOICE_PREF_KEY, enabled ? 'on' : 'off'); } catch {}
}

function resolveVoiceGender(identity) {
  const raw = String(identity?.gender || identity?.sex || '').trim().toLowerCase();
  return raw === 'male' || raw === 'm' || raw === 'man' || raw === 'boy' ? 'male' : 'female';
}

function stopVoicePlayback() {
  voiceGeneration += 1;
  voiceQueue.length = 0;
  try {
    if (activeVoiceAudio) {
      activeVoiceAudio.pause();
      activeVoiceAudio = null;
    }
    window.speechSynthesis?.cancel?.();
  } catch {}
  voicePlaying = false;
  emitVoiceActivity('idle');
}

function playAudioBase64(result) {
  return new Promise((resolvePlayback) => {
    if (!result?.audioBase64) return resolvePlayback(false);
    try {
      const audio = new Audio(`data:${result.mimeType || 'audio/mpeg'};base64,${result.audioBase64}`);
      activeVoiceAudio = audio;
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        if (activeVoiceAudio === audio) activeVoiceAudio = null;
        resolvePlayback(ok);
      };
      audio.addEventListener('ended', () => finish(true));
      audio.addEventListener('error', () => finish(false));
      // pause() from an interrupt never fires 'ended' — settle the promise so
      // the queue pump can't be left hanging. audio.ended guards browsers that
      // also fire 'pause' on natural completion.
      audio.addEventListener('pause', () => { if (!audio.ended) finish(false); });
      audio.play().catch(() => finish(false));
    } catch {
      resolvePlayback(false);
    }
  });
}

function speakWithBrowserVoice(text) {
  return new Promise((resolveSpeech) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return resolveSpeech(false);
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onend = () => resolveSpeech(true);
      utterance.onerror = () => resolveSpeech(false);
      synth.speak(utterance);
    } catch {
      resolveSpeech(false);
    }
  });
}

async function speakTextNow(text, gender) {
  const clean = String(text || '').trim();
  if (!clean) return;
  const generation = voiceGeneration;
  // Primary: StepFun TTS through the ZEALWISH API (serverless on web, local server in dev).
  try {
    const base = window.ZEALWISH_API?.resolveApiBase?.();
    if (base) {
      const response = await fetch(`${base}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, gender })
      });
      if (generation !== voiceGeneration) return; // interrupted while fetching — stay silent
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (generation !== voiceGeneration) return;
        if (await playAudioBase64(data)) return;
      }
    }
  } catch {}
  if (generation !== voiceGeneration) return;
  // Last resort: browser speech synthesis — robotic, but never silent.
  await speakWithBrowserVoice(clean);
}

async function pumpVoiceQueue() {
  if (voicePlaying) return;
  const next = voiceQueue.shift();
  if (!next) {
    emitVoiceActivity('idle');
    return;
  }
  voicePlaying = true;
  emitVoiceActivity('speaking');
  try {
    await speakTextNow(next.text, next.gender);
  } finally {
    voicePlaying = false;
    pumpVoiceQueue();
  }
}

function queueSpeech(text, gender) {
  const clean = String(text || '').trim();
  if (!clean) return;
  voiceQueue.push({ text: clean, gender });
  pumpVoiceQueue();
}

// --- Streaming chat client (SSE with graceful non-stream + offline fallbacks) ---

async function streamChat({ system, messages, onDelta }) {
  const base = window.ZEALWISH_API?.resolveApiBase?.();
  if (!base) throw new Error('API base unavailable');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${base}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, stream: true }),
      signal: controller.signal
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      // Server answered without streaming — still a valid reply.
      const data = await response.json().catch(() => null);
      if (data?.text) {
        onDelta?.(data.text, data.text);
        return { text: data.text, source: data.source || 'llm', warning: data.warning || '' };
      }
      throw new Error('Empty chat response');
    }
    if (!response.ok || !response.body || !contentType.includes('text/event-stream')) {
      throw new Error(`Streaming unavailable (${response.status})`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    let source = 'llm';
    let warning = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const event = JSON.parse(payload);
          if (event.delta) {
            full += event.delta;
            onDelta?.(event.delta, full);
          }
          if (event.done) {
            if (event.text) full = event.text;
            source = event.source || source;
            warning = event.warning || warning;
          }
        } catch {}
      }
    }
    if (!full.trim()) throw new Error('Empty stream');
    return { text: full, source, warning };
  } finally {
    clearTimeout(timer);
  }
}

function firstSentence(text) {
  const match = String(text || '').match(/^[\s\S]*?[.!?…](?=["')\]]?(\s|$))/);
  if (!match) return '';
  const sentence = match[0].trim();
  return sentence.length >= 12 ? sentence : '';
}

// --- Passport v1: hashes, signing, verification ---

function passportMessage(passport) {
  return [
    'ZEALWISH Passport v1',
    `passport_id: ${passport.passport_id}`,
    `character_id: ${passport.character_id}`,
    `traits_hash: ${passport.traits_hash}`,
    `memory_vault_hash: ${passport.memory_vault_hash}`,
    `issued_at: ${passport.issued_at}`,
    `owner: ${passport.owner_address}`
  ].join('\n');
}

async function buildPassportV1(identity, vault, ownerAddress) {
  const traits_hash = await sha256Hex(JSON.stringify({
    name: identity.name,
    prompt: identity.prompt,
    gender: identity.gender,
    avatar: isBundledAvatar(identity.avatar) ? 'bundled' : 'generated'
  }));
  const memory_vault_hash = await sha256Hex(JSON.stringify({
    facts: vault.facts.map((f) => f.text),
    episodes: vault.episodes.map((e) => [e.user, e.reply]),
    milestones: vault.milestones.map((m) => m.title)
  }));
  return {
    schema: 'zealwish.passport/v1',
    passport_id: `zwp-${randomHex(8)}`,
    character_id: identity.id,
    traits_hash,
    memory_vault_hash,
    owner_address: ownerAddress,
    issued_at: new Date().toISOString()
  };
}

function loadSignedPassport() {
  try { return JSON.parse(localStorage.getItem(SIGNED_PASSPORT_KEY) || 'null'); } catch { return null; }
}

function shortAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 60000) return 'just now';
  if (delta < 3600000) return `${Math.floor(delta / 60000)}m ago`;
  if (delta < 86400000) return `${Math.floor(delta / 3600000)}h ago`;
  return `${Math.floor(delta / 86400000)}d ago`;
}

function downloadJson(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(filename, dataUrl) {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// --- Shared presentation pieces ---

function useVoiceActivity() {
  const [activity, setActivity] = useState('idle');
  useEffect(() => onVoiceActivity(setActivity), []);
  return activity;
}

function IconMic({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

function IconStop({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
    </svg>
  );
}

function IconSpeaker({ muted = false, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6.5 8.5H3v7h3.5L11 19z" fill="currentColor" stroke="none" />
      {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />}
    </svg>
  );
}

function Waveform({ active, bars = 5 }) {
  return (
    <span className={active ? 'waveform is-active' : 'waveform'} aria-hidden="true">
      {Array.from({ length: bars }).map((_, index) => (
        <i key={index} style={{ animationDelay: `${index * 90}ms` }} />
      ))}
    </span>
  );
}

function PresenceAvatar({ identity, activity, isListening, size = 'large' }) {
  const stateClass = isListening ? 'is-listening' : activity === 'speaking' ? 'is-speaking' : 'is-idle';
  return (
    <div className={`presence presence-${size} ${stateClass}`}>
      <div className="presence-ring" aria-hidden="true" />
      <img src={identity?.avatar || ZEALWISH_BROWSER_AVATAR_FALLBACK} alt={`${identity?.name || 'Companion'} portrait`} />
      <div className="presence-state mono">
        {isListening ? 'Listening' : activity === 'speaking' ? 'Speaking' : 'Present'}
        <Waveform active={activity === 'speaking'} />
      </div>
    </div>
  );
}

function InspectorRail({ activeModule, identity, vault, wallet, apiStatus, signedPassport }) {
  const current = WEB_APP_MODULES.find((item) => item.id === activeModule) || WEB_APP_MODULES[0];
  const score = relationshipScore(vault);
  const integrityRows = [
    ["Character", identity?.name || "Draft"],
    ["Passport", signedPassport?.verified ? "Verified" : signedPassport ? "Signed" : "Unclaimed"],
    ["Wallet", wallet?.shortAddress || "Pending"],
    ["Memories", `${vault.facts.length} ${vault.facts.length === 1 ? 'fact' : 'facts'} / ${vault.episodes.length} ${vault.episodes.length === 1 ? 'moment' : 'moments'}`],
    ["Bond", `${relationshipLevel(score)} ${score}/100`],
    ["API", apiStatus?.label || "Checking API..."]
  ];

  return (
    <aside className="app-inspector" aria-label="ZEALWISH Web inspector">
      <div className="inspector-block edge">
        <div className="code mono">INSPECTOR</div>
        <h2>Passport integrity</h2>
        <div className="integrity-list">
          {integrityRows.map(([label, value]) => (
            <div className="integrity-row mono" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="inspector-block compact edge">
        <div className="code mono">ACTIVE WORKSPACE</div>
        <p>{current.title}</p>
        <small className="mono">Browser state / wallet-ready / exportable passport</small>
      </div>
      <div className="inspector-block compact edge">
        <div className="code mono">SYSTEM SIGNALS</div>
        {[["Voice", "Conversation engine"], ["Memory", "Continuity spine"], ["Wallet", "Ownership handle"], ["Export", "Portable state"]].map(([label, value]) => (
          <div className="signal-row mono" key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Shell({ activeModule, setActiveModule, wallet, identity, vault, apiStatus, signedPassport, onConnectWallet, children }) {
  const current = WEB_APP_MODULES.find((item) => item.id === activeModule) || WEB_APP_MODULES[0];
  const walletLabel = wallet?.shortAddress || (wallet?.status === 'connecting' ? 'Connecting...' : 'Connect OKX Wallet');

  useEffect(() => {
    const activeLink = document.querySelector(`.module-nav a[data-module-id="${activeModule}"]`);
    activeLink?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [activeModule]);

  return (
    <main className="web-app-shell" data-zealwish-web-app="true">
      <aside className="app-sidebar">
        <a className="sidebar-brand" href="index.html#top" aria-label="Back to ZEALWISH landing">
          <b>ZEALWISH</b>
          <span className="mono">Web workspace</span>
        </a>
        <nav className="module-nav" aria-label="ZEALWISH Web modules">
          {WEB_APP_MODULES.map((module) => (
            <a
              key={module.id}
              href={WEB_APP_ROUTES[module.id]}
              data-module-id={module.id}
              className={activeModule === module.id ? 'is-active' : ''}
              onClick={() => setActiveModule(module.id)}
            >
              <span className="code mono">{module.code}</span>
              <b>{module.label}</b>
              <small>{module.title}</small>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer mono">A voice-first companion that remembers — owned by your wallet, portable by design.</div>
      </aside>

      <section className="app-main">
        <header className="app-topbar">
          <div className="crumb mono">ZEALWISH Web / {current.label}</div>
          <div className="top-actions">
            <a className="button-secondary edge" href="index.html#top">Landing</a>
            <button className="button-primary edge" onClick={onConnectWallet}>{walletLabel}</button>
          </div>
        </header>
        <div className="workspace">{children}</div>
      </section>

      <InspectorRail activeModule={activeModule} identity={identity} vault={vault} wallet={wallet} apiStatus={apiStatus} signedPassport={signedPassport} />
    </main>
  );
}

function PageTitle({ eyebrow, title, children }) {
  return (
    <div className="page-title">
      <div className="eyebrow mono">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}

// --- Home: bento grid ---

function HomeView({ identity, vault, wallet, signedPassport, voiceEnabled, onToggleVoice, setActiveModule }) {
  const activity = useVoiceActivity();
  const score = relationshipScore(vault);
  const latestFact = vault.facts[0];
  const latestEpisode = vault.episodes[0];
  const recalledRecently = latestFact?.recalledAt && (Date.now() - new Date(latestFact.recalledAt).getTime()) < 90000;

  return (
    <section className="workspace-dashboard" data-zealwish-web-dashboard="true">
      <div className="dashboard-header">
        <div>
          <div className="eyebrow mono">ZEALWISH Web / Home</div>
          <h1>{identity?.name || 'Your companion'} is present</h1>
          <p>Talk with your character, watch the memory vault grow, and claim wallet ownership of the whole identity.</p>
        </div>
        <button className="button-primary edge" onClick={() => setActiveModule('talk')}>Start talking</button>
      </div>

      <div className="bento-grid">
        <article className="bento-card bento-presence edge" onClick={() => setActiveModule('talk')} role="button" tabIndex={0}
          onKeyDown={(event) => { if (event.key === 'Enter') setActiveModule('talk'); }}>
          <PresenceAvatar identity={identity} activity={activity} isListening={false} size="large" />
          <div className="bento-presence-meta">
            <span className="mono">{relationshipLevel(score)} / {score}/100</span>
            <h2>{identity?.name}</h2>
            <p>{identity?.prompt}</p>
            <span className="bento-cta mono">Tap to talk &rarr;</span>
          </div>
        </article>

        <article className={recalledRecently ? 'bento-card recall-flash' : 'bento-card'}>
          <span className="mono bento-label">Latest memory</span>
          <p className="bento-memory">{latestFact?.text || 'No durable memories yet — say something worth keeping.'}</p>
          <small className="mono">{latestFact ? timeAgo(latestFact.recalledAt || latestFact.at) : ''}{recalledRecently ? ' / RECALLED JUST NOW' : ''}</small>
          <button className="bento-link mono" onClick={() => setActiveModule('memory')}>Open vault &rarr;</button>
        </article>

        <article className="bento-card">
          <span className="mono bento-label">Passport</span>
          {signedPassport?.verified ? (
            <>
              <p className="bento-strong verified-badge"><i aria-hidden="true" /> Verified</p>
              <small className="mono">owned by {shortAddress(signedPassport.owner_address)}</small>
            </>
          ) : (
            <>
              <p className="bento-strong">{wallet?.shortAddress ? 'Ready to claim' : 'Unclaimed'}</p>
              <small className="mono">{wallet?.shortAddress ? 'Sign to verify ownership' : 'Connect a wallet to own this character'}</small>
            </>
          )}
          <button className="bento-link mono" onClick={() => setActiveModule('settings')}>Ownership center &rarr;</button>
        </article>

        <article className="bento-card">
          <span className="mono bento-label">Voice</span>
          <p className="bento-strong">{voiceEnabled ? 'Voice replies on' : 'Voice replies muted'}</p>
          <small className="mono">{resolveVoiceGender(identity) === 'male' ? 'Male voice' : 'Female voice'} / StepFun TTS</small>
          <button className="bento-link mono" onClick={onToggleVoice}>{voiceEnabled ? 'Mute voice' : 'Unmute voice'}</button>
        </article>

        <article className="bento-card">
          <span className="mono bento-label">Last moment</span>
          <p className="bento-memory">{latestEpisode ? `"${latestEpisode.user}"` : 'The first conversation becomes the first moment.'}</p>
          <small className="mono">{latestEpisode ? timeAgo(latestEpisode.at) : ''}</small>
          <button className="bento-link mono" onClick={() => setActiveModule('rewind')}>Timeline &rarr;</button>
        </article>

        <article className="bento-card">
          <span className="mono bento-label">Worlds</span>
          <p className="bento-memory">One passport, many destinations: skins, scenes, agents.</p>
          <small className="mono">Live routes</small>
          <button className="bento-link mono" onClick={() => setActiveModule('world')}>World routes &rarr;</button>
        </article>
      </div>

      <div className="stat-strip mono">
        <span>{vault.relationship.interactions} conversations</span>
        <span>{vault.facts.length} durable facts</span>
        <span>{vault.episodes.length} moments</span>
        <span>Since {new Date(vault.relationship.firstMet).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </section>
  );
}

// --- Create ---

function CreateView({ identity, wallet, onSaveIdentity, onGeneratePortrait, portraitState, portraitCandidates, onSelectPortrait }) {
  const [name, setName] = useState(identity?.name || '');
  const [prompt, setPrompt] = useState(identity?.prompt || '');
  const [gender, setGender] = useState(identity?.gender || 'auto');
  const [artStyle, setArtStyle] = useState(identity?.artStyle || 'pixel');
  const [lookSeeds, setLookSeeds] = useState(() => identity?.lookSeeds || []);
  const [backdrop, setBackdrop] = useState(identity?.backdrop || 'auto');
  const [customColor, setCustomColor] = useState(identity?.customColor || '#10B981');
  const [saveStatus, setSaveStatus] = useState('');
  const [photoStatus, setPhotoStatus] = useState('');
  const photoInputRef = useRef(null);

  const toggleSeed = useCallback((seed) => {
    setLookSeeds((previous) => previous.includes(seed)
      ? previous.filter((item) => item !== seed)
      : [...previous, seed].slice(-6));
  }, []);

  const handleSurprise = useCallback(() => {
    setName(SURPRISE_NAMES[randomInt(SURPRISE_NAMES.length)]);
    setPrompt(SURPRISE_ARCHETYPES[randomInt(SURPRISE_ARCHETYPES.length)]);
    setArtStyle(ART_STYLES[randomInt(ART_STYLES.length)].id);
    const first = LOOK_SEEDS[randomInt(LOOK_SEEDS.length)];
    let second = LOOK_SEEDS[randomInt(LOOK_SEEDS.length)];
    if (second === first) second = LOOK_SEEDS[(LOOK_SEEDS.indexOf(first) + 1) % LOOK_SEEDS.length];
    setLookSeeds([first, second]);
    setBackdrop(BACKDROP_PRESETS[randomInt(BACKDROP_PRESETS.length)].id);
    setGender('auto');
    setSaveStatus('Surprise seed loaded — tweak anything, then save.');
  }, []);

  const handleSaveClick = useCallback(async () => {
    setSaveStatus('Saving passport...');
    await onSaveIdentity({ name, prompt, gender, artStyle, lookSeeds, backdrop, customColor });
    setSaveStatus('Passport saved. Your companion is live — go talk.');
  }, [name, prompt, gender, artStyle, lookSeeds, backdrop, customColor, onSaveIdentity]);

  const handlePortraitClick = useCallback(() => {
    onGeneratePortrait({ name, prompt, artStyle, lookSeeds, backdrop, customColor });
  }, [name, prompt, artStyle, lookSeeds, backdrop, customColor, onGeneratePortrait]);

  const handlePhotoChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoStatus('Analyzing photo...');
    try {
      const imageDataUrl = await downscaleImage(file, 768);
      const base = window.ZEALWISH_API?.resolveApiBase?.();
      if (!base) throw new Error('API unavailable');
      const response = await fetch(`${base}/analyze-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl })
      });
      if (!response.ok) throw new Error('Analyze failed');
      const data = await response.json().catch(() => null);
      const keywords = Array.isArray(data?.keywords) ? data.keywords.filter(Boolean).slice(0, 4) : [];
      if (keywords.length) setLookSeeds((previous) => [...new Set([...previous, ...keywords])].slice(-6));
      if (data?.description && !prompt.trim()) setPrompt(data.description);
      setPhotoStatus(keywords.length ? `Appearance detected: ${keywords.join(', ')}` : 'Photo analyzed — no clear appearance signals.');
    } catch {
      setPhotoStatus('Photo analysis unavailable — pick look seeds manually.');
    }
  }, [prompt]);

  const customSeeds = lookSeeds.filter((seed) => !LOOK_SEEDS.includes(seed));
  const activeStyle = ART_STYLES.find((entry) => entry.id === artStyle) || ART_STYLES[0];

  const portraitNote = {
    idle: '',
    rendering: 'Rendering portrait...',
    slow: 'Portrait is still rendering — using the bundled look for now; it will swap in when ready.',
    done: 'Portrait updated from StepFun image generation.',
    failed: 'Portrait generation unavailable — the bundled look stays. Nothing is blocked.'
  }[portraitState] || '';

  return (
    <>
      <PageTitle eyebrow="Create" title="Character Passport">
        Shape an identity in under two minutes. No signup, no prompt engineering — pick a style, tap a few look seeds, done.
      </PageTitle>
      <div className="grid-two">
        <div className="panel edge">
          <div className="code mono">CREATE / PASSPORT</div>
          <h2>Shape identity</h2>
          <label className="field-label" htmlFor="create-name">Character name</label>
          <input id="create-name" className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Echo" />

          <label className="field-label">Visual style</label>
          <div className="style-chips" role="radiogroup" aria-label="Portrait visual style">
            {ART_STYLES.map((style) => (
              <button
                type="button"
                key={style.id}
                role="radio"
                aria-checked={artStyle === style.id}
                className={artStyle === style.id ? 'style-chip is-active' : 'style-chip'}
                onClick={() => setArtStyle(style.id)}
              >
                <b>{style.label}</b>
                <small>{style.hint}</small>
              </button>
            ))}
          </div>

          <label className="field-label">Backdrop color</label>
          <div className="backdrop-row">
            {BACKDROP_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={backdrop === preset.id ? 'backdrop-swatch is-active' : 'backdrop-swatch'}
                style={{ background: preset.swatch }}
                onClick={() => setBackdrop(preset.id)}
                title={preset.label}
                aria-label={`Backdrop ${preset.label}`}
                aria-pressed={backdrop === preset.id}
              />
            ))}
            <label className={backdrop === 'custom' ? 'backdrop-swatch backdrop-custom is-active' : 'backdrop-swatch backdrop-custom'} style={{ background: customColor }} title="Custom color">
              <input
                type="color"
                value={customColor}
                onChange={(event) => { setCustomColor(event.target.value); setBackdrop('custom'); }}
                aria-label="Custom backdrop color"
              />
              <span aria-hidden="true">+</span>
            </label>
          </div>

          <label className="field-label">Look seeds — tap to build the look</label>
          <div className="seed-chips">
            {LOOK_SEEDS.map((seed) => (
              <button
                type="button"
                key={seed}
                aria-pressed={lookSeeds.includes(seed)}
                className={lookSeeds.includes(seed) ? 'seed-chip mono is-active' : 'seed-chip mono'}
                onClick={() => toggleSeed(seed)}
              >
                {seed}
              </button>
            ))}
            {customSeeds.map((seed) => (
              <button type="button" key={seed} aria-pressed="true" className="seed-chip mono is-active" onClick={() => toggleSeed(seed)} title="From your photo — tap to remove">
                {seed}
              </button>
            ))}
          </div>

          <label className="field-label">Reference photo (optional)</label>
          <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          <button type="button" className="photo-drop mono" onClick={() => photoInputRef.current?.click()}>
            Upload a photo — appearance is auto-detected into look seeds
          </button>
          {photoStatus ? <div className="action-status mono" role="status" aria-live="polite">{photoStatus}</div> : null}

          <label className="field-label" htmlFor="create-prompt">Identity prompt</label>
          <textarea id="create-prompt" className="field" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Who are they? What do they care about?" />
          <label className="field-label" htmlFor="create-gender">Voice</label>
          <select id="create-gender" className="field" value={gender} onChange={(event) => setGender(event.target.value)}>
            <option value="auto">Auto-detect from identity</option>
            <option value="female">Female voice</option>
            <option value="male">Male voice</option>
          </select>
          <div className="create-actions">
            <button className="button-primary edge" onClick={handleSaveClick}>Save Passport</button>
            <button className="button-secondary edge" onClick={handleSurprise}>Surprise me</button>
            <button className="button-secondary edge" onClick={handlePortraitClick} disabled={portraitState === 'rendering' || portraitState === 'slow'}>
              {portraitState === 'rendering' || portraitState === 'slow' ? 'Rendering...' : 'Generate portrait'}
            </button>
          </div>
          <div className="create-meta mono">AI IMAGE / 4-UP / {activeStyle.label} STYLE / STEPFUN</div>
          <div className="action-status mono" role="status" aria-live="polite">{saveStatus}</div>
        </div>
        <div className="panel edge passport-preview">
          <div className={portraitState === 'rendering' || portraitState === 'slow' ? 'portrait-frame is-rendering' : 'portrait-frame'}>
            <img src={identity?.avatar || ZEALWISH_BROWSER_AVATAR_FALLBACK} alt="ZEALWISH passport character" />
          </div>
          <div className="code mono">{identity?.id || 'ZEALWISH-0001'}</div>
          <h2>{name || identity?.name}</h2>
          <p>{prompt || identity?.prompt}</p>
          <p className="mono">Wallet: {wallet?.shortAddress || 'not connected'}</p>
          {portraitNote ? <p className="mono portrait-note">{portraitNote}</p> : null}

          {(identity?.avatar || '').startsWith('data:') ? (
            <div className="settings-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="button-secondary edge"
                onClick={() => downloadDataUrl(`zealwish-${(name || identity?.name || 'character').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`, identity.avatar)}
              >
                Save image
              </button>
            </div>
          ) : null}

          {portraitState === 'rendering' || portraitState === 'slow' ? (
            <div className="portrait-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <div className="portrait-skeleton" key={i} />)}
            </div>
          ) : portraitCandidates && portraitCandidates.length > 1 ? (
            <>
              <div className="field-label">Pick your favorite — tap to use, &darr; to save</div>
              <div className="portrait-grid" role="radiogroup" aria-label="Generated portrait options">
                {portraitCandidates.map((src, i) => (
                  <div className={identity?.avatar === src ? 'portrait-cell is-active' : 'portrait-cell'} key={i}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={identity?.avatar === src}
                      className="portrait-option"
                      onClick={() => onSelectPortrait(src)}
                      aria-label={`Use portrait option ${i + 1}`}
                    >
                      <img src={src} alt={`Portrait option ${i + 1}`} />
                    </button>
                    <button
                      type="button"
                      className="portrait-save"
                      title="Save this image"
                      aria-label={`Save portrait option ${i + 1}`}
                      onClick={() => downloadDataUrl(`zealwish-${(name || identity?.name || 'character').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}.jpg`, src)}
                    >&darr;</button>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

// --- Talk: voice-first conversation ---

function TalkView({ identity, vault, chatInput, setChatInput, chatMessages, onSend, chatStatus, chatPhase, apiStatus, voiceEnabled, onToggleVoice, handsFree, onToggleHandsFree, onVoiceTranscript, recalledNow, activeScene, onLeaveScene }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const transcriptHandlerRef = useRef(onVoiceTranscript);
  const logRef = useRef(null);
  const chatInputRef = useRef(null);
  const activity = useVoiceActivity();
  const previousActivityRef = useRef('idle');

  useEffect(() => {
    transcriptHandlerRef.current = onVoiceTranscript;
  }, [onVoiceTranscript]);

  useEffect(() => () => {
    try { recognitionRef.current?.abort?.(); } catch {}
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [chatMessages]);

  const [interimText, setInterimText] = useState('');

  const startListening = useCallback(() => {
    if (!SR || recognitionRef.current) return false;
    let recognition;
    try { recognition = new SR(); } catch { return false; }
    recognition.lang = 'en-US';
    // Live captions while the user speaks; only final results are sent.
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      try {
        let interim = '';
        let finalText = '';
        for (const result of Array.from(event.results || [])) {
          const piece = result?.[0]?.transcript || '';
          if (result.isFinal) finalText += piece;
          else interim += piece;
        }
        if (finalText.trim()) {
          setInterimText('');
          transcriptHandlerRef.current?.(finalText.trim());
        } else {
          setInterimText(interim.trim());
        }
      } catch {}
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setInterimText('');
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setInterimText('');
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      return true;
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setInterimText('');
      return false;
    }
  }, []);

  const handleMicClick = useCallback(() => {
    if (!SR) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      return;
    }
    stopVoicePlayback();
    startListening();
  }, [startListening]);

  // Keyboard shortcuts: "/" focuses the chat input, Escape stops voice
  // playback and closes the mic.
  useEffect(() => {
    const onKey = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (event.key === '/' && !typing) {
        event.preventDefault();
        chatInputRef.current?.focus();
      } else if (event.key === 'Escape') {
        stopVoicePlayback();
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Hands-free loop: when the character finishes speaking, re-open the mic so
  // the conversation keeps flowing without another tap.
  useEffect(() => {
    const wasSpeaking = previousActivityRef.current === 'speaking';
    previousActivityRef.current = activity;
    if (!handsFree || !voiceEnabled || !SR) return undefined;
    if (wasSpeaking && activity === 'idle' && chatPhase === 'idle' && !recognitionRef.current && document.visibilityState === 'visible') {
      const timer = setTimeout(() => { startListening(); }, 350);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activity, handsFree, voiceEnabled, chatPhase, startListening]);

  const stateLabel = isListening
    ? (interimText ? `"${interimText}"` : 'Listening... speak now')
    : chatPhase === 'thinking'
      ? 'Thinking...'
      : activity === 'speaking'
        ? 'Speaking...'
        : chatStatus;

  // Cursor-style staged progress: turn dead air into a legible pipeline so the
  // user always sees what the companion is doing, never a blank wait.
  const STAGES = ['Listen', 'Recall', 'Think', 'Speak'];
  let activeStage = -1;
  if (isListening) activeStage = 0;
  else if (chatPhase === 'thinking') activeStage = recalledNow?.length ? 1 : 2;
  else if (chatPhase === 'streaming') activeStage = 2;
  else if (activity === 'speaking') activeStage = 3;
  const stageActive = activeStage >= 0;

  return (
    <>
      <div className="talk-stage">
        <div className="talk-presence-col">
          <PresenceAvatar identity={identity} activity={activity} isListening={isListening} size="hero" />
          <h1 className="talk-name">{identity?.name}</h1>
          <p className="talk-bond mono">{relationshipLevel(relationshipScore(vault))} / {vault.relationship.interactions} conversations</p>
          <button
            type="button"
            className={isListening ? 'talk-mic-hero is-listening' : 'talk-mic-hero'}
            onClick={handleMicClick}
            disabled={!SR}
            title={SR ? (isListening ? 'Stop listening' : 'Hold a conversation by voice') : 'Voice input needs Chrome or Edge'}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <span className="talk-mic-icon" aria-hidden="true">{isListening ? <IconStop /> : <IconMic />}</span>
            <span className="mono">{isListening ? 'Tap to stop' : 'Tap to speak'}</span>
          </button>
          <button
            type="button"
            className="talk-voice-toggle mono"
            onClick={onToggleVoice}
            aria-pressed={voiceEnabled}
            title={voiceEnabled ? 'Voice replies on. Click to mute.' : 'Voice replies off. Click to unmute.'}
          >
            <IconSpeaker muted={!voiceEnabled} />
            <span>{voiceEnabled ? 'Voice on' : 'Voice off'}</span>
          </button>
          {SR ? (
            <button
              type="button"
              className="talk-voice-toggle mono"
              onClick={onToggleHandsFree}
              aria-pressed={handsFree}
              title="When on, the mic re-opens automatically after each reply — a continuous voice conversation."
            >
              <span className={handsFree ? 'handsfree-dot is-on' : 'handsfree-dot'} aria-hidden="true" />
              <span>{handsFree ? 'Hands-free on' : 'Hands-free off'}</span>
            </button>
          ) : null}
          {!SR ? <p className="mono talk-sr-note">Voice input needs Chrome or Edge — typing always works.</p> : null}
        </div>

        <div className="panel edge chat-panel">
          <div className="chat-panel-head">
            <div className="code mono">{apiStatus?.state === 'online' ? 'TALK / LIVE API' : 'TALK / OFFLINE FALLBACK'}</div>
            {activeScene ? (
              <span className="scene-chip">
                <span className="mono">Scene: {activeScene.title}</span>
                <button type="button" className="mono" onClick={onLeaveScene}>Leave</button>
              </span>
            ) : null}
            {recalledNow?.length ? (
              <div className="recall-chips" aria-label="Memories recalled for this reply">
                {recalledNow.slice(0, 2).map((fact) => (
                  <span className="recall-chip mono" key={fact.id} title={fact.text}>recalling: {fact.text.slice(0, 34)}{fact.text.length > 34 ? '...' : ''}</span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="chat-log" ref={logRef}>
            {chatMessages.map((message, index) => (
              <div className={`message ${message.role}${message.streaming ? ' is-streaming' : ''}`} key={`${message.role}-${index}`}>
                <b>
                  {message.role === 'user' ? 'You' : identity?.name}
                  {message.at ? <time className="msg-time mono" dateTime={message.at}>{timeAgo(message.at)}</time> : null}
                </b>
                <span>{message.text}{message.streaming ? <i className="stream-caret" aria-hidden="true" /> : null}</span>
                {message.source === 'fallback' ? <small className="mono message-tag">offline echo</small> : null}
              </div>
            ))}
          </div>
          {chatMessages.filter((message) => message.role === 'user').length === 0 ? (
            <div className="starter-chips" aria-label="Conversation starters">
              {STARTER_PROMPTS.map((starter) => (
                <button key={starter} type="button" className="starter-chip mono" onClick={() => onSend(starter)} disabled={chatPhase !== 'idle'}>
                  {starter}
                </button>
              ))}
            </div>
          ) : null}
          <div className="chat-input">
            <input
              ref={chatInputRef}
              className="field"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                // IME guard: Enter while composing (e.g. picking pinyin candidates) must not send.
                if (event.key === 'Enter' && !(event.nativeEvent?.isComposing || event.isComposing)) onSend();
              }}
              placeholder={`Say something to ${identity?.name || 'your companion'}...`}
            />
            <button className="button-primary edge" onClick={() => onSend()} disabled={chatPhase !== 'idle'}>
              {chatPhase === 'idle' ? 'Send' : 'Sending'}
            </button>
          </div>
          {stageActive ? (
            <div className="stage-rail" aria-hidden="true">
              {STAGES.map((stage, i) => (
                <span
                  key={stage}
                  className={`stage-pill${i === activeStage ? ' is-active' : ''}${i < activeStage ? ' is-done' : ''}`}
                >
                  {stage}
                </span>
              ))}
            </div>
          ) : null}
          <div className="action-status mono" role="status" aria-live="polite">
            {isListening ? <span className="talk-listening"><span className="talk-listening-dot" aria-hidden="true"></span>{stateLabel}</span> : stateLabel}
          </div>
        </div>
      </div>
    </>
  );
}

// --- Memory vault (read-only showcase + manual add) ---

function MemoryView({ vault, memoryDraft, setMemoryDraft, onAddMemory, onForgetFact }) {
  const [memoryStatus, setMemoryStatus] = useState('');
  const score = relationshipScore(vault);
  const now = Date.now();

  const handleAddClick = useCallback(() => {
    const added = onAddMemory();
    setMemoryStatus(added ? 'Memory added to vault.' : 'Add a memory before saving.');
  }, [onAddMemory]);

  return (
    <>
      <PageTitle eyebrow="Memory" title="Memory Vault">
        Everything your companion knows, visible and yours: durable facts, episodic moments, and the relationship arc they add up to.
      </PageTitle>

      <div className="vault-grid">
        <section className="panel edge glass-panel">
          <div className="code mono">FACTS / DURABLE</div>
          <h2>What {`they`} remember</h2>
          <div className="memory-stack">
            {vault.facts.length ? vault.facts.map((fact) => {
              const recalled = fact.recalledAt && (now - new Date(fact.recalledAt).getTime()) < 90000;
              return (
                <div className={recalled ? 'memory-item recall-flash' : 'memory-item'} key={fact.id}>
                  <span>{fact.text}</span>
                  <small className="mono">
                    {fact.source === 'chat' ? 'learned in conversation' : fact.source === 'user' ? 'added by you' : 'starter signal'} / {timeAgo(fact.at)}
                    {recalled ? <b className="recall-tag"> RECALLED JUST NOW</b> : null}
                    {' / '}
                    <button type="button" className="forget-link" onClick={() => onForgetFact(fact.id)} title="Forget this memory" aria-label={`Forget: ${fact.text.slice(0, 40)}`}>forget</button>
                  </small>
                </div>
              );
            }) : <div className="memory-item">No durable facts yet. Tell your companion something about yourself.</div>}
          </div>
        </section>

        <div className="vault-side">
          <section className="panel edge glass-panel">
            <div className="code mono">RELATIONSHIP / GROWTH</div>
            <h2>{relationshipLevel(score)}</h2>
            <div className="bond-meter" role="img" aria-label={`Relationship score ${score} of 100`}>
              <i style={{ width: `${score}%` }} />
            </div>
            <div className="bond-rows mono">
              <span>{score}/100 bond</span>
              <span>{vault.relationship.interactions} conversations</span>
              <span>last seen {timeAgo(vault.relationship.lastSeen)}</span>
            </div>
          </section>

          <section className="panel edge">
            <div className="code mono">MEMORY / INPUT</div>
            <h2>Add memory</h2>
            <textarea className="field" value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} placeholder="Add a durable memory..." />
            <div style={{ marginTop: 14 }}><button className="button-primary edge" onClick={handleAddClick}>Add Memory</button></div>
            <div className="action-status mono" role="status" aria-live="polite">{memoryStatus}</div>
          </section>
        </div>
      </div>

      <section className="panel edge episodic-panel">
        <div className="code mono">EPISODIC / TIMELINE</div>
        <h2>Moments</h2>
        <div className="episode-stack">
          {vault.episodes.length ? vault.episodes.slice(0, 12).map((episode) => (
            <div className="episode-row" key={episode.id}>
              <span className="mono episode-time">{timeAgo(episode.at)}</span>
              <div>
                <b>You: {episode.user}</b>
                <p>{episode.reply}</p>
              </div>
              <span className="mono episode-mode">{episode.mode}</span>
            </div>
          )) : <p className="mono">The first conversation writes the first moment here.</p>}
        </div>
      </section>
    </>
  );
}

// --- World: live routes (skins restyle, scenes wrap Talk, tasks brief the character) ---

const WORLD_SCENES = [
  { id: 'rooftop', title: 'Midnight rooftop', detail: 'City lights below, long talks above.', prompt: 'The two of you are on a quiet midnight rooftop above a glowing city. Let the setting color your replies.' },
  { id: 'arcade', title: 'Neon arcade', detail: 'High scores, louder opinions.', prompt: 'The two of you are inside a buzzing neon arcade between rounds of a game. Keep the energy playful.' },
  { id: 'cafe', title: 'Rainy-day cafe', detail: 'Slow rain, warm cups, honest talk.', prompt: 'The two of you share a corner table in a rainy-day cafe. Keep replies warm and unhurried.' }
];

const AGENT_TASKS = [
  { id: 'plan', title: 'Plan my day', detail: 'Turn scattered priorities into three steps.', prompt: 'Help me plan my day. Ask for my single top priority, then lay out a simple three-step plan around it.' },
  { id: 'brainstorm', title: 'Brainstorm with me', detail: 'Three sharp ideas, fast.', prompt: 'Run a quick brainstorm with me. Ask what I am working on, then offer three sharp, distinct ideas.' },
  { id: 'checkin', title: 'Daily check-in', detail: 'Reflect a memory back, set the tone.', prompt: 'Do a short daily check-in with me. Ask how I am feeling and reflect one thing you remember about me back to me.' }
];

const CREATOR_SKINS = [
  { id: 'street', title: 'Street signal', detail: 'Varsity red, city-night backdrop.', style: 'streetwear look with a red varsity jacket against a neon city night backdrop' },
  { id: 'noir', title: 'Noir agent', detail: 'Sharp suit, dramatic shadow.', style: 'film-noir look with a sharp dark suit, dramatic shadows, monochrome palette with one red accent' },
  { id: 'voyager', title: 'Star voyager', detail: 'Retro-future flight gear.', style: 'retro-futuristic flight jacket with a subtle starfield backdrop' }
];

function WorldView({ activeScene, signedPassport, portraitState, onApplySkin, onEnterScene, onRunTask, onOpenOwnership }) {
  const [worldStatus, setWorldStatus] = useState('Every route below is live: skins restyle the portrait, scenes and tasks land in Talk.');
  const skinBusy = portraitState === 'rendering' || portraitState === 'slow';

  return (
    <>
      <PageTitle eyebrow="World" title="World Layer">
        One wallet-owned identity, many destinations. Apply a creator skin, step into a scene, hand over a task, or carry the passport across worlds.
      </PageTitle>
      <div className="world-grid">
        <section className="panel edge world-panel">
          <div className="code mono">01 / CREATOR SKINS</div>
          <h2>Restyle the portrait</h2>
          <p>Each skin regenerates the portrait in a new look — same identity, same memory.</p>
          <div className="world-options">
            {CREATOR_SKINS.map((skin) => (
              <button
                className="world-option"
                key={skin.id}
                disabled={skinBusy}
                onClick={() => {
                  onApplySkin(skin);
                  setWorldStatus(`Rendering the ${skin.title} look — open Create to watch it land.`);
                }}
              >
                <b>{skin.title}</b>
                <small>{skin.detail}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel edge world-panel">
          <div className="code mono">02 / PLAYABLE SCENES</div>
          <h2>Step into a scene</h2>
          <p>Scenes wrap the conversation in a place. Memory travels with you.</p>
          <div className="world-options">
            {WORLD_SCENES.map((scene) => (
              <button
                className={activeScene?.id === scene.id ? 'world-option is-active' : 'world-option'}
                key={scene.id}
                onClick={() => onEnterScene(scene)}
              >
                <b>{scene.title}</b>
                <small>{scene.detail}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel edge world-panel">
          <div className="code mono">03 / AGENT TASKS</div>
          <h2>Hand over a task</h2>
          <p>The character takes the brief straight into Talk and works with what it remembers.</p>
          <div className="world-options">
            {AGENT_TASKS.map((task) => (
              <button className="world-option" key={task.id} onClick={() => onRunTask(task)}>
                <b>{task.title}</b>
                <small>{task.detail}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel edge world-panel">
          <div className="code mono">04 / CROSS-WORLD PASSPORT</div>
          <h2>Carry it forward</h2>
          <p>
            {signedPassport?.verified
              ? `Verified and owned by ${shortAddress(signedPassport.owner_address)} — this identity is ready to travel.`
              : 'Claim the passport to make this identity portable across worlds.'}
          </p>
          <div className="settings-actions">
            <button className="button-primary edge" onClick={onOpenOwnership}>
              {signedPassport ? 'Open ownership center' : 'Claim the passport'}
            </button>
          </div>
        </section>
      </div>
      <div className="action-status mono" role="status" aria-live="polite">{worldStatus}</div>
    </>
  );
}

// --- Rewind: real timeline from the vault ---

function RewindView({ vault }) {
  const [timelineStatus, setTimelineStatus] = useState('Milestones and moments, oldest to newest.');

  const entries = useMemo(() => {
    const milestoneEntries = vault.milestones.map((milestone) => ({
      id: milestone.id, at: milestone.at, title: milestone.title, tag: milestone.tag, kind: 'milestone'
    }));
    const episodeEntries = vault.episodes.slice(0, 8).map((episode) => ({
      id: episode.id, at: episode.at, title: `"${episode.user.slice(0, 64)}"`, tag: episode.mode, kind: 'moment'
    }));
    return [...milestoneEntries, ...episodeEntries].sort((a, b) => new Date(a.at) - new Date(b.at));
  }, [vault]);

  const handleExportTimeline = useCallback(() => {
    const text = JSON.stringify({ product: 'ZEALWISH Web Workspace', timeline: entries }, null, 2);
    downloadJson('zealwish-timeline-export.json', text);
    setTimelineStatus('Timeline JSON downloaded.');
  }, [entries]);

  return (
    <>
      <PageTitle eyebrow="Rewind" title="Relationship Timeline">
        Rewind keeps milestones visible so the character feels continuous instead of disposable.
      </PageTitle>
      <div className="timeline">
        {entries.map((entry) => (
          <div className="timeline-row mono" key={entry.id}>
            <time>{new Date(entry.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</time>
            <strong>{entry.title}</strong>
            <span>{entry.tag}</span>
            <span className="timeline-kind">{entry.kind}</span>
          </div>
        ))}
      </div>
      <div className="settings-actions">
        <button className="button-primary edge" onClick={handleExportTimeline}>Export full timeline</button>
      </div>
      <div className="action-status mono" role="status" aria-live="polite">{timelineStatus}</div>
    </>
  );
}

// --- Passport & ownership center ---

function SettingsView({ identity, vault, wallet, apiStatus, signedPassport, onConnectWallet, onRefreshApiStatus, onClaimPassport, claimState, onExport, exportText }) {
  const [copyStatus, setCopyStatus] = useState('');

  const walletRows = [
    ["Status", wallet?.status || "idle"],
    ["Address", wallet?.shortAddress || "Not connected"],
    ["Chain", wallet?.chainId || "Pending"],
    ["Runtime API", apiStatus?.label || "Checking API..."],
    ["API base", apiStatus?.apiBase || getApiBaseLabel()]
  ];

  const handleCopyExport = useCallback(async () => {
    if (!exportText) {
      setCopyStatus('Generate an export before copying.');
      return;
    }
    try {
      await navigator.clipboard.writeText(exportText);
      setCopyStatus('Export JSON copied to clipboard.');
    } catch {
      setCopyStatus('Clipboard is not available in this browser.');
    }
  }, [exportText]);

  const handleExportClick = useCallback(() => {
    onExport();
    setCopyStatus('Export JSON generated.');
  }, [onExport]);

  const handleDownloadExport = useCallback(() => {
    if (!exportText) {
      setCopyStatus('Generate an export before downloading.');
      return;
    }
    downloadJson('zealwish-passport-export.json', exportText);
    setCopyStatus('Export JSON downloaded.');
  }, [exportText]);

  return (
    <section data-zealwish-settings-panel="true">
      <PageTitle eyebrow="Passport" title="Ownership center">
        Connect a wallet, sign the passport, verify the signature, and walk away with a portable record of the whole character.
      </PageTitle>

      <div className="settings-grid">
        <div className="settings-stack">
          <section className="panel edge">
            <div className="code mono">WALLET / CONNECTION</div>
            <h2>Connection status</h2>
            <p>OKX Wallet links this browser passport to a user-controlled ownership handle.</p>
            <div className="status-ledger">
              {walletRows.map(([label, value]) => (
                <div className="status-row mono" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="settings-actions">
              <button className="button-primary edge" onClick={onConnectWallet}>Connect OKX Wallet</button>
              <button className="button-secondary edge" onClick={onRefreshApiStatus}>Refresh API</button>
            </div>
            {wallet?.error && <p className="error">{wallet.error}</p>}
          </section>

          <section className={`panel edge glass-panel passport-card${claimState === 'claiming' ? ' is-minting' : ''}${signedPassport?.verified ? ' is-verified' : ''}`}>
            <div className="code mono">PASSPORT / V1</div>
            <h2>Character passport</h2>
            {signedPassport ? (
              <>
                <p className={signedPassport.verified ? 'verified-badge' : 'mono'}>
                  {signedPassport.verified ? <><i aria-hidden="true" /> Verified · owned by {shortAddress(signedPassport.owner_address)}</> : 'Signed — verification pending'}
                </p>
                <div className="status-ledger">
                  {[
                    ["Passport ID", signedPassport.passport_id],
                    ["Character", signedPassport.character_id],
                    ["Traits hash", `${signedPassport.traits_hash.slice(0, 18)}...`],
                    ["Vault hash", `${signedPassport.memory_vault_hash.slice(0, 18)}...`],
                    ["Issued", new Date(signedPassport.issued_at).toLocaleString('en-US')]
                  ].map(([label, value]) => (
                    <div className="status-row mono" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="settings-actions">
                  <button className="button-secondary edge" onClick={onClaimPassport} disabled={claimState === 'claiming'}>
                    {claimState === 'claiming' ? 'Signing...' : 'Re-claim (re-sign latest state)'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Claiming signs a hash of the character traits and memory vault with your wallet — no chain transaction, no gas, fully local.</p>
                <div className="settings-actions">
                  <button className="button-primary edge" onClick={onClaimPassport} disabled={claimState === 'claiming'}>
                    {claimState === 'claiming' ? 'Signing...' : wallet?.shortAddress ? 'Claim passport' : 'Connect wallet to claim'}
                  </button>
                </div>
              </>
            )}
            {claimState && claimState !== 'claiming' && claimState !== 'idle' ? (
              <div className="action-status mono" role="status" aria-live="polite">{claimState}</div>
            ) : null}
          </section>
        </div>

        <section className="panel edge settings-export">
          <div className="code mono">EXPORT / PORTABLE RECORD</div>
          <h2>Export ownership record</h2>
          <p>One JSON file: identity, signed passport, memory vault, and the message + signature anyone can verify.</p>
          <div className="settings-actions">
            <button className="button-primary edge" onClick={handleExportClick}>Export Passport</button>
            <button className="button-secondary edge" onClick={handleCopyExport} disabled={!exportText}>Copy export JSON</button>
            <button className="button-secondary edge" onClick={handleDownloadExport} disabled={!exportText}>Download export JSON</button>
          </div>
          <div className="copy-status mono">{copyStatus}</div>
          <pre className="export-box">{exportText || 'No export generated yet.'}</pre>
        </section>
      </div>
    </section>
  );
}

// --- App ---

function App() {
  const [activeModule, setActiveModuleState] = useState(routeFromHash);
  const [wallet, setWallet] = useState(() => window.ZEALWISH_WALLET?.getState?.() || { status: 'idle', shortAddress: '', error: '' });
  const [apiStatus, setApiStatus] = useState(() => ({
    state: 'checking',
    label: 'Checking API...',
    apiBase: getApiBaseLabel()
  }));
  const [identity, setIdentity] = useState(loadIdentity);
  const [vault, setVault] = useState(loadVault);
  const [signedPassport, setSignedPassport] = useState(loadSignedPassport);
  const [activeScene, setActiveScene] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SCENE_KEY) || 'null'); } catch { return null; }
  });
  const [claimState, setClaimState] = useState('idle');
  const [portraitState, setPortraitState] = useState('idle');
  const [portraitCandidates, setPortraitCandidates] = useState([]);
  const [memoryDraft, setMemoryDraft] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(() => loadChatLog(loadIdentity().name));
  const [chatStatus, setChatStatus] = useState('');
  const [chatPhase, setChatPhase] = useState('idle');
  const [recalledNow, setRecalledNow] = useState([]);
  const [exportText, setExportText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(readVoicePreference);
  const [handsFree, setHandsFree] = useState(() => {
    try { return localStorage.getItem(HANDSFREE_KEY) === 'on'; } catch { return false; }
  });

  const vaultRef = useRef(vault);
  useEffect(() => { vaultRef.current = vault; }, [vault]);
  const identityRef = useRef(identity);
  useEffect(() => { identityRef.current = identity; }, [identity]);
  const sceneRef = useRef(activeScene);
  useEffect(() => { sceneRef.current = activeScene; }, [activeScene]);
  const recallClearTimerRef = useRef(null);

  useEffect(() => window.ZEALWISH_WALLET?.onChange?.(setWallet), []);
  useEffect(() => {
    const onHash = () => setActiveModuleState(routeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // The conversation survives reloads — only settled messages are persisted.
  useEffect(() => { persistChatLog(chatMessages); }, [chatMessages]);

  // One-time migration: portraits generated before avatar compression shipped
  // can be >1MB of data URL — recompress them in place to protect the quota.
  useEffect(() => {
    const avatar = identityRef.current?.avatar || '';
    if (!avatar.startsWith('data:') || avatar.length < 400000) return;
    let cancelled = false;
    compressDataUrl(avatar, 512).then((compact) => {
      if (cancelled || !compact || compact.length >= avatar.length) return;
      const next = { ...identityRef.current, avatar: compact };
      try { localStorage.setItem(PASSPORT_KEY, JSON.stringify(next)); } catch {}
      identityRef.current = next;
      setIdentity(next);
    });
    return () => { cancelled = true; };
  }, []);

  const setActiveModule = useCallback((moduleId) => {
    window.location.hash = WEB_APP_ROUTES[moduleId] || '#/home';
    setActiveModuleState(moduleId);
  }, []);

  const updateVault = useCallback((mutator) => {
    setVault((previous) => {
      const draft = JSON.parse(JSON.stringify(previous));
      mutator(draft);
      persistVault(draft);
      vaultRef.current = draft;
      return draft;
    });
  }, []);

  const refreshApiStatus = useCallback(async () => {
    const apiBase = getApiBaseLabel();
    if (!window.ZEALWISH_API?.health) {
      setApiStatus({ state: 'fallback', label: 'API unavailable — browser fallback active.', apiBase });
      return false;
    }
    try {
      await window.ZEALWISH_API.health();
      setApiStatus({ state: 'online', label: 'API connected.', apiBase });
      return true;
    } catch {
      setApiStatus({ state: 'fallback', label: 'API unavailable — browser fallback active.', apiBase });
      return false;
    }
  }, []);

  useEffect(() => {
    refreshApiStatus();
  }, [refreshApiStatus]);

  const handleConnectWallet = useCallback(async () => {
    if (!window.ZEALWISH_WALLET?.connect) {
      setWallet({ status: 'error', error: 'OKX Wallet service is not loaded.', shortAddress: '' });
      return null;
    }
    const next = await window.ZEALWISH_WALLET.connect();
    setWallet(next);
    return next;
  }, []);

  const persistIdentity = useCallback((next) => {
    setIdentity(next);
    identityRef.current = next;
    try { localStorage.setItem(PASSPORT_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const handleSaveIdentity = useCallback(async ({ name, prompt, gender, artStyle, lookSeeds, backdrop, customColor }) => {
    let resolvedGender = gender;
    if (gender === 'auto') {
      resolvedGender = 'female';
      try {
        const base = window.ZEALWISH_API?.resolveApiBase?.();
        if (base) {
          const response = await fetch(`${base}/detect-gender`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: `${name}. ${prompt}` })
          });
          if (response.ok) {
            const data = await response.json().catch(() => null);
            if (data?.gender === 'male' || data?.gender === 'female') resolvedGender = data.gender;
          }
        }
      } catch {}
    }
    const next = {
      ...identityRef.current,
      name: String(name || '').trim() || 'Echo',
      prompt: String(prompt || '').trim() || defaultIdentity().prompt,
      gender: resolvedGender,
      artStyle: ART_STYLES.some((entry) => entry.id === artStyle) ? artStyle : (identityRef.current.artStyle || 'pixel'),
      lookSeeds: Array.isArray(lookSeeds) ? lookSeeds.slice(0, 6) : (identityRef.current.lookSeeds || []),
      backdrop: backdrop || identityRef.current.backdrop || 'auto',
      customColor: customColor || identityRef.current.customColor || '#10B981',
      wallet: wallet?.address || 'not connected',
      chainId: wallet?.chainId || 'pending',
      updatedAt: new Date().toISOString()
    };
    persistIdentity(next);
    updateVault((draft) => {
      draft.milestones.unshift({ id: `m-${randomHex(4)}`, at: new Date().toISOString(), title: `Passport identity updated: ${next.name}`, tag: 'identity' });
      draft.milestones = draft.milestones.slice(0, 20);
    });
    return next;
  }, [wallet, persistIdentity, updateVault]);

  const applyAvatar = useCallback((dataUrl) => {
    const next = { ...identityRef.current, avatar: dataUrl, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(PASSPORT_KEY, JSON.stringify(next)); } catch {}
    setIdentity(next);
    identityRef.current = next;
  }, []);

  const handleSelectPortrait = useCallback((dataUrl) => {
    if (dataUrl) applyAvatar(dataUrl);
  }, [applyAvatar]);

  const portraitTimerRef = useRef(null);
  const handleGeneratePortrait = useCallback(async ({ name, prompt, artStyle, lookSeeds, skinStyle, backdrop, customColor }) => {
    setPortraitState('rendering');
    setPortraitCandidates([]);
    clearTimeout(portraitTimerRef.current);
    // Never block the user beyond 3 seconds: flip to the bundled look and keep rendering behind the scenes.
    portraitTimerRef.current = setTimeout(() => {
      setPortraitState((current) => (current === 'rendering' ? 'slow' : current));
    }, 3000);
    try {
      const base = window.ZEALWISH_API?.resolveApiBase?.();
      if (!base) throw new Error('API unavailable');
      const response = await fetch(`${base}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: buildPortraitPrompt({ name, prompt, artStyle, lookSeeds, skinStyle, backdrop, customColor }),
          aspectRatio: '1:1',
          count: 4
        })
      });
      if (!response.ok) throw new Error('Image generation failed');
      const data = await response.json().catch(() => null);
      const urls = Array.isArray(data?.dataUrls) && data.dataUrls.length ? data.dataUrls : (data?.dataUrl ? [data.dataUrl] : []);
      if (!urls.length) throw new Error('No image returned');
      // Compress every option before it touches state / localStorage — a raw
      // 1024px PNG data URL can eat most of the quota on its own.
      const compact = await Promise.all(urls.map((url) => compressDataUrl(url, 512)));
      setPortraitCandidates(compact);
      applyAvatar(compact[0]); // first option live immediately; user can re-pick
      setPortraitState('done');
    } catch {
      setPortraitState('failed');
    } finally {
      clearTimeout(portraitTimerRef.current);
    }
  }, [applyAvatar]);

  const handleAddMemory = useCallback((value = memoryDraft) => {
    const clean = String(value || '').trim();
    if (!clean) return false;
    updateVault((draft) => {
      draft.facts.unshift({ id: `f-${randomHex(4)}`, text: clean, source: 'user', at: new Date().toISOString() });
      draft.facts = draft.facts.slice(0, 24);
    });
    setMemoryDraft('');
    return true;
  }, [memoryDraft, updateVault]);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((previous) => {
      const next = !previous;
      persistVoicePreference(next);
      if (!next) stopVoicePlayback();
      return next;
    });
  }, []);

  const handleToggleHandsFree = useCallback(() => {
    setHandsFree((previous) => {
      const next = !previous;
      try { localStorage.setItem(HANDSFREE_KEY, next ? 'on' : 'off'); } catch {}
      // Hands-free only makes sense with spoken replies — switch voice on with it.
      if (next) {
        setVoiceEnabled(true);
        persistVoicePreference(true);
      }
      return next;
    });
  }, []);

  const handleForgetFact = useCallback((factId) => {
    updateVault((draft) => {
      draft.facts = draft.facts.filter((fact) => fact.id !== factId);
    });
  }, [updateVault]);

  const handleSendWebChat = useCallback(async (overrideText, mode = 'text') => {
    const clean = (typeof overrideText === 'string' ? overrideText : chatInput).trim();
    if (!clean || chatPhase !== 'idle') return;

    const currentVault = vaultRef.current;
    const currentIdentity = identityRef.current;
    const gender = resolveVoiceGender(currentIdentity);
    const speakReplies = voiceEnabled;

    const userMessage = { role: 'user', text: clean, at: new Date().toISOString() };
    const history = [...chatMessages.filter((message) => !message.streaming), userMessage];
    setChatMessages([...history, { role: 'character', text: '', streaming: true }]);
    setChatInput('');
    setChatPhase('thinking');
    setChatStatus('');

    // Recall: matched facts drive the honest UI ("recalling X" + vault flash);
    // forPrompt may pad with recent context for the model only.
    const { forPrompt: recalledForPrompt, matched: recalledMatched } = selectRecalledFacts(currentVault, clean);
    setRecalledNow(recalledMatched);
    if (recalledMatched.length) {
      const recalledIds = new Set(recalledMatched.map((fact) => fact.id));
      updateVault((draft) => {
        const stamp = new Date().toISOString();
        draft.facts.forEach((fact) => { if (recalledIds.has(fact.id)) fact.recalledAt = stamp; });
      });
    }

    const system = buildChatSystemPrompt(currentIdentity, currentVault, recalledForPrompt, sceneRef.current);

    let spokenPrefix = '';
    const maybeSpeakFirstSentence = (full) => {
      if (!speakReplies || spokenPrefix) return;
      const sentence = firstSentence(full);
      if (sentence) {
        spokenPrefix = sentence;
        queueSpeech(sentence, gender);
      }
    };

    const updateLiveMessage = (full) => {
      setChatPhase('streaming');
      setChatMessages([...history, { role: 'character', text: full, streaming: true }]);
    };

    let finalText = '';
    let source = 'llm';
    try {
      const result = await streamChat({
        system,
        messages: toApiMessages(history),
        onDelta: (_delta, full) => {
          updateLiveMessage(full);
          maybeSpeakFirstSentence(full);
        }
      });
      finalText = result.text;
      source = result.source || 'llm';
      let warning = result.warning || '';
      if (source === 'fallback' && /upstream|interrupted/i.test(warning)) {
        // Upstream hiccups are usually transient — one quiet non-stream retry
        // before settling for the deterministic echo.
        try {
          const retry = await window.ZEALWISH_API?.chat?.({ system, messages: toApiMessages(history) });
          if (retry?.text && retry.source === 'llm') {
            if (speakReplies) {
              stopVoicePlayback();
              spokenPrefix = '';
            }
            finalText = retry.text;
            source = 'llm';
            warning = '';
            updateLiveMessage(finalText);
          }
        } catch {}
      }
      setApiStatus({ state: source === 'llm' ? 'online' : 'fallback', label: source === 'llm' ? 'API connected.' : 'Deterministic fallback active.', apiBase: getApiBaseLabel() });
      setChatStatus(source === 'llm'
        ? 'Reply received.'
        : warning.toLowerCase().includes('not configured')
          ? 'Offline echo — configure the API key for live replies.'
          : 'Offline echo — live reply unavailable, try again.');
    } catch {
      // Total API failure: deterministic local fallback, clearly labeled.
      finalText = getFallbackReply(clean, history.length);
      source = 'fallback';
      setChatStatus('API unavailable — offline echo active.');
      refreshApiStatus();
    }

    setChatMessages([...history, { role: 'character', text: finalText, source, at: new Date().toISOString() }]);
    setChatPhase('idle');
    // The "recalling…" chips belong to this exchange — retire them shortly after
    // the reply settles instead of letting them linger over the next message.
    if (recalledMatched.length) {
      clearTimeout(recallClearTimerRef.current);
      recallClearTimerRef.current = setTimeout(() => setRecalledNow([]), 9000);
    }

    if (speakReplies) {
      const remainder = spokenPrefix && finalText.startsWith(spokenPrefix)
        ? finalText.slice(spokenPrefix.length).trim()
        : (spokenPrefix ? '' : finalText);
      if (remainder) queueSpeech(remainder, gender);
    }

    // Memory writes: an episode for the exchange, a fact if the user shared something durable.
    updateVault((draft) => {
      const stamp = new Date().toISOString();
      draft.episodes.unshift({ id: `e-${randomHex(4)}`, at: stamp, user: clean.slice(0, 160), reply: finalText.slice(0, 200), mode });
      draft.episodes = draft.episodes.slice(0, 60);
      const factCandidate = extractFactCandidate(clean);
      if (factCandidate && !draft.facts.some((fact) => fact.text.toLowerCase() === factCandidate.toLowerCase())) {
        draft.facts.unshift({ id: `f-${randomHex(4)}`, text: factCandidate, source: 'chat', at: stamp });
        draft.facts = draft.facts.slice(0, 24);
      }
      draft.relationship.interactions += 1;
      draft.relationship.lastSeen = stamp;
    });
  }, [chatInput, chatMessages, chatPhase, voiceEnabled, updateVault, refreshApiStatus]);

  const handleVoiceTranscript = useCallback((transcript) => {
    const clean = String(transcript || '').trim();
    if (!clean) return;
    setChatInput('');
    handleSendWebChat(clean, 'voice');
  }, [handleSendWebChat]);

  const handleEnterScene = useCallback((scene) => {
    setActiveScene(scene);
    sceneRef.current = scene;
    try { localStorage.setItem(SCENE_KEY, JSON.stringify(scene)); } catch {}
    updateVault((draft) => {
      draft.milestones.unshift({ id: `m-${randomHex(4)}`, at: new Date().toISOString(), title: `Entered scene: ${scene.title}`, tag: 'world' });
      draft.milestones = draft.milestones.slice(0, 20);
    });
    setChatStatus(`Scene set: ${scene.title}. Say something to play it out.`);
    setActiveModule('talk');
  }, [updateVault, setActiveModule]);

  const handleLeaveScene = useCallback(() => {
    setActiveScene(null);
    sceneRef.current = null;
    try { localStorage.setItem(SCENE_KEY, 'null'); } catch {}
    setChatStatus('Scene cleared.');
  }, []);

  const handleRunTask = useCallback((task) => {
    setActiveModule('talk');
    handleSendWebChat(task.prompt, 'task');
  }, [setActiveModule, handleSendWebChat]);

  const handleApplySkin = useCallback((skin) => {
    updateVault((draft) => {
      draft.milestones.unshift({ id: `m-${randomHex(4)}`, at: new Date().toISOString(), title: `Applied skin: ${skin.title}`, tag: 'world' });
      draft.milestones = draft.milestones.slice(0, 20);
    });
    handleGeneratePortrait({
      name: identityRef.current.name,
      prompt: identityRef.current.prompt,
      artStyle: identityRef.current.artStyle || 'pixel',
      lookSeeds: identityRef.current.lookSeeds || [],
      backdrop: identityRef.current.backdrop || 'auto',
      customColor: identityRef.current.customColor || '#10B981',
      skinStyle: skin.style
    });
  }, [updateVault, handleGeneratePortrait]);

  const handleClaimPassport = useCallback(async () => {
    setClaimState('claiming');
    try {
      let currentWallet = wallet;
      if (!currentWallet?.address) {
        currentWallet = await handleConnectWallet();
        if (!currentWallet?.address) {
          setClaimState('Connect a wallet first — claiming signs with your address.');
          return;
        }
      }
      if (!window.ZEALWISH_WALLET?.signMessage) {
        setClaimState('Wallet signing is unavailable in this browser.');
        return;
      }
      const passport = await buildPassportV1(identityRef.current, vaultRef.current, currentWallet.address);
      const message = passportMessage(passport);
      const signature = await window.ZEALWISH_WALLET.signMessage(message);
      let verified = false;
      try {
        verified = verifyMessage(message, signature).toLowerCase() === currentWallet.address.toLowerCase();
      } catch {}
      const signed = { ...passport, message, signature, verified };
      setSignedPassport(signed);
      try { localStorage.setItem(SIGNED_PASSPORT_KEY, JSON.stringify(signed)); } catch {}
      updateVault((draft) => {
        draft.milestones.unshift({ id: `m-${randomHex(4)}`, at: new Date().toISOString(), title: verified ? 'Passport claimed and verified' : 'Passport signed', tag: 'wallet' });
        draft.milestones = draft.milestones.slice(0, 20);
      });
      setClaimState(verified ? 'Passport verified — signature matches your wallet.' : 'Signed, but signature verification failed.');
    } catch (error) {
      setClaimState(error?.message?.includes('reject') || error?.code === 4001 ? 'Signature request was rejected.' : 'Claiming failed — try again.');
    }
  }, [wallet, handleConnectWallet, updateVault]);

  const handleExportPassport = useCallback(() => {
    const payload = {
      schema: 'zealwish.export/v1',
      product: 'ZEALWISH Web Workspace',
      exported_at: new Date().toISOString(),
      identity: { ...identityRef.current, avatar: isBundledAvatar(identityRef.current.avatar) ? 'bundled' : 'generated' },
      passport: signedPassport || null,
      vault: vaultRef.current
    };
    const text = JSON.stringify(payload, null, 2);
    setExportText(text);
    return text;
  }, [signedPassport]);

  const view = useMemo(() => {
    if (activeModule === 'create') return <CreateView identity={identity} wallet={wallet} onSaveIdentity={handleSaveIdentity} onGeneratePortrait={handleGeneratePortrait} portraitState={portraitState} portraitCandidates={portraitCandidates} onSelectPortrait={handleSelectPortrait} />;
    if (activeModule === 'talk') return <TalkView identity={identity} vault={vault} chatInput={chatInput} setChatInput={setChatInput} chatMessages={chatMessages} onSend={handleSendWebChat} chatStatus={chatStatus} chatPhase={chatPhase} apiStatus={apiStatus} voiceEnabled={voiceEnabled} onToggleVoice={handleToggleVoice} handsFree={handsFree} onToggleHandsFree={handleToggleHandsFree} onVoiceTranscript={handleVoiceTranscript} recalledNow={recalledNow} activeScene={activeScene} onLeaveScene={handleLeaveScene} />;
    if (activeModule === 'memory') return <MemoryView vault={vault} memoryDraft={memoryDraft} setMemoryDraft={setMemoryDraft} onAddMemory={handleAddMemory} onForgetFact={handleForgetFact} />;
    if (activeModule === 'world') return <WorldView activeScene={activeScene} signedPassport={signedPassport} portraitState={portraitState} onApplySkin={handleApplySkin} onEnterScene={handleEnterScene} onRunTask={handleRunTask} onOpenOwnership={() => setActiveModule('settings')} />;
    if (activeModule === 'rewind') return <RewindView vault={vault} />;
    if (activeModule === 'settings') return <SettingsView identity={identity} vault={vault} wallet={wallet} apiStatus={apiStatus} signedPassport={signedPassport} onConnectWallet={handleConnectWallet} onRefreshApiStatus={refreshApiStatus} onClaimPassport={handleClaimPassport} claimState={claimState} onExport={handleExportPassport} exportText={exportText} />;
    return <HomeView identity={identity} vault={vault} wallet={wallet} signedPassport={signedPassport} voiceEnabled={voiceEnabled} onToggleVoice={handleToggleVoice} setActiveModule={setActiveModule} />;
  }, [activeModule, identity, vault, wallet, chatInput, chatMessages, chatStatus, chatPhase, apiStatus, memoryDraft, exportText, voiceEnabled, handsFree, signedPassport, claimState, portraitState, portraitCandidates, recalledNow, activeScene, handleToggleVoice, handleToggleHandsFree, handleVoiceTranscript, handleSaveIdentity, handleGeneratePortrait, handleSelectPortrait, handleSendWebChat, handleAddMemory, handleForgetFact, handleConnectWallet, refreshApiStatus, handleClaimPassport, handleExportPassport, handleEnterScene, handleLeaveScene, handleRunTask, handleApplySkin, setActiveModule]);

  return <Shell activeModule={activeModule} setActiveModule={setActiveModule} wallet={wallet} identity={identity} vault={vault} apiStatus={apiStatus} signedPassport={signedPassport} onConnectWallet={handleConnectWallet}>{view}</Shell>;
}

// A single render throw would otherwise wipe the boot skeleton to a blank
// screen — catch it and offer a styled recovery instead of a dead page.
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    try { console.error('[ZEALWISH] render error', error); } catch {}
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="app-crash">
          <b>ZEALWISH</b>
          <p className="mono">Something glitched on screen.</p>
          <p className="app-crash-note">Your character, memories, and passport are safe in this browser.</p>
          <div className="app-crash-actions">
            <button className="button-primary edge" onClick={() => window.location.reload()}>Reload workspace</button>
            <a className="button-secondary edge" href="index.html#top">Back to landing</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary><App /></AppErrorBoundary>
);
