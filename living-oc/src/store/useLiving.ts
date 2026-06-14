import { create } from 'zustand';
import type { Archetype, DayResult, MemoryEvent } from '../sim/types';
import { createOc, sedimentGuidance, type OC } from '../oc/oc';
import { runDay } from '../sim/step';
import { reflectToDiary } from '../sim/systems/memory';
import { ScriptedCognitionProvider } from '../sim/providers/cognition';
import { openingLine, replyTo } from '../sim/providers/chat';
import { saveOc, loadOc } from '../oc/persist';

function providers() {
  return {
    cognition: new ScriptedCognitionProvider(),
    chain: { mode: 'mock' as const, async transfer() { return { ok: true }; }, async mintNFT() { return { ok: true }; } },
    media: { mode: 'stub' as const, imageFor: (s: string) => s },
  };
}

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

interface LivingState {
  oc: OC | null;
  day: DayResult | null;
  chatLog: { who: 'you' | 'oc'; text: string }[];
  version: number;
  seed: string;
  create(input: { name: string; handle: string; bio: string; arche: Archetype }): void;
  liveADay(): Promise<void>;
  send(text: string): void;
  guide(text: string): void;
  load(): void;
}

export const useLiving = create<LivingState>((set, get) => ({
  oc: null, day: null, chatLog: [], version: 0, seed: 'zealwish',
  create(input) {
    const a = livingActions(get().seed);
    const oc = a.create(input);
    saveOc(oc);
    set({ oc, day: null, chatLog: [], version: get().version + 1 });
  },
  async liveADay() {
    const oc = get().oc; if (!oc) return;
    const a = livingActions(get().seed);
    const day = await a.liveADay(oc);
    saveOc(oc);
    const opener = a.openChat(oc, day); // OC 主动开口讲今天
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
  load() {
    const oc = loadOc(); if (oc) set({ oc, version: get().version + 1 });
  },
}));
