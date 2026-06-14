import { useEffect, useRef, useState } from 'react';
import { useLiving } from '../store/useLiving';
import { LOCATIONS, locById, ARCHE_CN } from '../sim/data';
import { actionCN } from '../sim/text';
import type { Agent } from '../sim/types';
import WorldGoLive from './WorldGoLive';

// Pokémon-FireRed 风瓦片坐标(pkmn-overworld.png,16px 瓦片,40×36 格)
const TILE = 16;
const TOWN_COLS = 32, TOWN_ROWS = 32;
const T = {
  grass: [15, 30], wild: [0, 5], bush: [0, 4], flower: [0, 7],
  path: [13, 3], log: [4, 5], rock: [9, 5],
};
const HOUSE = { c: 7, r: 0, w: 4, h: 4 };

function tileHash(c: number, r: number): number {
  let h = (Math.imul(c, 73856093) ^ Math.imul(r, 19349663)) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return (h % 1000) / 1000;
}

// 用 Overworld 瓦片程序化铺一张 Pokémon 小镇:草地铺底 + 放射土路 + 每个地点一栋房子 + 散落植被
function buildPkmnTown(ts: HTMLImageElement, locs: { x: number; y: number }[]): HTMLCanvasElement {
  const COLS = TOWN_COLS, ROWS = TOWN_ROWS;
  const cv = document.createElement('canvas'); cv.width = COLS * TILE; cv.height = ROWS * TILE;
  const cx = cv.getContext('2d'); if (!cx) return cv;
  cx.imageSmoothingEnabled = false;
  const blit = (t: number[], dc: number, dr: number) =>
    cx.drawImage(ts, t[0] * TILE, t[1] * TILE, TILE, TILE, dc * TILE, dr * TILE, TILE, TILE);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) blit(T.grass, c, r); // 1. 草地铺底
  const occ = new Uint8Array(COLS * ROWS);
  const set = (c: number, r: number, v: number) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) occ[r * COLS + c] = v; };
  const anchors = locs.map((l) => [Math.round(l.x * COLS), Math.round(l.y * ROWS)] as [number, number]);
  const cc = COLS >> 1, cr = ROWS >> 1;
  // 2. 土路:每个地点连到中心广场(L 形,2 格宽)
  for (const [ac, ar] of anchors) {
    for (let c = Math.min(ac, cc); c <= Math.max(ac, cc); c++) { blit(T.path, c, ar); set(c, ar, 1); blit(T.path, c, ar + 1); set(c, ar + 1, 1); }
    for (let r = Math.min(ar, cr); r <= Math.max(ar, cr); r++) { blit(T.path, cc, r); set(cc, r, 1); blit(T.path, cc + 1, r); set(cc + 1, r, 1); }
  }
  // 3. 房子:每个地点北侧(门朝下,agent 站门前)
  for (const [ac, ar] of anchors) {
    const hx = ac - 1, hy = ar - HOUSE.h;
    cx.drawImage(ts, HOUSE.c * TILE, HOUSE.r * TILE, HOUSE.w * TILE, HOUSE.h * TILE, hx * TILE, hy * TILE, HOUSE.w * TILE, HOUSE.h * TILE);
    for (let dr = 0; dr < HOUSE.h; dr++) for (let dc = 0; dc < HOUSE.w; dc++) set(hx + dc, hy + dr, 2);
  }
  // 4. 散落植被(避开路/房)
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (occ[r * COLS + c]) continue;
    const h = tileHash(c, r);
    if (h < 0.07) blit(T.wild, c, r);
    else if (h < 0.115) blit(T.bush, c, r);
    else if (h < 0.15) blit(T.flower, c, r);
    else if (h < 0.165) blit(T.rock, c, r);
    else if (h < 0.173) blit(T.log, c, r);
  }
  return cv;
}
function hue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}
function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

interface Pos { px: number; py: number }
interface Line { ax: number; ay: number; bx: number; by: number; life: number }

function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div className="ibar">
      <div className="ibar-lab"><span>{label}</span><span>{Math.round(v * 100)}</span></div>
      <div className="ibar-track"><span style={{ width: v * 100 + '%' }} /></div>
    </div>
  );
}

