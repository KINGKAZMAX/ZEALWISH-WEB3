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

// 外部灵宠美术接入点(可选):把合规授权(CC0 / OGA-BY 等)的像素怪物 PNG 放到
//   frontend-v4/world/sprites/spirits/<file>,并在此登记 物种id -> 文件名,即可替换程序化美术。
// 留空 = 使用内置原创程序化美术(零版权风险、零 404)。切勿放入任何官方/受版权保护的素材。
export const SPIRIT_ART: Record<string, string> = {
  // 例:ember: 'ember.png', ripple: 'ripple.png',
};

export interface Item { id: string; name: string; tag: string; color: string; desc: string; }
export const ITEMS: Item[] = [
  { id: 'stone', name: '灵石', tag: '石', color: '#caa84a', desc: '收服野生灵宠所需的结晶。' },
  { id: 'berry', name: '能量果', tag: '果', color: '#d9534f', desc: '喂给随行灵宠,提升羁绊与经验。' },
  { id: 'charm', name: '羁绊符', tag: '符', color: '#9b6dde', desc: '稀有信物,见证你与灵宠的旅程。' },
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

// 程序化绘制一只原创灵宠(无外部美术)。cx,cy = 脚底中心点,size = 体高(px)。
// frame:连续浮点「呼吸相位」(典型取值 sin(...)∈[-1,1]),用于静止站立时也有的轻微上下浮动(idle bob)。
export function drawSpirit(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, speciesId: string, frame: number, faceLeft: boolean) {
  const sp = speciesById[speciesId] || SPECIES[0];
  const r = size / 2; const bob = -frame * size * 0.06;
  ctx.save();
  ctx.translate(cx, cy - r + bob);
  if (faceLeft) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  if (sp.round) {
    // ── 圆滚滚萌宠(泡芙):圆身 + 大眼 + 腮红 + 小脚丫(原创可爱设计)──
    ctx.fillStyle = sp.accent;
    ctx.beginPath(); ctx.ellipse(-r * 0.4, r * 0.82, r * 0.3, r * 0.16, 0, 0, 7); ctx.fill();        // 左脚
    ctx.beginPath(); ctx.ellipse(r * 0.4, r * 0.82, r * 0.3, r * 0.16, 0, 0, 7); ctx.fill();         // 右脚
    ctx.beginPath(); ctx.ellipse(-r * 0.84, r * 0.06, r * 0.2, r * 0.3, 0.25, 0, 7); ctx.ellipse(r * 0.84, r * 0.06, r * 0.2, r * 0.3, -0.25, 0, 7); ctx.fill();  // 小手
    ctx.fillStyle = sp.body; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.94, r * 0.9, 0, 0, 7); ctx.fill();  // 圆身
    ctx.fillStyle = '#3a2336'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.12, r * 0.13, r * 0.26, 0, 0, 7); ctx.ellipse(r * 0.3, -r * 0.12, r * 0.13, r * 0.26, 0, 0, 7); ctx.fill();  // 大眼
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-r * 0.26, -r * 0.22, r * 0.05, 0, 7); ctx.arc(r * 0.34, -r * 0.22, r * 0.05, 0, 7); ctx.fill();  // 眼高光
    ctx.fillStyle = 'rgba(255,110,150,.5)'; ctx.beginPath(); ctx.ellipse(-r * 0.5, r * 0.2, r * 0.17, r * 0.1, 0, 0, 7); ctx.ellipse(r * 0.5, r * 0.2, r * 0.17, r * 0.1, 0, 0, 7); ctx.fill();  // 腮红
    ctx.strokeStyle = '#9a3a52'; ctx.lineWidth = Math.max(1, r * 0.07); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, r * 0.06, r * 0.13, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke();  // 微笑
    ctx.restore(); return;
  }
  ctx.fillStyle = sp.body;
  // 耳朵
  ctx.beginPath(); ctx.moveTo(-r * 0.55, -r * 0.45); ctx.lineTo(-r * 0.28, -r * 1.15); ctx.lineTo(-r * 0.02, -r * 0.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r * 0.55, -r * 0.45); ctx.lineTo(r * 0.28, -r * 1.15); ctx.lineTo(r * 0.02, -r * 0.5); ctx.closePath(); ctx.fill();
  // 身体
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.88, r * 0.98, 0, 0, 7); ctx.fill();
  // 肚皮
  ctx.fillStyle = sp.accent; ctx.beginPath(); ctx.ellipse(0, r * 0.22, r * 0.5, r * 0.6, 0, 0, 7); ctx.fill();
  // 眼睛
  ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(-r * 0.33, -r * 0.08, r * 0.15, 0, 7); ctx.arc(r * 0.33, -r * 0.08, r * 0.15, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.13, r * 0.06, 0, 7); ctx.arc(r * 0.38, -r * 0.13, r * 0.06, 0, 7); ctx.fill();
  // 腮红
  ctx.fillStyle = 'rgba(255,120,120,.45)'; ctx.beginPath(); ctx.arc(-r * 0.5, r * 0.2, r * 0.12, 0, 7); ctx.arc(r * 0.5, r * 0.2, r * 0.12, 0, 7); ctx.fill();
  ctx.restore();
}
