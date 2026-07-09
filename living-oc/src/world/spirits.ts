// 灵宠系统 —— monster-tamer 风格玩法(随行 / 收服 / 背包 / 队伍)。
// 美术全程序化生成、命名与道具全原创,不含任何第三方版权素材或商标。
// 为玩家本地态:不进入确定性世界引擎,也不参与联机主机权威,故对世界一致性/确定性零影响。

export interface Species { id: string; name: string; element: string; body: string; accent: string; round?: boolean; }
export const SPECIES: Species[] = [
  // 泡芙:圆滚滚的粉色团子萌宠(原创设计,圆身大眼腮红小脚丫;默认随身宠)
  { id: 'puff', name: '泡芙', element: '梦', body: '#e08ab8', accent: '#b85c9a', round: true },
  { id: 'ember', name: '焰狐', element: '火', body: '#ff8a3d', accent: '#ffd25a' },
  { id: 'ripple', name: '涟漪', element: '水', body: '#8a7ad8', accent: '#5a6ac8' },
  { id: 'moss', name: '苔团', element: '草', body: '#b8a83d', accent: '#8a8a2c' },
  { id: 'breeze', name: '云兔', element: '风', body: '#e8c878', accent: '#c8a858' },
  { id: 'pebble', name: '砂獾', element: '土', body: '#b89058', accent: '#8a6a44' },
  { id: 'glimmer', name: '微光', element: '光', body: '#ffd84a', accent: '#ffb52c' },
  { id: 'maple', name: '枫狸', element: '枫', body: '#d8783d', accent: '#a8502c' },
  { id: 'azure', name: '澜犬', element: '水', body: '#d8b878', accent: '#4a8ac8' },
  { id: 'spark', name: '焰猬', element: '火', body: '#ff7a2c', accent: '#c83d1e' },
  { id: 'hex', name: '星咒', element: '梦', body: '#9a7ad8', accent: '#6a4aa8' },
  { id: 'blaze', name: '炽豚', element: '火', body: '#e84a2c', accent: '#a82c1e' },
];
export const speciesById: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

export interface Spirit { uid: string; species: string; name: string; level: number; xp: number; bond: number; shiny?: boolean; }
// 闪光变体的画布滤镜(野生/随行/缩略图统一使用;像素图整体换色,零额外素材)
export const SHINY_FILTER = 'hue-rotate(165deg) saturate(1.35) brightness(1.06)';

// 随行宠物美术:采用 Pixel Mons(Akoro,免费版可商用,署名见 public/sprites/spirits/ATTRIBUTION.md)。
// 每张为 96×24 横向条带 = 24×24 × 4 帧待机动画(WorldView.drawCreature 自动识别条带并逐帧播放)。
// 物种id -> 文件名,文件位于 frontend-v4/world/sprites/spirits/<file>(由 living-oc/public 构建拷入)。
// 切勿放入任何官方/受版权保护(如 Pokémon)的素材。缺图时回退到下方极简占位绘制。
export const SPIRIT_ART: Record<string, string> = {
  puff: 'puff.png',
  ember: 'ember.png',
  ripple: 'ripple.png',
  moss: 'moss.png',
  breeze: 'breeze.png',
  pebble: 'pebble.png',
  glimmer: 'glimmer.png',
  maple: 'maple.png',
  azure: 'azure.png',
  spark: 'spark.png',
  hex: 'hex.png',
  blaze: 'blaze.png',
};

export interface Item { id: string; name: string; tag: string; color: string; desc: string; }
export const ITEMS: Item[] = [
  { id: 'stone', name: '灵石', tag: '石', color: '#caa84a', desc: '收服野生宠物所需的结晶。' },
  { id: 'berry', name: '能量果', tag: '果', color: '#d9534f', desc: '喂给随行宠物,提升羁绊与经验。' },
  { id: 'charm', name: '羁绊符', tag: '符', color: '#9b6dde', desc: '稀有信物,见证你与宠物的旅程。' },
];
export const itemById: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

function h(s: string): number { let n = 0; for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0; return n; }

// 起始队伍 / 背包:默认随身宠是可爱的「泡芙」(圆滚滚粉团子),人人起手都有它。
export function starterTeam(seed: string): Spirit[] {
  return [{ uid: 'sp_puff_' + (h(seed) >>> 0).toString(16), species: 'puff', name: '泡芙', level: 5, xp: 0, bond: 30 }];
}
export function starterBag(): Record<string, number> { return { stone: 3, berry: 5 }; }

export function newSpirit(speciesId: string, seedHint: string): Spirit {
  const sp = speciesById[speciesId] || SPECIES[0];
  return { uid: 'sp_' + (h(speciesId + ':' + seedHint) >>> 0).toString(16), species: sp.id, name: sp.name, level: 2 + (h(seedHint) % 6), xp: 0, bond: 8 };
}

// 极简占位绘制(fallback):正常情况下 12 系均有 SPIRIT_ART 像素立绘(Pixel Mons),此函数不会被触发;
// 仅当某张精灵图加载失败时兜底,画一个按元素配色的柔和小团 + 阴影,避免空白/报错。
// cx,cy = 脚底中心点;size = 体高(px);frame = 呼吸相位 sin∈[-1,1]。
export function drawSpirit(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, speciesId: string, frame: number, _faceLeft: boolean) {
  const sp = speciesById[speciesId] || SPECIES[0];
  const r = size / 2; const bob = -frame * size * 0.06;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = sp.body;
  ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.7 + bob, r * 0.7, r * 0.7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = sp.accent;
  ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.55 + bob, r * 0.34, r * 0.34, 0, 0, 7); ctx.fill();
  ctx.restore();
}
