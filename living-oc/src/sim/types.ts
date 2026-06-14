// ── 活世界 · 生命引擎类型(纯 TS,同构:浏览器 + node 测试均可) ──

export type LocationKind = 'social' | 'work' | 'market' | 'mint' | 'travel';
export interface Location {
  id: string;
  name: string;
  kind: LocationKind;
  x: number; // 0..1 归一化坐标(渲染层乘以画布尺寸)
  y: number;
  colorVar: string; // CSS 变量名
}

export type Archetype =
  | 'creator' | 'trader' | 'helper' | 'worker'
  | 'socialite' | 'gambler' | 'saver';

export interface Traits {
  ambition: number; sociability: number; risk: number;
  creativity: number; frugality: number;
}
export interface Needs {
  energy: number; money: number; social: number; fame: number;
}

export interface MemoryNode { e: number; t: string }

export interface Agent {
  id: string;
  name: string;
  handle: string;
  bio: string;
  arche: Archetype;
  traits: Traits;
  needs: Needs;
  mood: string;
  balance: number;
  wallet: string;
  nfts: string[];
  loc: string;
  memory: MemoryNode[];
  rel: Record<string, number>; // agentId -> 好感度 [-1,1]
  posts: number;
  earned: number;
  bankruptcies: number;
  rngState: number; // 可序列化的 RNG 状态(确定性关键)
}

export type ActionKind =
  | 'work' | 'social' | 'mint' | 'spend' | 'transfer'
  | 'gamble' | 'travel' | 'reflect' | 'post' | 'bankrupt';

export interface Decision {
  action: ActionKind;
  targetId?: string | null;
  destKind?: LocationKind; // travel 时的目标地点类型
  text?: string;           // live 模式下模型直接给的台词;scripted 留空,由执行器套模板
  reasoning?: string;      // live 模式可选:模型的推理(写入记忆/可观测)
}

export interface FeedEvent {
  kind: 'mint' | 'transfer' | 'bankrupt';
  fromName?: string;
  toName?: string;
  amount?: number;
  nft?: string;
  balance?: number;
  txHash?: string; // 链上动作真实化后填入(C)
}

export interface Post {
  id: string;
  agentId: string;
  name: string;
  handle: string;
  text: string;
  action: ActionKind;
  ev?: FeedEvent | null;
  epoch: number;
  likes: number;
}

export type WorldInput =
  | { kind: 'addAgent'; name: string }
  | { kind: 'reseed'; seed: string };

export interface WorldStats {
  supply: number;
  nftCount: number;
  bankruptCount: number;
  transferCount: number;
}

export interface WorldState {
  seed: string;
  epoch: number;
  generation: number; // 世代号:拒绝过期写入的守卫
  agents: Record<string, Agent>;
  order: string[];
  feed: Post[];
  inputs: WorldInput[]; // 事件溯源输入队列(UI 投递,step 按序消费)
  stats: WorldStats;
  postSeq: number;
}

// ── Provider 接缝(offline 默认 scripted/mock;live 在 B/C 接真) ──
export interface CognitionProvider {
  readonly mode: 'scripted' | 'live' | 'replay';
  decide(agent: Agent, world: WorldState): Promise<Decision>;
}
export interface ChainProvider {
  readonly mode: 'mock' | 'live';
  transfer(from: Agent, to: Agent, amount: number): Promise<{ ok: boolean; txHash?: string }>;
  mintNFT(owner: Agent, name: string): Promise<{ ok: boolean; tokenId?: string; txHash?: string }>;
}
export interface MediaProvider {
  readonly mode: 'stub' | 'live';
  imageFor(seed: string, size?: number): string; // 返回 data URL 或远程 URL
}
export interface Providers {
  cognition: CognitionProvider;
  chain: ChainProvider;
  media: MediaProvider;
}

export const FEED_MAX = 80;

export interface MemoryEvent {
  epoch: number;
  agentId: string;
  action: ActionKind;
  text: string;
  importance: number;
  withId?: string | null;
}
export interface DayResult {
  day: number;
  events: MemoryEvent[];
  diary: string;
}
