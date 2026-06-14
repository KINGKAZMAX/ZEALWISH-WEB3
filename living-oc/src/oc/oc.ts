import type { Agent, Archetype } from '../sim/types';
import { makeAgent } from '../sim/world';

export interface OcProfile {
  guidance: string[];
  insights: string[];
  daysLived: number;
}
export type OC = Agent & { profile: OcProfile };

export function createOc(p: { name: string; handle: string; bio: string; arche: Archetype; seed: string }): OC {
  const a = makeAgent('oc#' + p.handle.replace('@', '') + ':' + p.seed, p.name, p.handle, p.bio, p.arche, p.seed);
  return Object.assign(a, { profile: { guidance: [], insights: [], daysLived: 0 } as OcProfile });
}
export function sedimentGuidance(oc: OC, text: string) {
  if (text.trim()) oc.profile.guidance.unshift(text.trim());
  if (oc.profile.guidance.length > 20) oc.profile.guidance.length = 20;
}
