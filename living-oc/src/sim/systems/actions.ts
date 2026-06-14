// ── 动作执行器:把 Decision 落地为世界状态变更 + 社交流 ──
// 链上动作(transfer/mint)走 providers.chain:offline=MockChain,live=viem+Base(C)。
import type { Agent, WorldState, Decision, Providers, FeedEvent, ActionKind, MemoryEvent } from '../types';
import { FEED_MAX } from '../types';
import { locById, LOCATIONS } from '../data';
import { makeStepper, range, pick, round2 } from '../rng';
import { tpl, ART_WORDS, MOODS, LESSONS, CHOICES } from '../text';
import { remember, bumpRel, scoreImportance } from './memory';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function pushPost(world: WorldState, a: Agent, text: string, action: ActionKind, ev: FeedEvent | null) {
  const rnd = makeStepper(() => a.rngState, (s) => { a.rngState = s; });
  world.postSeq++;
  const likes = Math.floor(a.needs.fame * 40 + rnd() * 12);
  world.feed.unshift({
    id: 'p' + world.postSeq, agentId: a.id, name: a.name, handle: a.handle,
    text, action, ev, epoch: world.epoch, likes,
  });
  if (world.feed.length > FEED_MAX) world.feed.pop();
  a.posts++;
  remember(a, world.epoch, text);
}

