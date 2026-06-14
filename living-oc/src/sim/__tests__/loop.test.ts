import { describe, it, expect } from 'vitest';
import { seedToState, makeStepper } from '../rng';

describe('rng', () => {
  it('同种子产生相同序列', () => {
    const seq = (s: string) => {
      let st = seedToState(s);
      const r = makeStepper(() => st, (v) => { st = v; });
      return [r(), r(), r()];
    };
    expect(seq('x')).toEqual(seq('x'));
    expect(seq('x')).not.toEqual(seq('y'));
  });
});

import { createWorld } from '../world';
import { step } from '../step';
import { ScriptedCognitionProvider } from '../providers/cognition';

it('世界可推进且同种子一致', async () => {
  const mkChain = () => ({ mode: 'mock' as const, async transfer(){return{ok:true};}, async mintNFT(){return{ok:true};} });
  const mkMedia = () => ({ mode: 'stub' as const, imageFor: (s: string) => s });
  const run = async (seed: string) => {
    const w = createWorld(seed);
    const p = { cognition: new ScriptedCognitionProvider(), chain: mkChain(), media: mkMedia() };
    for (let i = 0; i < 20; i++) await step(w, p);
    return JSON.stringify({ epoch: w.epoch, supply: w.stats.supply, feed: w.feed.map(f => f.text) });
  };
  expect(await run('s')).toEqual(await run('s'));
});

import { scoreImportance, retrieve, reflectToDiary } from '../systems/memory';
import type { MemoryEvent } from '../types';

const ev = (action: any, text: string, importance = 0): MemoryEvent =>
  ({ epoch: 1, agentId: 'oc', action, text, importance, withId: null });

describe('memory', () => {
  it('破产/转账比发声更重要', () => {
    expect(scoreImportance(ev('bankrupt', 'x'))).toBeGreaterThan(scoreImportance(ev('post', 'x')));
    expect(scoreImportance(ev('transfer', 'x'))).toBeGreaterThan(scoreImportance(ev('post', 'x')));
  });
  it('retrieve 按 重要度+新近 取 top-k', () => {
    const mem: MemoryEvent[] = [
      { ...ev('post', 'a'), epoch: 1, importance: 1 },
      { ...ev('bankrupt', 'b'), epoch: 9, importance: 9 },
      { ...ev('work', 'c'), epoch: 5, importance: 4 },
    ];
    const top = retrieve(mem, 10, 2).map(m => m.text);
    expect(top[0]).toBe('b');
    expect(top.length).toBe(2);
  });
  it('reflectToDiary 产出非空日记且含当天关键词', () => {
    const diary = reflectToDiary([ev('work', '在代码熔炉打了一天工', 5), ev('mint', '铸了《夜航》', 7)], 1);
    expect(diary.length).toBeGreaterThan(0);
    expect(diary).toMatch(/夜航|熔炉|今天|这一天/);
  });
});

import { makeAgent } from '../world';
import { runDay } from '../step';

it('runDay 返回主角当天的经历与日记', async () => {
  const oc = makeAgent('oc#me', '小智', '@xz', '傲娇但会关心人的 OC', 'creator', 'seedA');
  const p = {
    cognition: new ScriptedCognitionProvider(),
    chain: { mode: 'mock' as const, async transfer(){return{ok:true};}, async mintNFT(){return{ok:true};} },
    media: { mode: 'stub' as const, imageFor: (s: string) => s },
  };
  const r1 = await runDay(oc, p, 'seedA', 1, 8);
  expect(r1.events.length).toBeGreaterThan(0);
  expect(r1.diary.length).toBeGreaterThan(0);
  expect(r1.events.every(e => e.importance >= 1)).toBe(true);
  const oc2 = makeAgent('oc#me', '小智', '@xz', '傲娇但会关心人的 OC', 'creator', 'seedA');
  const r2 = await runDay(oc2, p, 'seedA', 1, 8);
  expect(r2.events.map(e => e.text)).toEqual(r1.events.map(e => e.text));
});

import { createOc, sedimentGuidance } from '../../oc/oc';
import { serializeOc, deserializeOc } from '../../oc/persist';

describe('oc model', () => {
  it('createOc 产出带身份/钱包/空记忆的主权 OC', () => {
    const oc = createOc({ name: '小智', handle: '@xz', bio: '傲娇', arche: 'creator', seed: 'k' });
    expect(oc.id).toBeTruthy();
    expect(oc.wallet).toMatch(/^0x[0-9a-f]{40}$/);
    expect(oc.memory).toEqual([]);
    expect(oc.profile).toBeDefined();
  });
  it('引导会沉淀进长期 profile', () => {
    const oc = createOc({ name: '小智', handle: '@xz', bio: '傲娇', arche: 'creator', seed: 'k' });
    sedimentGuidance(oc, '多关心身边的人');
    expect(oc.profile.guidance).toContain('多关心身边的人');
  });
  it('序列化往返一致', () => {
    const oc = createOc({ name: '小智', handle: '@xz', bio: '傲娇', arche: 'creator', seed: 'k' });
    const back = deserializeOc(serializeOc(oc));
    expect(back.id).toBe(oc.id);
    expect(back.wallet).toBe(oc.wallet);
  });
});

import { openingLine, replyTo } from '../providers/chat';

describe('chat (memory-grounded)', () => {
  const day: MemoryEvent[] = [
    { epoch: 3, agentId: 'oc', action: 'mint', text: '铸了一枚《夜航》', importance: 7, withId: null },
    { epoch: 5, agentId: 'oc', action: 'transfer', text: '给阿絮转了点钱', importance: 7, withId: 'b' },
  ];
  it('开场白引用今天最重要的经历', () => {
    const line = openingLine('小智', day, 10);
    expect(line).toMatch(/夜航|阿絮/);
  });
  it('回复会带上检索到的记忆上下文', () => {
    const r = replyTo('小智', '今天过得怎么样', day, 10);
    expect(r.length).toBeGreaterThan(0);
    expect(r).toMatch(/夜航|阿絮|今天/);
  });
  it('回复会体现最近的引导', () => {
    const r = replyTo('小智', '随便聊聊', day, 10, '多关心身边的人');
    expect(r).toContain('多关心身边的人');
  });
});

import { livingActions } from '../../store/useLiving';

describe('living loop integration', () => {
  it('创建→过一天→开场引用→引导沉淀 全链路', async () => {
    const s = livingActions('test-seed');
    const oc = s.create({ name: '小智', handle: '@xz', bio: '傲娇会关心人', arche: 'creator' });
    expect(oc.profile.daysLived).toBe(0);
    const day = await s.liveADay(oc);
    expect(day.events.length).toBeGreaterThan(0);
    expect(oc.profile.daysLived).toBe(1);
    const open = s.openChat(oc, day);
    expect(open).toMatch(/.+/);
    s.guide(oc, '多关心身边的人');
    expect(oc.profile.guidance).toContain('多关心身边的人');
  });
});
