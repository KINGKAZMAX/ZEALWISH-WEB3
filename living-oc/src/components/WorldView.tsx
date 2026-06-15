import { useEffect, useRef, useState } from 'react';
import { useLiving } from '../store/useLiving';
import { LOCATIONS, locById, ARCHE_CN } from '../sim/data';
import { actionCN } from '../sim/text';
import type { Agent } from '../sim/types';
import WorldGoLive from './WorldGoLive';
import { liveSay, liveTalk } from '../live/liveProviders';

const BASE = import.meta.env.BASE_URL;
const MAP_SRC = 'kanto.webp';
// 关都总图 6528×6400(地图坐标系 = 原始像素)。内容是不规则陆地、含白色空白,
// 移动用降采样碰撞图限定在陆地上;6 地点放在一处镇区陆地上。
const MAP_W = 6528, MAP_H = 6400;
const MAP_SCALE = 2.5;                  // 屏上缩放(16px 瓦片 → 40px)
const TILE = 16 * MAP_SCALE;           // 屏上一格 = 32
const SPEED = 150;                     // 手控速度(地图 px/秒)
const NPC_SPEED = 78;                  // 自治居民速度
const INTERACT_R = 30;                 // 交互半径(地图 px)
// 6 个 ZEALWISH 地点在关都地图上的位置(归一化;散布在各镇)
const KANTO_POS: Record<string, [number, number]> = {
  gallery: [0.45, 0.15], harbor: [0.49, 0.15], plaza: [0.53, 0.15],
  bazaar: [0.57, 0.15], commons: [0.61, 0.15], forge: [0.65, 0.15],
};
const posOf = (id: string): [number, number] => KANTO_POS[id] || [0.5, 0.5];

const NPC_CHARS = ['green_normal', 'boy', 'lass', 'youngster', 'fat_man', 'beauty', 'gentleman'];
// 命名角色专属精灵(小智=Red 另外处理;5 个新加坡留学伙伴用对应 chr-*.png)
const NAMED_SPRITE: Record<string, string> = {
  '范范兔': 'fanfan', '熊熊': 'xiongxiong', '鹿鹿鹅': 'lulu', '猪猪仔': 'zhuzhu', '冰冰雁': 'bingbing',
};
// 头顶气泡台词库(联网研究:新加坡留学日常 + 夜间动物园)。LLM 接入后由后端实时生成替换。
const LINE_BANKS: Record<string, string[]> = {
  '小智': ['我的世界醒了…每个人都在好好过日子', '看着你们活起来,我也想活得更用力些', '在新加坡的她们,把日常过成了发光的样子', '今天也要创作、成长、拥有自己 ✦'],
  '范范兔': ['今天又赶 A1 巴士赶到飞起,NUS 大到会迷路 lah', '海南鸡饭加辣椒酱…shiok 到流泪!', 'Kaya toast 配半生熟蛋,我原地满血复活~', '周末去看 Supertree 灯光秀,免费的快乐最甜 can', '夜间动物园的马来貘,黑白两截像系了围裙!', '占位用纸巾 chope 一下,这桌我的咯', 'Eh 你吃了没?走啦食阁见!'],
  '熊熊': ['谁 emo 都来抱抱,熊熊在的 lah', '加东叻沙剪短米粉用勺子喝,最 shiok', '室内冷气冻到发抖,披我外套吧~', 'Deadline 别怕,先喝杯 teh tarik 压压惊', '夜间动物园水獭一家在吵架,可爱炸了', '组屋楼下就是巴刹,我跟卖鸡饭 auntie 都熟了'],
  '鹿鹿鹅': ['滨海湾日落太美,我又发呆成一只鹅了…', '擎天树灯光秀 8:45 那场,想为它写首诗', '夜里靠月光找动物,黑暗里也有诗意 leh', '果蝠倒挂着啃水果,近到能数牙齿,绝了', '炒粿条要够镬气 wok hei,焦香才入魂'],
  '猪猪仔': ['食阁一餐才 3 块钱,比自己煮还便宜 can!', '辣椒蟹满手酱,馒头蘸完我又点一份,paiseh', '沙爹配花生酱,晚上烤串最香 lah', '佛系攒钱党,但美食面前钱包自动打开 lor', '夜间动物园穿山甲一卷成球,可爱到犯规', '小贩中心是 UNESCO 非遗,我替它骄傲(继续恰)'],
  '冰冰雁': ['图书馆通宵 mugging,bell curve 我必须赢', '高冷如我,只在夜行动物面前破功微笑', 'MRT 早高峰挤成沙丁鱼,我被压成 2D 了 lor', 'Creatures of the Night 表演,水獭比我会演', '闪光灯不要开啦!会吓到夜行动物 sia', '波动率万岁,但叻沙的性价比更稳 lah'],
};
const FRAME: Record<string, { idle: number; walk: [number, number] }> = {
  down: { idle: 0, walk: [3, 4] }, up: { idle: 5, walk: [6, 5] }, side: { idle: 2, walk: [7, 8] },
};