export async function applyAction(
  world: WorldState, a: Agent, dec: Decision, _providers: Providers, sink?: MemoryEvent[],
): Promise<void> {
  const rnd = makeStepper(() => a.rngState, (s) => { a.rngState = s; });
  const adjust = (k: keyof Agent['needs'], d: number) => { a.needs[k] = clamp01(a.needs[k] + d); };
  const loc = locById[a.loc];
  let post: string | null = dec.text ?? null; // live 模式直接用模型台词
  let ev: FeedEvent | null = null;
  let action: ActionKind = dec.action;

  switch (dec.action) {
    case 'work': {
      const amt = round2(range(rnd, 0.4, 1.6));
      a.balance = round2(a.balance + amt); a.earned = round2(a.earned + amt);
      world.stats.supply = round2(world.stats.supply + amt);
      adjust('money', 0.18); adjust('energy', -0.22); a.mood = pick(rnd, ['笃定', '疲惫', '澄明']);
      if (!post) post = tpl('work', rnd, { amt, loc: loc.name });
      break;
    }
    case 'spend': {
      const amt = Math.min(a.balance * 0.4, round2(range(rnd, 0.3, 1.2)));
      if (amt > 0.05) {
        a.balance = round2(a.balance - amt); world.stats.supply = round2(world.stats.supply - amt);
        adjust('energy', 0.25); adjust('social', 0.06); a.mood = '雀跃';
        if (!post) post = tpl('spend', rnd, { amt, loc: loc.name });
      } else {
        if (!post) post = tpl('social', rnd, { other: '自己' });
        action = 'post';
      }
      break;
    }
    case 'social': {
      adjust('social', 0.3); adjust('fame', 0.05);
      const t = dec.targetId ? world.agents[dec.targetId] : null;
      if (t) { bumpRel(a, t, 0.08); bumpRel(t, a, 0.05); }
      a.mood = pick(rnd, ['温柔', '雀跃', '澄明']);
      if (!post) post = tpl('social', rnd, { other: t ? t.name : '路人' });
      break;
    }
    case 'mint': {
      const cost = round2(range(rnd, 0.6, 1.4));
      if (a.balance >= cost) {
        const art = pick(rnd, ART_WORDS);
        const res: { ok: boolean; tokenId?: string; txHash?: string } = { ok: true };
        if (res.ok) {
          a.balance = round2(a.balance - cost); world.stats.supply = round2(world.stats.supply - cost);
          world.stats.nftCount++;
          const label = art + (res.tokenId ? '#' + res.tokenId : '#' + world.stats.nftCount);
          a.nfts.push(label); adjust('fame', 0.22); adjust('energy', -0.1); a.mood = '孤勇';
          if (!post) post = tpl('mint', rnd, { art, loc: loc.name, n: a.nfts.length, mood: a.mood });
          ev = { kind: 'mint', fromName: a.name, nft: label, txHash: res.txHash };
        } else {
          if (!post) post = tpl('reflect', rnd, { n: world.epoch, lesson: pick(rnd, LESSONS), choice: pick(rnd, CHOICES), arche: a.arche });
          action = 'reflect';
        }
      } else {
        if (!post) post = tpl('reflect', rnd, { n: world.epoch, lesson: pick(rnd, LESSONS), choice: pick(rnd, CHOICES), arche: a.arche });
        action = 'reflect';
      }
      break;
    }
    case 'transfer': {
      const t = dec.targetId ? world.agents[dec.targetId] : null;
      if (t) {
        const amt = Math.min(round2(a.balance * 0.35), 2);
        if (amt > 0.1) {
          const res: { ok: boolean; txHash?: string } = { ok: true };
          if (res.ok) {
            a.balance = round2(a.balance - amt); t.balance = round2(t.balance + amt);
            world.stats.transferCount++; bumpRel(t, a, 0.25); bumpRel(a, t, 0.08); adjust('social', 0.12);
            if (!post) post = tpl('transfer', rnd, { other: t.name, amt });
            ev = { kind: 'transfer', fromName: a.name, toName: t.name, amount: amt, txHash: res.txHash };
          }
        }
      }
      if (!post) { post = tpl('social', rnd, { other: '远方' }); action = 'social'; }
      break;
    }
    case 'gamble': {
      const stake = round2(a.traits.risk > 0.85 ? range(rnd, 1.5, 5) : range(rnd, 0.6, 2.5));
      const win = rnd() < 0.43;
      if (win) {
        a.balance = round2(a.balance + stake); world.stats.supply = round2(world.stats.supply + stake);
        a.mood = '躁动'; adjust('money', 0.25);
        if (!post) post = `在链上集市豪赌一把,赢了 ${stake}◈!波动率万岁。`;
      } else {
        a.balance = round2(a.balance - stake); world.stats.supply = round2(world.stats.supply - stake);
        a.mood = '怅惘'; adjust('money', -0.2);
        if (!post) post = `梭哈失败,蒸发 ${stake}◈。` + (a.balance < 0 ? '……我好像归零了。' : '下次一定。');
      }
      break;
    }
    case 'travel': {
      let dest;
      if (dec.destKind) {
        const cands = LOCATIONS.filter((l) => l.kind === dec.destKind && l.id !== a.loc);
        dest = cands.length ? pick(rnd, cands) : pick(rnd, LOCATIONS.filter((l) => l.id !== a.loc));
      } else {
        dest = pick(rnd, LOCATIONS.filter((l) => l.id !== a.loc));
      }
      const from = loc.name; a.loc = dest.id; adjust('energy', -0.05);
      if (!post) post = tpl('travel', rnd, { from, loc: dest.name });
      break;
    }
    case 'reflect': {
      a.mood = pick(rnd, MOODS);
      if (!post) post = tpl('reflect', rnd, { n: world.epoch, lesson: pick(rnd, LESSONS), choice: pick(rnd, CHOICES), arche: a.arche });
      break;
    }
    case 'bankrupt': {
      a.bankruptcies++; world.stats.bankruptCount++;
      remember(a, world.epoch, `💥 第${a.bankruptcies}次破产,余额 ${a.balance.toFixed(2)}◈`);
      if (!post) post = tpl('broke', rnd, { bal: a.balance.toFixed(2) });
      ev = { kind: 'bankrupt', fromName: a.name, balance: a.balance };
      const give = round2(range(rnd, 0.5, 1.2));
      a.balance = give; world.stats.supply = round2(world.stats.supply + give);
      a.needs.money = 0.3; a.mood = '孤勇';
      break;
    }
    default: {
      adjust('fame', 0.04);
      if (!post) post = tpl('reflect', rnd, { n: world.epoch, lesson: pick(rnd, LESSONS), choice: pick(rnd, CHOICES), arche: a.arche });
    }
  }

  // 需求自然衰减
  a.needs.energy = Math.max(0, a.needs.energy - 0.04);
  a.needs.social = Math.max(0, a.needs.social - 0.03);
  if (post) pushPost(world, a, post, action, ev);

  if (post && sink) {
    const e: MemoryEvent = {
      epoch: world.epoch, agentId: a.id, action,
      text: post, importance: 0, withId: dec.targetId ?? null,
    };
    e.importance = scoreImportance(e);
    sink.push(e);
  }
}
