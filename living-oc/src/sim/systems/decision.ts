// ── 决策系统:需求×性格×处境 加权打分 + 地点门控(scripted/offline 大脑)──
// live 模式不走这里,而是把 buildAgentPrompt(a) 发给 Claude(见 providers/cognition.live.ts)。
import type { Agent, WorldState, Decision, LocationKind } from '../types';
import { locById } from '../data';
import { makeStepper } from '../rng';

export function scriptedDecide(a: Agent, world: WorldState): Decision {
  const rnd = makeStepper(() => a.rngState, (s) => { a.rngState = s; });
  const T = a.traits, N = a.needs;
  const others = world.order.filter((id) => id !== a.id).map((id) => world.agents[id]);
  const here = others.filter((o) => o.loc === a.loc);
  const loc = locById[a.loc];
  if (a.balance < 0) return { action: 'bankrupt' };
  const needy = others.filter((o) => o.balance < 0.6).sort((p, q) => p.balance - q.balance);

  const score: Record<string, number> = {};
  score.work = (1 - N.money) * 1.5 * T.ambition + N.energy * 0.35 + (loc.kind === 'work' ? 0.5 : 0);
  score.social = (1 - N.social) * 1.1 * T.sociability + (here.length ? 0.3 : 0);
  score.mint = (1 - N.fame) * 0.5 + T.creativity * 0.6 + (loc.kind === 'mint' ? 0.45 : 0) - (a.balance < 2.5 ? 1.4 : 0);
  score.spend = (1 - N.energy) * 0.85 * (1 - T.frugality) - (a.balance < 1.5 ? 1.0 : 0);
  score.gamble = T.risk > 0.75 ? (T.risk * 0.7 + (1 - N.money) * 0.5 + (loc.kind === 'market' ? 0.45 : 0)) : -2;
  score.transfer = needy.length ? (T.sociability * 0.5 + (1 - T.frugality) * 0.8 + (a.balance > 3 ? 0.6 : -0.9)) : -2;
  score.travel = 0.18 + (here.length === 0 ? 0.25 : 0) + rnd() * 0.35;
  score.reflect = rnd() < 0.08 ? 0.55 : -2;
  score.post = 0.35 + (1 - N.fame) * 0.45 * T.sociability;
  for (const k in score) score[k] += (rnd() - 0.5) * 0.3;

  let best = 'post', bv = -Infinity;
  for (const k in score) if (score[k] > bv) { bv = score[k]; best = k; }

  const reqLoc: Record<string, LocationKind> = { work: 'work', mint: 'mint', gamble: 'market', spend: 'market' };
  const need = reqLoc[best];
  if (need && loc.kind !== need && rnd() < 0.85) return { action: 'travel', destKind: need };

  if (best === 'transfer') {
    const t = needy[0];
    if (!t || a.balance < 1) return { action: 'post' };
    return { action: 'transfer', targetId: t.id };
  }
  if (best === 'social') {
    const t = here.length ? here[Math.floor(rnd() * here.length)] : others[Math.floor(rnd() * others.length)];
    return { action: 'social', targetId: t ? t.id : null };
  }
  return { action: best as Decision['action'] };
}

// 给真实 LLM 的 prompt(live 模式用;离线引擎本身不调用,但与 cognition.live.ts 共享)
export function buildAgentPrompt(a: Agent, world: WorldState): string {
  const here = world.order
    .map((id) => world.agents[id])
    .filter((o) => o.loc === a.loc && o.id !== a.id)
    .map((o) => o.name);
  return (
    `你是「${a.name}」(${a.handle})。人设:${a.bio}\n` +
    `性格(0-1):${JSON.stringify(a.traits)}\n需求:${JSON.stringify(a.needs)}\n` +
    `余额:${a.balance}◈ 位置:${locById[a.loc].name} 在场的人:${here.join('、') || '无'}\n` +
    `最近记忆:\n${a.memory.slice(0, 5).map((m) => '· ' + m.t).join('\n')}\n` +
    `请以这个人格,从 work/social/mint/spend/transfer/travel/gamble/post 选一个行动,` +
    `并写一条≤40字、符合人设语气的中文社交动态。只返回 JSON:{action,targetId,text}`
  );
}