function hue(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 360; }
function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
// 头顶对话气泡(cx=中心,by=气泡底部 y)
function bubble(c: CanvasRenderingContext2D, cx: number, by: number, text: string) {
  c.font = '11px "Noto Sans SC", ui-monospace, monospace'; c.textBaseline = 'top';
  const per = 13, lines: string[] = []; for (let i = 0; i < text.length; i += per) lines.push(text.slice(i, i + per));
  const lh = 15, w = Math.max(...lines.map((l) => c.measureText(l).width)) + 16, h = lines.length * lh + 8, x = cx - w / 2, y = by - h;
  c.fillStyle = 'rgba(255,255,255,.95)'; c.strokeStyle = 'rgba(255,45,45,.45)'; c.lineWidth = 1.2;
  rrect(c, x, y, w, h, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(cx - 5, by - 1); c.lineTo(cx + 5, by - 1); c.lineTo(cx, by + 5); c.closePath(); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill();
  c.fillStyle = '#17171c'; c.textAlign = 'center'; lines.forEach((l, i) => c.fillText(l, cx, y + 4 + i * lh));
  c.textBaseline = 'alphabetic';
}

interface PP { mx: number; my: number; dir: string; moving: boolean; flip?: boolean }

function Bar({ label, v }: { label: string; v: number }) {
  return (<div className="ibar"><div className="ibar-lab"><span>{label}</span><span>{Math.round(v * 100)}</span></div><div className="ibar-track"><span style={{ width: v * 100 + '%' }} /></div></div>);
}
function Inspector({ a, isOc }: { a: Agent; isOc: boolean }) {
  return (
    <div className="insp">
      <div className="insp-top"><span className="insp-av" style={{ background: `hsl(${hue(a.id)},45%,55%)` }} />
        <div><div className="insp-nm">{a.name}{isOc && <span className="insp-you"> ★ 你的 OC</span>}</div>
          <div className="insp-hd">{a.handle} · {ARCHE_CN[a.arche]} · 「{a.mood}」</div></div></div>
      <div className="insp-wallet">{a.wallet.slice(0, 18)}…</div>
      <div className={'insp-bal ' + (a.balance < 0 ? 'neg' : 'pos')}>{a.balance.toFixed(2)} <small>◈</small></div>
      {a.nfts.length > 0 && <div className="insp-nfts">{a.nfts.slice(-6).map((n, i) => <span key={i} className="nft">◆ {n}</span>)}</div>}
      <div className="insp-sec">性格 · Traits</div>
      <Bar label="野心" v={a.traits.ambition} /><Bar label="社交" v={a.traits.sociability} /><Bar label="冒险" v={a.traits.risk} /><Bar label="创造" v={a.traits.creativity} /><Bar label="节俭" v={a.traits.frugality} />
      <div className="insp-sec">记忆流 · Memory</div>
      {a.memory.slice(0, 5).map((m, i) => <div key={i} className="insp-mem"><span className="tk">e{m.e}</span> {m.t}</div>)}
      {a.memory.length === 0 && <div className="insp-mem tk">尚无记忆</div>}
    </div>
  );
}

export default function WorldView() {
  useLiving((s) => s.version);
  const ocId = useLiving.getState().oc?.id ?? null;
  const worldRunning = useLiving((s) => s.worldRunning);
  const setRun = useLiving((s) => s.setWorldRunning);
  const tick = useLiving((s) => s.tickWorld);
  const addAgent = useLiving((s) => s.addAgentToWorld);
  const reseed = useLiving((s) => s.reseedWorld);
  const liveMode = useLiving((s) => s.liveMode);
  const [live, setLive] = useState(false);
  const [controlId, setControlId] = useState<string | null>(null);
  const [inspId, setInspId] = useState<string | null>(null);
  const [feedOpen, setFeedOpen] = useState(true);
  const [, setTalkVer] = useState(0);

  const ref = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Set<string>>(new Set());
  const apos = useRef(new Map<string, PP>());
  const cam = useRef({ cx: MAP_W * 0.55, cy: MAP_H * 0.15 });
  const view = useRef({ sx: 0, sy: 0 });
  const mapImg = useRef<CanvasImageSource | null>(null);
  const collide = useRef<{ d: Uint8ClampedArray; cw: number; ch: number; cs: number } | null>(null);
  const ocSprite = useRef<HTMLImageElement | null>(null);
  const npcSprites = useRef<HTMLImageElement[]>([]);
  const named = useRef<Record<string, HTMLImageElement>>({});
  const ctrlRef = useRef<string | null>(null); ctrlRef.current = controlId ?? ocId;
  const nearRef = useRef<string | null>(null);
  const lastT = useRef(0);
  const liveLines = useRef<Map<string, string>>(new Map());  // 真 LLM 气泡台词缓存
  const liveRef = useRef(false); liveRef.current = liveMode.cognition === 'live';
  const talkRef = useRef<{ withId: string; lines: { name: string; text: string }[]; i: number } | null>(null);
  const bumpTalk = () => setTalkVer((v) => v + 1);

  useEffect(() => { setRun(true); }, [setRun]);
  useEffect(() => { if (!worldRunning) return; const iv = setInterval(() => { void tick(); }, 900); return () => clearInterval(iv); }, [worldRunning, tick]);

  useEffect(() => {
    const t = new Image(); t.src = BASE + 'sprites/' + MAP_SRC; t.onload = () => {
      // 碰撞图:原图降采样(白/透明 = 阻挡,玩家只在真实陆地走)
      const cs = 8, cw = Math.ceil(MAP_W / cs), ch = Math.ceil(MAP_H / cs);
      const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
      const cx2 = cc.getContext('2d'); if (cx2) { cx2.drawImage(t, 0, 0, MAP_W, MAP_H, 0, 0, cw, ch); collide.current = { d: cx2.getImageData(0, 0, cw, ch).data, cw, ch, cs }; }
      // 渲染源:把白/透明填成草绿 → 去掉白色、合并成无缝大地图
      const fc = document.createElement('canvas'); fc.width = MAP_W; fc.height = MAP_H;
      const fx = fc.getContext('2d');
      if (fx) {
        fx.fillStyle = '#5b9c4a'; fx.fillRect(0, 0, MAP_W, MAP_H); fx.drawImage(t, 0, 0);
        try { const id = fx.getImageData(0, 0, MAP_W, MAP_H), d = id.data; for (let i = 0; i < d.length; i += 4) if (d[i] > 228 && d[i + 1] > 228 && d[i + 2] > 228) { d[i] = 91; d[i + 1] = 156; d[i + 2] = 74; } fx.putImageData(id, 0, 0); } catch { /* taint 等异常则用原绿底图 */ }
        mapImg.current = fc;
      } else mapImg.current = t;
    };
    const r = new Image(); r.src = BASE + 'sprites/chr-red_normal.png'; ocSprite.current = r;
    npcSprites.current = NPC_CHARS.map((n) => { const im = new Image(); im.src = BASE + 'sprites/chr-' + n + '.png'; return im; });
    for (const nm in NAMED_SPRITE) { const im = new Image(); im.src = BASE + 'sprites/chr-' + NAMED_SPRITE[nm] + '.png'; named.current[nm] = im; }
  }, []);

  // 真 LLM 气泡:开启「真 LLM」后,逐个角色每 ~3s 取一句 Claude 生成的主题台词,缓存覆盖离线库
  useEffect(() => {
    if (liveMode.cognition !== 'live') { liveLines.current.clear(); return; }
    const w0 = useLiving.getState().world; if (!w0) return;
    const names = Object.keys(LINE_BANKS); let k = 0; let stop = false;
    const pump = async () => {
      if (stop) return;
      const w = useLiving.getState().world;
      const nm = names[k % names.length]; k++;
      const a = w && Object.values(w.agents).find((x) => x.name === nm);
      if (a) { const line = await liveSay(a.name, a.bio); if (line && !stop) { liveLines.current.set(nm, line); } }
    };
    const iv = setInterval(pump, 3000); void pump();
    return () => { stop = true; clearInterval(iv); };
  }, [liveMode.cognition]);

  // 离线对话(无后端/未开真 LLM 时):用台词库拼一小段小智×伙伴的对话
  const offlineTalk = (meName: string, fr: Agent): { name: string; text: string }[] => {
    const fb = LINE_BANKS[fr.name] || ['嗨~'], s = Math.floor(Date.now() / 1000);
    return [
      { name: meName, text: `${fr.name},今天过得怎样?` },
      { name: fr.name, text: fb[s % fb.length] },
      { name: meName, text: '哈哈,那走啦,一起去恰个饭?' },
      { name: fr.name, text: fb[(s + 2) % fb.length] },
    ];
  };
  const startTalk = async (friendId: string) => {
    const w = useLiving.getState().world; if (!w) return;
    const fr = w.agents[friendId]; const me = (ctrlRef.current && w.agents[ctrlRef.current]) || null; if (!fr || !me) return;
    talkRef.current = { withId: friendId, lines: [{ name: me.name, text: '…' }], i: 0 }; bumpTalk();
    let lines: { name: string; text: string }[] | null = null;
    if (liveRef.current) lines = await liveTalk({ name: me.name, bio: me.bio }, { name: fr.name, bio: fr.bio });
    if (!lines) lines = offlineTalk(me.name, fr);
    talkRef.current = { withId: friendId, lines, i: 0 }; bumpTalk();
  };

  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) { keys.current.add(k); e.preventDefault(); }
      if (k === ' ') {
        if (talkRef.current) { talkRef.current.i++; if (talkRef.current.i >= talkRef.current.lines.length) talkRef.current = null; bumpTalk(); }
        else if (nearRef.current) void startTalk(nearRef.current);
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; const dpr = window.devicePixelRatio || 1;
    const walkable = (mx: number, my: number) => {
      const c = collide.current; if (!c) return true;
      const gx = Math.max(0, Math.min(c.cw - 1, mx / c.cs | 0)), gy = Math.max(0, Math.min(c.ch - 1, my / c.cs | 0));
      const i = (gy * c.cw + gx) * 4; if (c.d[i + 3] < 30) return false;
      return !(c.d[i] > 232 && c.d[i + 1] > 232 && c.d[i + 2] > 232);
    };
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - (lastT.current || now)) / 1000); lastT.current = now;
      const w = useLiving.getState().world;
      const VW = canvas.clientWidth, VH = canvas.clientHeight;
      if (canvas.width !== VW * dpr || canvas.height !== VH * dpr) { canvas.width = VW * dpr; canvas.height = VH * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, VW, VH);
      try {
      const ctrl = ctrlRef.current;
      // 1. 位置更新
      if (w) for (const id of w.order) {
        const a = w.agents[id]; if (!a) continue; const loc = locById[a.loc]; if (!loc) continue;
        const anchor = posOf(loc.id);
        let pp = apos.current.get(id);
        if (!pp) { pp = { mx: anchor[0] * MAP_W, my: anchor[1] * MAP_H, dir: 'down', moving: false }; apos.current.set(id, pp); }
        if (id === ctrl) {
          let vx = 0, vy = 0; const K = keys.current;
          if (!talkRef.current) { // 对话中冻结移动
            if (K.has('a') || K.has('arrowleft')) vx -= 1; if (K.has('d') || K.has('arrowright')) vx += 1;
            if (K.has('w') || K.has('arrowup')) vy -= 1; if (K.has('s') || K.has('arrowdown')) vy += 1;
          }
          const len = Math.hypot(vx, vy) || 1; const nx = pp.mx + (vx / len) * SPEED * dt, ny = pp.my + (vy / len) * SPEED * dt;
          if (walkable(nx, ny)) { pp.mx = nx; pp.my = ny; }
          else { if (walkable(nx, pp.my)) pp.mx = nx; if (walkable(pp.mx, ny)) pp.my = ny; } // 贴墙滑动
          pp.mx = Math.max(8, Math.min(MAP_W - 8, pp.mx)); pp.my = Math.max(8, Math.min(MAP_H - 8, pp.my));
          pp.moving = vx !== 0 || vy !== 0;
          if (pp.moving) { pp.dir = Math.abs(vx) > Math.abs(vy) ? 'side' : (vy < 0 ? 'up' : 'down'); pp.flip = vx > 0; }
        } else {
          const jx = (hue('x' + id) / 360 - 0.5) * 44, jy = (hue('y' + id) / 360 - 0.5) * 44;
          const tx = anchor[0] * MAP_W + jx, ty = anchor[1] * MAP_H + jy, ddx = tx - pp.mx, ddy = ty - pp.my, dist = Math.hypot(ddx, ddy);
          if (dist > 2) { const step = Math.min(dist, NPC_SPEED * dt); pp.mx += (ddx / dist) * step; pp.my += (ddy / dist) * step; pp.moving = dist > 3; pp.dir = Math.abs(ddx) > Math.abs(ddy) ? 'side' : (ddy < 0 ? 'up' : 'down'); pp.flip = ddx > 0; }
          else pp.moving = false;
        }
      }
      // 2. 相机跟随 + 源切片
      const cpp = ctrl ? apos.current.get(ctrl) : null;
      if (cpp) { cam.current.cx = cpp.mx; cam.current.cy = cpp.my; }
      const sw = VW / MAP_SCALE, sh = VH / MAP_SCALE;
      const srcX = Math.max(0, Math.min(MAP_W - sw, cam.current.cx - sw / 2));
      const srcY = Math.max(0, Math.min(MAP_H - sh, cam.current.cy - sh / 2));
      view.current.sx = srcX; view.current.sy = srcY;
      const SX = (mx: number) => (mx - srcX) * MAP_SCALE, SY = (my: number) => (my - srcY) * MAP_SCALE;
      // 3. 底图(只画可见切片)
      ctx.fillStyle = '#0b0b0d'; ctx.fillRect(0, 0, VW, VH);
      const tm = mapImg.current;
      if (tm) { ctx.imageSmoothingEnabled = false; ctx.drawImage(tm, srcX, srcY, sw, sh, 0, 0, VW, VH); }
      // 4. 昼夜
      const epoch = w ? w.epoch : 12, ph = (((epoch % 24) + 24) % 24) / 24, sun = Math.max(0, Math.sin(ph * Math.PI));
      const night = Math.max(0, 1 - sun * 1.15), golden = sun > 0.02 ? Math.max(0, 1 - Math.abs(sun - 0.25) / 0.25) : 0;
      if (night > 0.01) { ctx.fillStyle = `rgba(14,18,54,${(night * 0.5).toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }
      if (golden > 0.01) { ctx.fillStyle = `rgba(255,150,60,${(golden * 0.14).toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }
      // 5. 地点标签
      ctx.textAlign = 'center'; ctx.font = '12px ui-monospace, monospace';
      for (const l of LOCATIONS) { const p = posOf(l.id); const x = SX(p[0] * MAP_W), y = SY(p[1] * MAP_H) - TILE * 1.7;
        if (x < -40 || x > VW + 40) continue;
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.88)'; ctx.strokeText(l.name, x, y); ctx.fillStyle = '#ffd24d'; ctx.fillText(l.name, x, y); }
      if (!w) { raf = requestAnimationFrame(draw); return; }
      // 6. 最近可交互居民
      let near: string | null = null;
      if (cpp && ctrl) { let bd = INTERACT_R * INTERACT_R; for (const id of w.order) { if (id === ctrl) continue; const p = apos.current.get(id); if (!p) continue; const d = (p.mx - cpp.mx) ** 2 + (p.my - cpp.my) ** 2; if (d < bd) { bd = d; near = id; } } }
      nearRef.current = near;
      // 7. 居民(按 y 排序)
      const t = Math.floor(now / 180);
      const order = [...w.order].sort((a, b) => (apos.current.get(a)?.my ?? 0) - (apos.current.get(b)?.my ?? 0));
      for (const id of order) {
        const a = w.agents[id]; const pp = apos.current.get(id); if (!a || !pp) continue;
        const sx = SX(pp.mx), sy = SY(pp.my);
        if (sx < -TILE * 2 || sx > VW + TILE * 2 || sy < -TILE * 3 || sy > VH + TILE * 2) continue;
        const isOc = id === ocId, isCtrl = id === ctrl, isNear = id === near;
        const cW = TILE * 1.05, cH = cW * 2;
        const fr = FRAME[pp.dir] || FRAME.down; const fi = pp.moving ? fr.walk[t % 2] : fr.idle;
        const img = isOc ? ocSprite.current : (named.current[a.name] || npcSprites.current[hue(id) % npcSprites.current.length]);
        const flip = pp.flip && pp.dir === 'side';
        ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(sx, sy + 1, cW * 0.34, cW * 0.13, 0, 0, 7); ctx.fill();
        if (isCtrl) { ctx.strokeStyle = '#ff2d2d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx, sy - cH * 0.36, cW * 0.85, 0, 7); ctx.stroke(); }
        else if (isNear) { ctx.strokeStyle = 'rgba(255,210,80,.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy - cH * 0.36, cW * 0.8, 0, 7); ctx.stroke(); }
        if (img && img.complete && img.naturalWidth) {
          ctx.imageSmoothingEnabled = false; const dy0 = sy + 2 - cH;
          if (flip) { ctx.save(); ctx.translate(sx + cW / 2, dy0); ctx.scale(-1, 1); ctx.drawImage(img, fi * 16, 0, 16, 32, 0, 0, cW, cH); ctx.restore(); }
          else ctx.drawImage(img, fi * 16, 0, 16, 32, sx - cW / 2, dy0, cW, cH);
        }
        const label = a.name + (isOc ? ' ★' : '');
        ctx.font = (isCtrl ? '600 ' : '') + '11px ui-monospace, monospace';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.85)'; ctx.strokeText(label, sx, sy + 14);
        ctx.fillStyle = isCtrl ? '#ff2d2d' : 'rgba(245,245,247,.95)'; ctx.fillText(label, sx, sy + 14);
        if (isNear) { ctx.fillStyle = 'rgba(255,210,80,.95)'; ctx.font = '10px ui-monospace, monospace'; ctx.fillText('空格 · 交互', sx, sy - cH - 4); }
        // 头顶对话气泡(命名角色:小智 + 5 个新加坡留学伙伴)
        const bank = LINE_BANKS[a.name];
        if (bank && bank.length) {
          const bline = (liveRef.current && liveLines.current.get(a.name)) || bank[(Math.floor(now / 9000) + hue(id)) % bank.length];
          if (talkRef.current?.withId !== id) bubble(ctx, sx, sy - cH - (isNear ? 18 : 6), bline);
        }
      }
      } catch { /* 单帧出错不冻结 */ }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ocId]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const w = useLiving.getState().world; if (!w) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = view.current.sx + (e.clientX - rect.left) / MAP_SCALE, my = view.current.sy + (e.clientY - rect.top) / MAP_SCALE;
    let best: string | null = null, bd = 26 * 26;
    for (const id of w.order) { const p = apos.current.get(id); if (!p) continue; const d = (p.mx - mx) ** 2 + (p.my - 16 - my) ** 2; if (d < bd) { bd = d; best = id; } }
    if (best) { setControlId(best); setInspId(best); }
  };

  const w = useLiving.getState().world;
  const ctrl = controlId ?? ocId;
  const ctrlA = w && ctrl ? w.agents[ctrl] : undefined;
  const inspA = w && inspId ? w.agents[inspId] : undefined;

  return (
    <section className="world-fs">
      <canvas ref={ref} className="world-canvas2" onClick={onClick} tabIndex={0} />

      <div className="hud hud-tl">
        <div className="hud-ctrl">控制中 · <b>{ctrlA?.name ?? '—'}</b>{ctrl === ocId && ' ★'}</div>
        <div className="hud-keys">WASD / 方向键 移动 · 点居民接管 · 靠近按空格交互</div>
      </div>

      <div className="hud hud-tr">
        <span className="wstat sm"><i>EPOCH</i> {w?.epoch ?? 0}</span>
        <span className="wstat sm"><i>居民</i> {w ? w.order.length : 0}</span>
        <span className="wstat sm hot"><i>供给</i> {(w ? Math.round(w.stats.supply) : 0)}◈</span>
        <button className="hud-btn" onClick={() => setRun(!worldRunning)}>{worldRunning ? '⏸' : '▶'}</button>
        <button className="hud-btn" onClick={() => { const n = window.prompt('克隆一个新居民:', '@new_soul'); if (n) addAgent(n); }}>＋人格</button>
        <button className="hud-btn" onClick={() => { reseed(); apos.current.clear(); }}>↻ 重置</button>
        <button className="hud-btn" onClick={() => setControlId(ocId)}>回到小智 ★</button>
        <button className="hud-btn live" onClick={() => setLive(true)}>⚡ 真 LLM/链</button>
      </div>

      <div className={'hud hud-feed' + (feedOpen ? '' : ' min')}>
        <div className="hud-feed-head" onClick={() => setFeedOpen(!feedOpen)}>实时社交流 · THE FEED <span>{w?.feed.length ?? 0}{feedOpen ? ' ▾' : ' ▸'}</span></div>
        {feedOpen && <div className="hud-feed-body">
          {(w?.feed ?? []).slice(0, 14).map((p) => (
            <div key={p.id} className={'wpost' + (p.ev ? ' ev-' + p.ev.kind : '')}>
              <div className="wrow"><span className="wav" style={{ background: `hsl(${hue(p.agentId)},45%,55%)` }} /><b>{p.name}</b><span className="wact">{actionCN[p.action]}</span></div>
              <div className="wtext">{p.text}</div>
            </div>
          ))}
          {(!w || w.feed.length === 0) && <div className="world-empty">世界正在醒来…</div>}
        </div>}
      </div>

      {inspA && (
        <div className="hud hud-insp">
          <button className="hud-x" onClick={() => setInspId(null)}>✕</button>
          <Inspector a={inspA} isOc={inspId === ocId} />
        </div>
      )}

      {(() => {
        const tk = talkRef.current; const ln = tk && tk.lines[tk.i]; if (!tk || !ln) return null;
        return (
          <div className="hud hud-talk" onClick={() => { tk.i++; if (tk.i >= tk.lines.length) talkRef.current = null; bumpTalk(); }}>
            <div className="talk-name">{ln.name}{liveRef.current && ' · ✦ Claude'}</div>
            <div className="talk-text">{ln.text}</div>
            <div className="talk-hint">空格 / 点击 继续 ▸</div>
          </div>
        );
      })()}

      {live && <WorldGoLive onClose={() => setLive(false)} />}
    </section>
  );
}
