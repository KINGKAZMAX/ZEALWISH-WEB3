import { create } from 'zustand';
import type { Archetype, DayResult, MemoryEvent, WorldState, Providers, Post } from '../sim/types';
import type { WorldSnap } from '../live/net';
import { createOc, sedimentGuidance, type OC } from '../oc/oc';
import { runDay, step, flushInputs } from '../sim/step';
import { createPrivateWorld } from '../sim/world';
import { ARCHE_TRAITS } from '../sim/data';
import { starterTeam, starterBag, newSpirit } from '../world/spirits';
import { reflectToDiary } from '../sim/systems/memory';
import { ScriptedCognitionProvider } from '../sim/providers/cognition';
import { LiveCognitionProvider, LiveChainProvider } from '../live/liveProviders';
import { openingLine, replyTo } from '../sim/providers/chat';
import { saveOc, loadOc } from '../oc/persist';

const mockChain = { mode: 'mock' as const, async transfer() { return { ok: true }; }, async mintNFT() { return { ok: true }; } };
const media = { mode: 'stub' as const, imageFor: (s: string) => s };
function buildProviders(lm: { cognition: 'scripted' | 'live'; chain: 'mock' | 'live' }): Providers {
  return {
    cognition: lm.cognition === 'live' ? new LiveCognitionProvider() : new ScriptedCognitionProvider(),
    chain: lm.chain === 'live' ? new LiveChainProvider() : mockChain,
    media,
  };
}
function providers(): Providers { return buildProviders({ cognition: 'scripted', chain: 'mock' }); }
let worldP = providers(); // 世界视图用;切真 LLM/链时由 setLiveMode 重建

export function livingActions(seed: string) {
  const p = providers();
  return {
    create(input: { name: string; handle: string; bio: string; arche: Archetype }): OC {
      return createOc({ ...input, seed });
    },
    async liveADay(oc: OC): Promise<DayResult> {
      const day = await runDay(oc, p, seed, oc.profile.daysLived + 1, 8);
      oc.profile.daysLived += 1;
      const insight = reflectToDiary(day.events, oc.profile.daysLived);
      oc.profile.insights.unshift(insight.split('\n')[0]);
      return day;
    },
    openChat(oc: OC, day: DayResult): string {
      return openingLine(oc.name, day.events, oc.memory[0]?.e ?? 1);
    },
    reply(oc: OC, userText: string): string {
      const mem: MemoryEvent[] = oc.memory.map((m, i) => ({
        epoch: m.e, agentId: oc.id, action: 'post', text: m.t, importance: 5 - Math.min(4, i / 10), withId: null,
      }));
      return replyTo(oc.name, userText, mem, oc.memory[0]?.e ?? 1, oc.profile.guidance[0]);
    },
    guide(oc: OC, text: string) {
      sedimentGuidance(oc, text);
    },
  };
}

type View = 'room' | 'world';
export interface LiveMode { cognition: 'scripted' | 'live'; chain: 'mock' | 'live'; }

interface LivingState {
  oc: OC | null;
  day: DayResult | null;
  chatLog: { who: 'you' | 'oc'; text: string }[];
  version: number;
  seed: string;
  view: View;
  world: WorldState | null;
  worldRunning: boolean;
  worldSpeed: number;
  liveMode: LiveMode;
  create(input: { name: string; handle: string; bio: string; arche: Archetype; sprite?: string }): void;
  liveADay(): Promise<void>;
  send(text: string): void;
  guide(text: string): void;
  editOc(patch: { name?: string; bio?: string; arche?: Archetype }): void;
  ensureKit(): void;
  tameSpirit(speciesId: string): boolean;
  useBagItem(itemId: string): void;
  setActiveSpirit(uid: string): void;
  load(): void;
  setView(v: View): void;
  enterWorld(): void;
  tickWorld(): Promise<void>;
  setWorldRunning(b: boolean): void;
  setWorldSpeed(n: number): void;
  addAgentToWorld(name: string): void;
  reseedWorld(): void;
  applyWorldSnapshot(snap: WorldSnap): void;
  setLiveMode(m: Partial<LiveMode>): void;
}

let worldSeq = 1;
let ticking = false; // 单飞守卫:避免定时器在上一 tick 未完成时并发调用 step() 破坏世界状态

