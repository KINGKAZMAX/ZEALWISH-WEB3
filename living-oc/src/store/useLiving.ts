import { create } from 'zustand';
import type { Archetype, DayResult, MemoryEvent, WorldState, Providers, Post } from '../sim/types';
import type { WorldSnap } from '../live/net';
import { createOc, sedimentGuidance, type OC } from '../oc/oc';
import { runDay, step, flushInputs } from '../sim/step';
import { createPrivateWorld } from '../sim/world';
import { ARCHE_TRAITS } from '../sim/data';
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
  create(input: { name: string; handle: string; bio: string; arche: Archetype }): void;
  liveADay(): Promise<void>;
  send(text: string): void;
  guide(text: string): void;
  editOc(patch: { name?: string; bio?: string; arche?: Archetype }): void;
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
  // 共享世界(非主机端):按 NPC 名字落地主机广播的状态 + feed + 纪元 + 供给
  applyWorldSnapshot(snap) {
    const w = get().world; if (!w) return;
    w.epoch = snap.e; w.stats.supply = snap.supply;
    const byName: Record<string, string> = {};
    for (const id of w.order) { const a = w.agents[id]; if (a) byName[a.name] = id; }
    for (const n of snap.npc) { const id = byName[n.name]; if (id) { w.agents[id].loc = n.loc; w.agents[id].mood = n.mood; } }
    w.feed = snap.feed.map((p): Post => ({ id: p.id, agentId: byName[p.name] || p.agentId, name: p.name, handle: '@' + p.name, text: p.text, action: p.action as Post['action'], ev: null, epoch: snap.e, likes: 0 }));
    set({ version: get().version + 1 });
  },
  setLiveMode(m) { const lm = { ...get().liveMode, ...m }; worldP = buildProviders(lm); set({ liveMode: lm, version: get().version + 1 }); },
}));