function Inspector({ a, isOc }: { a: Agent; isOc: boolean }) {
  const rels = Object.entries(a.rel).filter(([, v]) => Math.abs(v) > 0.05).sort((x, y) => y[1] - x[1]).slice(0, 4);
  return (
    <div className="insp">
      <div className="insp-top">
        <span className="insp-av" style={{ background: `hsl(${hue(a.id)},45%,55%)` }} />
        <div>
          <div className="insp-nm">{a.name}{isOc && <span className="insp-you"> ★ 你的 OC</span>}</div>
          <div className="insp-hd">{a.handle} · {ARCHE_CN[a.arche]} · 「{a.mood}」</div>
        </div>
      </div>
      <div className="insp-wallet">{a.wallet.slice(0, 18)}…</div>
      <div className={'insp-bal ' + (a.balance < 0 ? 'neg' : 'pos')}>{a.balance.toFixed(2)} <small>◈</small></div>
      {a.nfts.length > 0 && <div className="insp-nfts">{a.nfts.slice(-6).map((n, i) => <span key={i} className="nft">◆ {n}</span>)}</div>}
      <div className="insp-sec">性格 · Traits</div>
      <Bar label="野心" v={a.traits.ambition} /><Bar label="社交" v={a.traits.sociability} /><Bar label="冒险" v={a.traits.risk} />
      <Bar label="创造" v={a.traits.creativity} /><Bar label="节俭" v={a.traits.frugality} />
      <div className="insp-sec">需求 · Needs</div>
      <div className="needs"><Bar label="精力" v={a.needs.energy} /><Bar label="金钱" v={a.needs.money} /><Bar label="社交" v={a.needs.social} /><Bar label="声望" v={a.needs.fame} /></div>
      {rels.length > 0 && <><div className="insp-sec">关系网 · Graph</div>
        {rels.map(([rid, v]) => <div key={rid} className="insp-rel"><span>{rid.split('#')[0].replace('@', '')}</span><span style={{ color: v > 0 ? '#e3a948' : '#ff2d2d' }}>{v > 0 ? '+' : ''}{v.toFixed(2)}</span></div>)}
      </>}
      <div className="insp-sec">记忆流 · Memory</div>
      {a.memory.slice(0, 6).map((m, i) => <div key={i} className="insp-mem"><span className="tk">e{m.e}</span> {m.t}</div>)}
      {a.memory.length === 0 && <div className="insp-mem tk">尚无记忆</div>}
    </div>
  );
}

