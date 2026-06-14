// ── 认知 Provider(scripted/offline)──
import type { CognitionProvider, Agent, WorldState, Decision } from '../types';
import { scriptedDecide } from '../systems/decision';

export class ScriptedCognitionProvider implements CognitionProvider {
  readonly mode = 'scripted' as const;
  async decide(a: Agent, world: WorldState): Promise<Decision> {
    return scriptedDecide(a, world);
  }
}
