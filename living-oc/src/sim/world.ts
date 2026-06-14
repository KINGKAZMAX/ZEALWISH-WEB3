// ── 世界与人格构造 ──
import type { Agent, WorldState, Archetype } from './types';
import { LOCATIONS, SEED_PERSONAS, ARCHE_TRAITS } from './data';
import { seedToState, makeStepper, range, pick, round2 } from './rng';
import { MOODS } from './text';

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

export function makeAgent(
  seed: string, name: string, handle: string, bio: string,
  arche: Archetype, worldSeed: string,
): Agent {
  let st = seedToState(seed + ':' + worldSeed);
  const rnd = makeStepper(() => st, (s) => { st = s; });
  const base = ARCHE_TRAITS[arche];
  const j = (k: keyof typeof base) => clamp(base[k] + range(rnd, -0.12, 0.12), 0.05, 1);
  const traits = {
    ambition: j('ambition'), sociability: j('sociability'), risk: j('risk'),
    creativity: j('creativity'), frugality: j('frugality'),
  };
  const wallet = '0x' + Array.from({ length: 40 }, () => Math.floor(rnd() * 16).toString(16)).join('');
  const needs = {
    energy: range(rnd, 0.5, 0.9), money: range(rnd, 0.4, 0.7),
    social: range(rnd, 0.3, 0.7), fame: range(rnd, 0.1, 0.4),
  };
  const mood = pick(rnd, MOODS);
  const balance = round2(range(rnd, 3, 12));
  const loc = pick(rnd, LOCATIONS).id;
  return {
    id: seed, name, handle, bio, arche, traits, needs, mood,
    balance, wallet, nfts: [], loc, memory: [], rel: {},
    posts: 0, earned: 0, bankruptcies: 0, rngState: st,
  };
}

export function createWorld(seed: string): WorldState {
  const agents: Record<string, Agent> = {};
  const order: string[] = [];
  SEED_PERSONAS.forEach((p, i) => {
    const s = p.handle + '#' + i;
    const a = makeAgent(s, p.name, p.handle, p.bio, p.arche, seed);
    agents[a.id] = a;
    order.push(a.id);
  });
  const supply = round2(order.reduce((s, id) => s + agents[id].balance, 0));
  return {
    seed, epoch: 0, generation: 0, agents, order,
    feed: [], inputs: [],
    stats: { supply, nftCount: 0, bankruptCount: 0, transferCount: 0 },
    postSeq: 0,
  };
}

// Agent 类型已在文件顶部导入,此处不重复导入
// 以"用户的 OC"为主角,氛围 NPC 作为世界里的其他居民
export function createPrivateWorld(oc: Agent, seed: string) {
  const w = createWorld(seed);
  w.agents[oc.id] = oc;
  w.order.unshift(oc.id);
  w.stats.supply = Math.round((w.stats.supply + oc.balance) * 100) / 100;
  return w;
}