export default function WorldView() {
  useLiving((s) => s.version);
  const ocId = useLiving.getState().oc?.id;
  const worldRunning = useLiving((s) => s.worldRunning);
  const worldSpeed = useLiving((s) => s.worldSpeed);
  const setRun = useLiving((s) => s.setWorldRunning);
  const setSpeed = useLiving((s) => s.setWorldSpeed);
  const tick = useLiving((s) => s.tickWorld);
  const addAgent = useLiving((s) => s.addAgentToWorld);
  const reseed = useLiving((s) => s.reseedWorld);
  const [sel, setSel] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const ref = useRef<HTMLCanvasElement>(null);
  const pos = useRef(new Map<string, Pos>());
  const lines = useRef<Line[]>([]);
  const lastEpoch = useRef(-1);
  const sprite = useRef<HTMLImageElement | null>(null);
  const townMap = useRef<HTMLCanvasElement | null>(null);
  const selRef = useRef<string | null>(null);
  selRef.current = sel ?? ocId ?? null;

  useEffect(() => {
    if (!worldRunning) return;
    const iv = setInterval(() => { void tick(); }, 1300 - worldSpeed * 110);
    return () => clearInterval(iv);
  }, [worldRunning, worldSpeed, tick]);

  // 角色精灵:Pokémon-FireRed 风训练师(pkmn-chars.png,16px 帧 / 17px 步距,6 变体)
  useEffect(() => { const img = new Image(); img.src = '/sprites/pkmn-chars.png'; sprite.current = img; }, []);

  // 小镇底图:加载 Overworld 瓦片,程序化铺一张 Pokémon 小镇(草地/土路/房子/植被)
  useEffect(() => {
    let cancelled = false;
    const ts = new Image(); ts.src = '/sprites/pkmn-overworld.png';
    ts.onload = () => { if (!cancelled) townMap.current = buildPkmnTown(ts, LOCATIONS); };
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; const dpr = window.devicePixelRatio || 1;
    const draw = () => {
      const w = useLiving.getState().world;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      try {
      // 小镇底图:完整 AI 小镇地图(等比 contain,居中正方形)
      const tm = townMap.current, src = tm ? tm.width : 640;
      const mapSize = Math.min(W, H), ox = (W - mapSize) / 2, oy = (H - mapSize) / 2;
      if (tm) { ctx.imageSmoothingEnabled = false; ctx.drawImage(tm, 0, 0, src, src, ox, oy, mapSize, mapSize); }
      else { ctx.fillStyle = '#0c0c0e'; ctx.fillRect(ox, oy, mapSize, mapSize); }
      const MX = (nx: number) => ox + nx * mapSize, MY = (ny: number) => oy + ny * mapSize;
      LOCATIONS.forEach((l) => {
        const x = MX(l.x), y = MY(l.y) - HOUSE.h * (mapSize / TOWN_COLS) - 6;
        ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.85)'; ctx.strokeText(l.name, x, y);
        ctx.fillStyle = 'rgba(245,245,247,.9)'; ctx.fillText(l.name, x, y);
      });
      if (!w) { raf = requestAnimationFrame(draw); return; }
      if (w.epoch !== lastEpoch.current) {
        lastEpoch.current = w.epoch;
        for (const p of w.feed) {
          if (p.epoch !== w.epoch || !p.ev || p.ev.kind !== 'transfer') continue;
          const from = w.order.map((id) => w.agents[id]).find((o) => o.name === p.ev!.fromName);
          const to = w.order.map((id) => w.agents[id]).find((o) => o.name === p.ev!.toName);
          const pf = from && pos.current.get(from.id); const pt = to && pos.current.get(to.id);
          if (pf && pt) lines.current.push({ ax: pf.px, ay: pf.py, bx: pt.px, by: pt.py, life: 1 });
        }
      }
      for (let i = lines.current.length - 1; i >= 0; i--) {
        const L = lines.current[i];
        ctx.strokeStyle = `rgba(255,45,45,${L.life * 0.55})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(L.ax, L.ay); ctx.lineTo(L.bx, L.by); ctx.stroke();
        L.life -= 0.02; if (L.life <= 0) lines.current.splice(i, 1);
      }
      for (const id of w.order) {
        const a = w.agents[id]; if (!a) continue; const loc = locById[a.loc]; if (!loc) continue;
        const jx = (hue('x' + id) / 360 - 0.5) * 56, jy = (hue('y' + id) / 360 - 0.5) * 56;
        const tx = MX(loc.x) + jx, ty = MY(loc.y) + jy;
        let pp = pos.current.get(id); if (!pp) { pp = { px: tx, py: ty }; pos.current.set(id, pp); }
        pp.px += (tx - pp.px) * 0.08; pp.py += (ty - pp.py) * 0.08;
        const isOc = id === ocId, isSel = id === selRef.current;
        const dx = tx - pp.px, dy = ty - pp.py, moving = Math.abs(dx) + Math.abs(dy) > 0.6;
        // Pokémon 训练师精灵:方向(下0/左3/上6,右=左翻转)× 3 帧行走;6 变体
        const tDest = mapSize / TOWN_COLS, charPx = tDest * 1.8;
        let dirBase = 0, flip = false;
        if (moving) {
          if (Math.abs(dx) > Math.abs(dy)) { dirBase = 3; flip = dx > 0; }
          else dirBase = dy < 0 ? 6 : 0;
        }
        const frame = moving ? Math.floor(Date.now() / 180) % 3 : 1;
        const sxF = (dirBase + frame) * 17, syF = (hue(id) % 6) * 17;
        // 影子
        ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(pp.px, pp.py + 4, charPx * 0.3, charPx * 0.11, 0, 0, 7); ctx.fill();
        // 选中/破产环(ZEALWISH 红)
        if (isSel) { ctx.strokeStyle = '#ff2d2d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pp.px, pp.py - charPx * 0.32, charPx * 0.66, 0, 7); ctx.stroke(); }
        else if (a.balance < 0) { ctx.strokeStyle = 'rgba(255,45,45,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pp.px, pp.py - charPx * 0.32, charPx * 0.6, 0, 7); ctx.stroke(); }
        // 精灵(脚底对齐 pp.py)
        const img = sprite.current;
        if (img && img.complete && img.naturalWidth) {
          ctx.imageSmoothingEnabled = false;
          const dy0 = pp.py - charPx + 3;
          if (flip) { ctx.save(); ctx.translate(pp.px + charPx / 2, dy0); ctx.scale(-1, 1); ctx.drawImage(img, sxF, syF, 16, 16, 0, 0, charPx, charPx); ctx.restore(); }
          else ctx.drawImage(img, sxF, syF, 16, 16, pp.px - charPx / 2, dy0, charPx, charPx);
        } else {
          ctx.fillStyle = `hsl(${hue(id)},42%,52%)`; roundRect(ctx, pp.px - 8, pp.py - 8, 16, 16, 3); ctx.fill();
        }
        const label = a.name + (isOc ? ' ★' : '');
        ctx.font = (isSel ? '600 ' : '') + '10px ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.8)'; ctx.strokeText(label, pp.px, pp.py + 13);
        ctx.fillStyle = isSel ? '#ff2d2d' : 'rgba(245,245,247,.92)'; ctx.fillText(label, pp.px, pp.py + 13);
      }
      } catch { /* 单帧出错不冻结世界 */ }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ocId]);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const w = useLiving.getState().world; if (!w) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let best: string | null = null, bd = 26 * 26;
    for (const id of w.order) {
      const p = pos.current.get(id); if (!p) continue;
      const d = (p.px - mx) ** 2 + (p.py - my) ** 2;
      if (d < bd) { bd = d; best = id; }
    }
    if (best) setSel(best);
  };

  const w = useLiving.getState().world;
  const selId = sel ?? ocId ?? null;
  const selAgent = w && selId ? w.agents[selId] : undefined;
  const Stat = ({ k, v, hot }: { k: string; v: string | number; hot?: boolean }) => (
    <div className="wstat"><div className="wk">{k}</div><div className={'wv' + (hot ? ' hot' : '')}>{v}</div></div>
  );

  return (
    <section className="observatory">
      <div className="obs-statbar">
        <Stat k="纪元 EPOCH" v={w?.epoch ?? 0} />
        <Stat k="居民 AGENTS" v={w ? w.order.length : 0} />
        <Stat k="总供给 SUPPLY" v={(w ? Math.round(w.stats.supply) : 0) + '◈'} hot />
        <Stat k="NFT 铸造" v={w?.stats.nftCount ?? 0} />
        <Stat k="破产 BANKRUPT" v={w?.stats.bankruptCount ?? 0} />
        <div className="obs-hint">★ 你的 OC · 点地图任意人格看档案</div>
      </div>

      <div className="obs-controls">
        <button className="btn primary" onClick={() => setRun(!worldRunning)}>{worldRunning ? '⏸ 暂停' : '▶ 运行世界'}</button>
        <button className="btn" onClick={() => void tick()}>⏭ 单步</button>
        <div className="speed"><span>速度</span><input type="range" min={1} max={10} value={worldSpeed} onChange={(e) => setSpeed(+e.target.value)} /></div>
        <button className="btn ghost" onClick={() => { const n = window.prompt('克隆一个新居民进世界(名字或 @handle):', '@new_soul'); if (n) addAgent(n); }}>＋ 克隆人格</button>
        <button className="btn ghost" onClick={() => reseed()}>↻ 重置世界</button>
        <div className="spacer" />
        <span className="mode-tag">大脑:<b>本地引擎(离线)</b> · 链:<b>模拟</b></span>
        <button className="btn" onClick={() => setLive(true)}>⚡ 切换真 LLM / 真链 ›</button>
      </div>

      <div className="world-grid3">
        <div className="map-wrap"><canvas ref={ref} className="worldcanvas" onClick={onCanvasClick} /></div>
        <div className="world-feed">
          <div className="col-head">实时社交流 · The Feed <span className="cnt">{w?.feed.length ?? 0} 条</span></div>
          {(w?.feed ?? []).slice(0, 24).map((p) => (
            <div key={p.id} className={'wpost' + (p.ev ? ' ev-' + p.ev.kind : '')}>
              <div className="wrow">
                <span className="wav" style={{ background: `hsl(${hue(p.agentId)},45%,55%)` }} />
                <b>{p.name}</b><span className="whandle">{p.handle}</span><span className="wact">{actionCN[p.action]}</span>
              </div>
              <div className="wtext">{p.text}</div>
              {p.ev && <div className="wev">⛓ {p.ev.kind === 'transfer' ? `${p.ev.fromName} → ${p.ev.toName} 转账 ${p.ev.amount}◈` : p.ev.kind === 'mint' ? `${p.ev.fromName} 铸造《${p.ev.nft}》` : `${p.ev.fromName} 破产 · ${p.ev.balance?.toFixed(2)}◈`}</div>}
            </div>
          ))}
          {(!w || w.feed.length === 0) && <div className="world-empty">点「▶ 运行世界」,看你的 OC 和居民们活起来。</div>}
        </div>
        <div className="world-insp">
          <div className="col-head">人格档案 · Inspector</div>
          {selAgent ? <Inspector a={selAgent} isOc={selId === ocId} /> : <div className="world-empty">点地图上的人格查看档案。</div>}
        </div>
      </div>

      {live && <WorldGoLive onClose={() => setLive(false)} />}
    </section>
  );
}
