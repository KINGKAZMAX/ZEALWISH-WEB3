// ── 世界数据:地点、种子人格、原型性格 ──
import type { Location, Archetype, Traits } from './types';

export const LOCATIONS: Location[] = [
  { id: 'plaza',   name: '中央广场', kind: 'social', x: 0.5,  y: 0.3,  colorVar: '--coral' },
  { id: 'forge',   name: '代码熔炉', kind: 'work',   x: 0.2,  y: 0.62, colorVar: '--jade' },
  { id: 'bazaar',  name: '链上集市', kind: 'market', x: 0.8,  y: 0.6,  colorVar: '--amber' },
  { id: 'gallery', name: '铸造画廊', kind: 'mint',   x: 0.66, y: 0.18, colorVar: '--violet' },
  { id: 'harbor',  name: '数据港湾', kind: 'travel', x: 0.3,  y: 0.2,  colorVar: '--sky' },
  { id: 'commons', name: '公地花园', kind: 'social', x: 0.78, y: 0.86, colorVar: '--coral' },
];

export const locById: Record<string, Location> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, l]),
);

export interface SeedPersona {
  name: string;
  handle: string;
  bio: string;
  arche: Archetype;
}

export const SEED_PERSONAS: SeedPersona[] = [
  { name: '墨衡', handle: '@inkbalance', bio: '数字水墨匠人,把每一笔都铸成链上孤本。', arche: 'creator' },
  { name: 'Vega', handle: '@vega_eth', bio: '昼伏夜出的套利幽灵,只信仰波动率。', arche: 'trader' },
  { name: '阿絮', handle: '@fluff_ah', bio: '公地花园的园丁,相信温柔能修复一切。', arche: 'helper' },
  { name: 'Kojin', handle: '@kojin_dev', bio: '熔炉里最勤的铁匠,代码即修行。', arche: 'worker' },
  { name: '灯歌', handle: '@lampsong', bio: '广场上的吟游者,靠故事和点赞为生。', arche: 'socialite' },
  { name: 'Nyx', handle: '@nyx_void', bio: '风险成瘾者,破产三次仍在 all in。', arche: 'gambler' },
  { name: '青禾', handle: '@greenseed', bio: '攒币的稳健派,梦想是买下一整座画廊。', arche: 'saver' },
  { name: 'Orin', handle: '@orin_mint', bio: '铸造画廊常驻,把情绪做成 NFT 系列。', arche: 'creator' },
];

export const ARCHE_TRAITS: Record<Archetype, Traits> = {
  creator:   { ambition: 0.6,  sociability: 0.5,  risk: 0.5,  creativity: 0.95, frugality: 0.4 },
  trader:    { ambition: 0.85, sociability: 0.4,  risk: 0.85, creativity: 0.4,  frugality: 0.5 },
  helper:    { ambition: 0.35, sociability: 0.85, risk: 0.25, creativity: 0.5,  frugality: 0.6 },
  worker:    { ambition: 0.7,  sociability: 0.4,  risk: 0.3,  creativity: 0.45, frugality: 0.75 },
  socialite: { ambition: 0.5,  sociability: 0.97, risk: 0.5,  creativity: 0.6,  frugality: 0.35 },
  gambler:   { ambition: 0.8,  sociability: 0.5,  risk: 0.97, creativity: 0.5,  frugality: 0.15 },
  saver:     { ambition: 0.55, sociability: 0.45, risk: 0.2,  creativity: 0.4,  frugality: 0.95 },
};

export const ARCHE_CN: Record<Archetype, string> = {
  creator: '创作者', trader: '投机者', helper: '守护者', worker: '匠人',
  socialite: '社交动物', gambler: '赌徒', saver: '积攒者',
};
