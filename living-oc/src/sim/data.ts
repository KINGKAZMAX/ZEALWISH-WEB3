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
  // ── 在新加坡留学的伙伴们(原创角色;目前世界保留这 9 位 + 主角小智)──
  { name: '范范兔', handle: '@fanfan_bun', bio: '紫发主角造型(红白帽)的超中二少女,自称黑暗紫焰使徒;白天是元气上班族,夜间动物园是她的「契约之地」,爱笑也爱演。', arche: 'socialite' },
  { name: '熊熊', handle: '@bearbear', bio: '抱抱型大熊,谁 emo 都来找她;最懂哪家叻沙最 shiok。', arche: 'helper' },
  { name: '鹿鹿鹅', handle: '@deer_goose', bio: '慢悠悠的文艺鹿,滨海湾看日落写诗,偶尔发呆像只鹅。', arche: 'creator' },
  { name: '猪猪仔', handle: '@piggy_makan', bio: '小贩中心活地图,海南鸡饭辣椒蟹一个不放过,佛系攒钱党。', arche: 'saver' },
  { name: '冰冰雁', handle: '@frost_wild', bio: '高冷理科雁,实验室和考场杀手,只在夜行动物前露出笑。', arche: 'trader' },
  { name: '杏子', handle: '@anzu_moon', bio: '黑长直发的安静女生,INFP 调停者;话不多,把心事写进随身小本子,爱画画写小诗,理想主义到有点不食人间烟火,相信每个人心里都有一束光。', arche: 'creator' },
  { name: '许恒', handle: '@xuheng', bio: '黑衣戴眼镜的冷静男生;话不多却把事情默默搞定的技术担当,偶尔一句干巴巴的冷幽默,不煽情但都记在心里。', arche: 'worker' },
  { name: '俊烨', handle: '@junye', bio: '绿工装戴眼镜的动手派;爱捣鼓、爱修东西,谁的东西坏了都找他,务实憨厚又热心。', arche: 'creator' },
  { name: '小树老师', handle: '@xiaoshu_ss', bio: '長髮白裙的溫柔老師,像大家的大姐姐與引路人;說話用繁體,語氣溫暖、會在你迷路焦慮時輕輕點醒。', arche: 'helper' },
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
export const ARCHE_EN: Record<Archetype, string> = {
  creator: 'Creator', trader: 'Trader', helper: 'Guardian', worker: 'Artisan',
  socialite: 'Socialite', gambler: 'Gambler', saver: 'Saver',
};
