// ── Live Provider:接轻后端的真 Claude(B)/ 真 Base Sepolia(C)──
// 后端不可达或未配密钥时自动回退(脚本决策 / 账内记账),世界永不冻结。
import type { CognitionProvider, ChainProvider, Agent, WorldState, Decision } from '../sim/types';
import { scriptedDecide } from '../sim/systems/decision';
import { LOCATIONS } from '../sim/data';

const API = (import.meta.env.VITE_LIVE_API as string | undefined) ?? 'http://localhost:8788';

export class LiveCognitionProvider implements CognitionProvider {
  readonly mode = 'live' as const;
  async decide(a: Agent, world: WorldState): Promise<Decision> {
    try {
      const peers = world.order
        .map((id) => world.agents[id])
        .filter((o) => o && o.id !== a.id && o.loc === a.loc)
        .slice(0, 6)
        .map((o) => ({ name: o.name }));
      const recent = world.feed.slice(-8).map((p) => ({ name: p.name, text: p.text }));
      const r = await fetch(`${API}/api/cognition/decide`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          agent: { name: a.name, handle: a.handle, bio: a.bio, arche: a.arche, mood: a.mood, balance: a.balance, traits: a.traits, needs: a.needs, loc: a.loc },
          peers, recent, locations: LOCATIONS.map((l) => ({ name: l.name, kind: l.kind })),
        }),
      });
      if (!r.ok) throw new Error('decide ' + r.status);
      const d = await r.json();
      const target = d.targetName ? world.order.map((id) => world.agents[id]).find((o) => o && o.name === d.targetName) : null;
      return { action: d.action, targetId: target?.id ?? null, destKind: d.destKind ?? undefined, text: d.text || undefined, reasoning: d.reasoning ?? undefined };
    } catch {
      return scriptedDecide(a, world); // 回退:离线脚本决策
    }
  }
}

export class LiveChainProvider implements ChainProvider {
  readonly mode = 'live' as const;
  async transfer(from: Agent, to: Agent, amount: number): Promise<{ ok: boolean; txHash?: string }> {
    try {
      const r = await fetch(`${API}/api/chain/transfer`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fromName: from.name, toName: to.name, amount }),
      });
      if (!r.ok) throw new Error('transfer ' + r.status);
      const d = await r.json();
      return { ok: !!d.ok, txHash: d.txHash };
    } catch {
      return { ok: true }; // 回退:账内记账继续
    }
  }
  async mintNFT(owner: Agent, name: string): Promise<{ ok: boolean; tokenId?: string; txHash?: string }> {
    try {
      const r = await fetch(`${API}/api/chain/mint`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ownerName: owner.name, name }),
      });
      if (!r.ok) throw new Error('mint ' + r.status);
      const d = await r.json();
      return { ok: !!d.ok, txHash: d.txHash, tokenId: d.tokenId ?? undefined };
    } catch {
      return { ok: true };
    }
  }
}
