// ── 权威世界引擎:单线程 step() + 事件溯源输入队列 + 世代守卫 ──
// 模式来自 a16z ai-town / Convex:UI 只投递 input,绝不直接改世界;step 按序消费。
import type { WorldState, Providers, Archetype, Agent, MemoryEvent, DayResult } from './types';
import { makeAgent, createPrivateWorld } from './world';
import { applyAction } from './systems/actions';
import { reflectToDiary } from './systems/memory';
import { ARCHE_TRAITS } from './data';
import { xmur3, round2 } from './rng';

const UPKEEP = 0.06; // 每纪元生活开销 → 制造经济压力,逼人打工,闲人渐入困境

/** 消费输入队列(事件溯源):UI 投递的动作在这里按序落地 */
function drainInputs(world: WorldState) {
  const drained = world.inputs.splice(0, world.inputs.length);
  for (const inp of drained) {
    if (inp.kind === 'addAgent') {
      const display = inp.name.trim() || '@new_soul';
      const name = display.replace('@', '');
      const idx = world.order.length;
      const arches = Object.keys(ARCHE_TRAITS) as Archetype[];
      const arche = arches[xmur3(display + world.epoch) % arches.length];
      const seed = display + '#' + idx + ':' + world.epoch;
      const handle = display.startsWith('@') ? display : '@' + name.toLowerCase();
      // ✦ LLM HOOK(B):live 模式应读取该 @handle 的真实推文,蒸馏出 bio/traits/voice
      const bio = '一个从' + (display.startsWith('@') ? '推特' : '虚空') + '克隆而来的新灵魂,人设待涌现。';
      const a = makeAgent(seed, name, handle, bio, arche, world.seed);
      world.agents[a.id] = a;
      world.order.push(a.id);
      world.stats.supply = round2(world.stats.supply + a.balance);
    } else if (inp.kind === 'reseed') {
      // reseed 由 store 重建世界处理;此处仅占位
    }
  }
}

/**
 * 推进一个纪元。原地变更 world 并返回它。
 * @param expectGeneration 调用方期望的世代号;不匹配则拒绝(过期写入守卫)。
 */
export async function step(
  world: WorldState, providers: Providers, expectGeneration?: number,
): Promise<WorldState> {
  if (expectGeneration != null && expectGeneration !== world.generation) {
    return world; // stale:拒绝过期 step,保证单飞
  }
  world.epoch++;
  drainInputs(world);
  // 确定性顺序遍历:每个被唤醒的人格 decide → act
  // (M1 升级:仅唤醒 nextWakeTick<=now 且通过反应门控的人格,O(awake) 而非 O(N))
  for (const id of world.order) {
    const a = world.agents[id];
    const dec = await providers.cognition.decide(a, world); // ✦ scripted / live(B)
    await applyAction(world, a, dec, providers);
    if (dec.action !== 'bankrupt') {
      a.balance = round2(a.balance - UPKEEP);
      world.stats.supply = round2(world.stats.supply - UPKEEP);
    }
  }
  return world;
}

export async function runDay(
  oc: Agent, providers: Providers, seed: string, day: number, ticks = 8,
): Promise<DayResult> {
  const world = createPrivateWorld(oc, seed + ':day' + day);
  const events: MemoryEvent[] = [];
  for (let t = 0; t < ticks; t++) {
    world.epoch++;
    for (const id of world.order) {
      const a = world.agents[id];
      const dec = await providers.cognition.decide(a, world);
      await applyAction(world, a, dec, providers, a.id === oc.id ? events : undefined);
      if (dec.action !== 'bankrupt') {
        a.balance = Math.round((a.balance - 0.06) * 100) / 100;
      }
    }
  }
  oc.memory.unshift(...events.map(e => ({ e: e.epoch, t: e.text })));
  if (oc.memory.length > 60) oc.memory.length = 60;
  const diary = reflectToDiary(events, day);
  return { day, events, diary };
}

export function enqueue(world: WorldState, input: WorldState['inputs'][number]) {
  world.inputs.push(input);
}

/** 仅消费输入队列、不推进时间(用于 UI 即时反馈,如暂停时克隆人格) */
export function flushInputs(world: WorldState) {
  drainInputs(world);
}
