import type { Agent, Archetype } from '../sim/types';
import type { Spirit } from '../world/spirits';
import { makeAgent } from '../sim/world';

export interface OcProfile {
  guidance: string[];
  insights: string[];
  daysLived: number;
}
// sprite:玩家在世界里的「像素小人」身体(从工作台创建流程带入;见 App.tsx spawn 流程)
// team/bag/active:玩家的灵宠队伍与背包(monster-tamer 玩法,见 world/spirits.ts);随角色持久化。
export type OC = Agent & { profile: OcProfile; sprite?: string; team?: Spirit[]; bag?: Record<string, number>; active?: string };

export function createOc(p: { name: string; handle: string; bio: string; arche: Archetype; seed: string }): OC {
  const a = makeAgent('oc#' + p.handle.replace('@', '') + ':' + p.seed, p.name, p.handle, p.bio, p.arche, p.seed);
  return Object.assign(a, { profile: { guidance: [], insights: [], daysLived: 0 } as OcProfile });
}
export function sedimentGuidance(oc: OC, text: string) {
  if (text.trim()) oc.profile.guidance.unshift(text.trim());
  if (oc.profile.guidance.length > 20) oc.profile.guidance.length = 20;
}