export const useLiving = create<LivingState>((set, get) => ({
  oc: null, day: null, chatLog: [], version: 0, seed: 'zealwish',
  view: 'room', world: null, worldRunning: false, worldSpeed: 5,
  liveMode: { cognition: 'scripted', chain: 'mock' },
  create(input) {
    const a = livingActions(get().seed);
    const oc = a.create(input);
    if (input.sprite) oc.sprite = input.sprite;   // 工作台带入的像素小人身体
    // 同名角色再次「进入活世界」= 同一角色重进:保留其灵宠/背包,避免再生覆盖抹掉养成进度
    const prev = get().oc;
    if (prev && prev.name === oc.name) { oc.team = prev.team; oc.bag = prev.bag; oc.active = prev.active; }
    saveOc(oc);
    set({ oc, day: null, chatLog: [], world: null, worldRunning: false, version: get().version + 1 });
  },
  async liveADay() {
    const oc = get().oc; if (!oc) return;
    const a = livingActions(get().seed);
    const day = await a.liveADay(oc);
    saveOc(oc);
    const opener = a.openChat(oc, day);
    set({ day, chatLog: [...get().chatLog, { who: 'oc', text: opener }], version: get().version + 1 });
  },
  send(text) {
    const oc = get().oc; if (!oc) return;
    const a = livingActions(get().seed);
    const reply = a.reply(oc, text);
    set({ chatLog: [...get().chatLog, { who: 'you', text }, { who: 'oc', text: reply }], version: get().version + 1 });
  },
  guide(text) {
    const oc = get().oc; if (!oc) return;
    livingActions(get().seed).guide(oc, text); saveOc(oc);
    set({ chatLog: [...get().chatLog, { who: 'you', text: '【引导】' + text }, { who: 'oc', text: '……我记下了。' }], version: get().version + 1 });
  },
  editOc(patch) {
    const oc = get().oc; if (!oc) return;
    if (patch.name && patch.name.trim()) oc.name = patch.name.trim();
    if (patch.bio !== undefined) oc.bio = patch.bio.trim() || oc.bio;
    if (patch.arche && patch.arche !== oc.arche) { oc.arche = patch.arche; oc.traits = { ...ARCHE_TRAITS[patch.arche] }; }
    saveOc(oc);
    set({ version: get().version + 1 });
  },
  // ── 灵宠 / 背包(玩家本地态,随角色持久化;不入确定性世界,亦不参与联机权威)──
  ensureKit() {
    const oc = get().oc; if (!oc) return;
    if (oc.team && oc.bag) return;
    if (!oc.team) oc.team = starterTeam(oc.id);
    if (!oc.bag) oc.bag = starterBag();
    if (!oc.active && oc.team.length) oc.active = oc.team[0].uid;
    saveOc(oc); set({ version: get().version + 1 });
  },
  tameSpirit(speciesId) {
    const oc = get().oc; if (!oc) return false;
    if (!oc.bag) oc.bag = starterBag();
    if ((oc.bag.stone || 0) <= 0) return false;
    if (!oc.team) oc.team = [];
    oc.bag.stone -= 1;
    const sp = newSpirit(speciesId, speciesId + ':' + oc.team.length + ':' + oc.id);
    oc.team.push(sp);
    if (!oc.active) oc.active = sp.uid;
    saveOc(oc); set({ version: get().version + 1 });
    return true;
  },
  useBagItem(itemId) {
    const oc = get().oc; if (!oc || !oc.bag) return;
    if ((oc.bag[itemId] || 0) <= 0) return;
    if (itemId === 'berry' && oc.team && oc.active) {
      const s = oc.team.find((x) => x.uid === oc.active) || oc.team[0];
      if (s) { s.bond = Math.min(100, s.bond + 8); s.xp += 10; if (s.xp >= 20 + s.level * 10) { s.xp = 0; s.level += 1; } }
    }
    oc.bag[itemId] -= 1;
    saveOc(oc); set({ version: get().version + 1 });
  },
  setActiveSpirit(uid) {
    const oc = get().oc; if (!oc || !oc.team) return;
    if (oc.team.some((x) => x.uid === uid)) { oc.active = uid; saveOc(oc); set({ version: get().version + 1 }); }
  },
  load() {
    const oc = loadOc(); if (oc) set({ oc, version: get().version + 1 });
  },
  setView(v) {
    if (v === 'world' && !get().world) get().enterWorld();
    set({ view: v, version: get().version + 1 });
  },
  enterWorld() {
    const oc = get().oc; if (!oc) return;
    const clone = JSON.parse(JSON.stringify(oc)) as OC; // 副本:观察不污染真 OC
    const world = createPrivateWorld(clone, get().seed + ':world' + worldSeq);
    set({ world, version: get().version + 1 });
  },
  async tickWorld() {
    const w = get().world; if (!w || ticking) return;
    ticking = true;
    try { await step(w, worldP); } finally { ticking = false; }
    set({ version: get().version + 1 });
  },
  setWorldRunning(b) { set({ worldRunning: b, version: get().version + 1 }); },
  setWorldSpeed(n) { set({ worldSpeed: n }); },
  addAgentToWorld(name) {
    const w = get().world; if (!w) return;
    w.inputs.push({ kind: 'addAgent', name });
    flushInputs(w);
    set({ version: get().version + 1 });
  },
  reseedWorld() {
    const oc = get().oc; if (!oc) return;
    worldSeq += 1;
    const clone = JSON.parse(JSON.stringify(oc)) as OC;
    const world = createPrivateWorld(clone, get().seed + ':world' + worldSeq);
    set({ world, worldRunning: false, version: get().version + 1 });
  },
  // 共享世界(非主机端):按 NPC 名字落地主机广播的完整内部态 + feed + 纪元 + 供给。
  // 同步 needs/balance/rngState/rel,使主机迁移后晋升主机能无缝续跑,各端一致。
  applyWorldSnapshot(snap) {
    const w = get().world; if (!w) return;
    w.epoch = snap.e; w.stats.supply = snap.supply;
    const byName: Record<string, string> = {};
    for (const id of w.order) { const a = w.agents[id]; if (a) byName[a.name] = id; }
    for (const n of snap.npc) {
      const id = byName[n.name]; if (!id) continue; const a = w.agents[id];
      a.loc = n.loc; a.mood = n.mood; a.balance = n.balance;
      if (n.needs) a.needs = { ...a.needs, ...n.needs };
      if (typeof n.rng === 'number') a.rngState = n.rng;
      if (n.rel) a.rel = n.rel;
    }
    w.feed = snap.feed.map((p): Post => ({ id: p.id, agentId: byName[p.name] || p.agentId, name: p.name, handle: '@' + p.name, text: p.text, action: p.action as Post['action'], ev: p.ev ? { kind: p.ev as 'mint' | 'transfer' | 'bankrupt' } : null, epoch: snap.e, likes: 0 }));
    set({ version: get().version + 1 });
  },
  setLiveMode(m) { const lm = { ...get().liveMode, ...m }; worldP = buildProviders(lm); set({ liveMode: lm, version: get().version + 1 }); },
}));
