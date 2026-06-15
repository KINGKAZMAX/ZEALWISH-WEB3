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
  // ── 在新加坡留学的伙伴们(原创角色;目前世界只保留这 5 位 + 主角小智)──
  { name: '范范兔', handle: '@fanfan_bun', bio: '紫发主角造型(红白帽)的超中二少女,自称黑暗紫焰使徒;白天是元气上班族,夜间动物园是她的「契约之地」,爱笑也爱演。', arche: 'socialite' },
  { name: '熊熊', handle: '@bearbear', bio: '抱抱型大熊,谁 emo 都来找她;最懂哪家叻沙最 shiok。', arche: 'helper' },
  { name: '鹿鹿鹅', handle: '@deer_goose', bio: '慢悠悠的文艺鹿,滨海湾看日落写诗,偶尔发呆像只鹅。', arche: 'creator' },
  { name: '猪猪仔', handle: '@piggy_makan', bio: '小贩中心活地图,海南鸡饭辣椒蟹一个不放过,佛系攒钱党。', arche: 'saver' },
  { name: '冰冰雁', handle: '@frost_wild', bio: '高冷理科雁,实验室和考场杀手,只在夜行动物前露出笑。', arche: 'trader' },
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
