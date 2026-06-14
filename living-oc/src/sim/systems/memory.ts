// ── 记忆系统(M0:滚动窗口。M2 升级为生成式智能体记忆流 + 反思,见 README) ──
import type { Agent, MemoryEvent, ActionKind } from '../types';

export function remember(a: Agent, epoch: number, text: string) {
  const t = text.length > 26 ? text.slice(0, 26) + '…' : text;
  a.memory.unshift({ e: epoch, t });
  if (a.memory.length > 14) a.memory.pop();
}

export function bumpRel(a: Agent, b: Agent, d: number) {
  a.rel[b.id] = Math.max(-1, Math.min(1, (a.rel[b.id] || 0) + d));
}

const BASE: Record<ActionKind, number> = {
  bankrupt: 9, transfer: 7, mint: 7, gamble: 6, social: 5,
  work: 4, spend: 3, travel: 3, reflect: 4, post: 2,
};
export function scoreImportance(e: MemoryEvent): number {
  const base = BASE[e.action] ?? 3;
  const social = e.withId ? 1 : 0;
  const len = Math.min(1, e.text.length / 40);
  return Math.max(1, Math.min(10, base + social + len));
}
export function retrieve(mem: MemoryEvent[], now: number, k: number): MemoryEvent[] {
  const span = Math.max(1, now);
  const scored = mem.map((m) => {
    const recency = m.epoch / span;
    const importance = m.importance / 10;
    return { m, s: recency + importance };
  });
  scored.sort((a, b) => b.s - a.s);
  const seen = new Set<string>();
  const out: MemoryEvent[] = [];
  for (const x of scored) {
    if (seen.has(x.m.text)) continue;
    seen.add(x.m.text); out.push(x.m);
    if (out.length >= k) break;
  }
  return out;
}
export function reflectToDiary(events: MemoryEvent[], day: number): string {
  if (events.length === 0) return `第 ${day} 天:今天很安静,什么也没发生。`;
  const top = [...events].sort((a, b) => b.importance - a.importance).slice(0, 3);
  const highlights = top.map((e) => '· ' + e.text).join('\n');
  const mood = top[0].importance >= 7 ? '心里翻涌了一阵' : '过得挺平实';
  return `第 ${day} 天 · 日记\n今天${mood}。\n${highlights}\n回头看,这一天又把我磨成了更像我自己的样子。`;
}
