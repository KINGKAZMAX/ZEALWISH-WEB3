// 灵宠系统 —— monster-tamer 风格玩法(随行 / 收服 / 背包 / 队伍)。
// 美术全程序化生成、命名与道具全原创,不含任何第三方版权素材或商标。
// 为玩家本地态:不进入确定性世界引擎,也不参与联机主机权威,故对世界一致性/确定性零影响。

export interface Species { id: string; name: string; element: string; body: string; accent: string; round?: boolean; }
export const SPECIES: Species[] = [
  // 泡芙:圆滚滚的粉色团子萌宠(原创设计,圆身大眼腮红小脚丫;默认随身宠)
  { id: 'puff', name: '泡芙', element: '梦', body: '#ffb0d4', accent: '#f47ba8', round: true },
  { id: 'ember', name: '焰狐', element: '火', body: '#ff8a3d', accent: '#ffe08a' },
  { id: 'ripple', name: '涟漪', element: '水', body: '#57b6ff', accent: '#d6f0ff' },
  { id: 'moss', name: '苔团', element: '草', body: '#6fcf6f', accent: '#e2ffcf' },
  { id: 'breeze', name: '云羊', element: '风', body: '#e9eef7', accent: '#bcd0ff' },
  { id: 'pebble', name: '砂蟹', element: '土', body: '#d8b483', accent: '#8a6a44' },
  { id: 'glimmer', name: '微光', element: '光', body: '#c79bff', accent: '#fff0a6' },
];
export const speciesById: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

export interface Spirit { uid: string; species: string; name: string; level: number; xp: number; bond: number; }

// 随行宠物美术:采用开源怪物收集游戏 Tuxemon 的像素立绘(CC BY-SA 4.0,合法可再分发,
// 署名见 public/sprites/spirits/ATTRIBUTION.md)。物种id -> 文件名,文件位于
//   frontend-v4/world/sprites/spirits/<file>(由 living-oc/public/sprites/spirits 构建拷入)。
// 切勿放入任何官方/受版权保护(如 Pokémon)的素材。缺图时回退到下方极简占位绘制。
export const SPIRIT_ART: Record<string, string> = {
  puff: 'puff.png',        // Cochini
  ember: 'ember.png',      // Criniotherme
  ripple: 'ripple.png',    // Dollfin
  moss: 'moss.png',        // Viviphyta
  breeze: 'breeze.png',    // Dandicub
  pebble: 'pebble.png',    // Dune Pincher
  glimmer: 'glimmer.png',  // Axylightl
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

// 极简占位绘制(fallback):正常情况下 7 系均有 SPIRIT_ART 像素立绘,此函数不会被触发;
// 仅当某张精灵图加载失败时兜底,画一个按元素配色的柔和小团 + 阴影,避免空白/报错。
// 旧的程序化「原创灵宠」多形状画法已移除(改用 Tuxemon 像素素材)。
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
