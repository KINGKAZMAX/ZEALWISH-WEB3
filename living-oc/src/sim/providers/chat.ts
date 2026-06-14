import type { MemoryEvent } from '../types';
import { retrieve } from '../systems/memory';

export function openingLine(name: string, dayEvents: MemoryEvent[], now: number): string {
  if (dayEvents.length === 0) return `（${name}抬起头）今天没什么特别的……你来了。`;
  const top = retrieve(dayEvents, now, 1)[0];
  return `（${name}凑过来)欸,跟你说——${top.text}。今天就这点事最值得讲。`;
}
export function replyTo(name: string, userText: string, memory: MemoryEvent[], now: number, guidance?: string): string {
  const hits = retrieve(memory, now, 2);
  const ctx = hits.map((m) => m.text).join(';');
  const g = guidance ? `(还记着你说的「${guidance}」)` : '';
  if (/怎么样|如何|今天|最近/.test(userText)) {
    return `${g}今天嘛——${ctx || '过得挺平实'}。你呢?`;
  }
  return `（${name}想了想)${g}${ctx ? '让我想起' + hits[0].text + '。' : ''}嗯,我听着呢。`;
}
