import { useEffect, useRef, useState } from 'react';
import { useLiving } from '../store/useLiving';
import { LOCATIONS, locById, ARCHE_CN } from '../sim/data';
import { actionCN } from '../sim/text';
import type { Agent } from '../sim/types';
import WorldGoLive from './WorldGoLive';

interface TownData {
  tilewidth: number; width: number; height: number;
  tilesets: { firstgid?: number; columns?: number }[];
  layers: { type: string; data?: number[] }[];
}
// 把 AI 小镇的 Tiled 图层(terrain/bridge/deco)合成为一张缓存小镇底图
function buildTown(tileset: HTMLImageElement, data: TownData): HTMLCanvasElement {
  const T = data.tilewidth, cols = data.width, rows = data.height;
  const tsCols = data.tilesets[0].columns || Math.floor(tileset.naturalWidth / T);
  const first = data.tilesets[0].firstgid || 1;
  const cv = document.createElement('canvas'); cv.width = cols * T; cv.height = rows * T;
  const cx = cv.getContext('2d'); if (!cx) return cv;
  cx.imageSmoothingEnabled = false;
  for (const layer of data.layers) {
    if (layer.type !== 'tilelayer' || !layer.data) continue;
    const d = layer.data;
    for (let i = 0; i < d.length; i++) {
      const raw = d[i]; if (!raw) continue;
      const gid = (raw & 0x1fffffff) - first; if (gid < 0) continue;
      cx.drawImage(tileset, (gid % tsCols) * T, Math.floor(gid / tsCols) * T, T, T, (i % cols) * T, Math.floor(i / cols) * T, T, T);
    }
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

  // 像素小人精灵图(AI 小镇同款 folk 角色集,32×32 网格,8 角色)
  useEffect(() => { const img = new Image(); img.src = '/sprites/folk.png'; sprite.current = img; }, []);

  // 小镇底图:加载 AI 小镇 tileset + tilemap,合成一张缓存底图(地面/路/房子/装饰)
  useEffect(() => {
    let cancelled = false;
    const ts = new Image(); ts.src = '/sprites/rpg-tileset.png';
    Promise.all([
      new Promise<HTMLImageElement>((res, rej) => { ts.onload = () => res(ts); ts.onerror = rej; }),
      fetch('/sprites/town.json').then((r) => r.json() as Promise<TownData>),
    ]).then(([img, data]) => { if (!cancelled) townMap.current = buildTown(img, data); }).catch(() => { /* 降级:无底图 */ });
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
        const x = MX(l.x), y = MY(l.y) - 26;
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
        const ci = hue(id) % 8, bx = (ci % 4) * 96, by = Math.floor(ci / 4) * 128;
        const rowOff = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 32 : 64) : (dy < 0 ? 96 : 0);
        const colOff = (moving ? Math.floor(Date.now() / 170) % 3 : 1) * 32;
        // 影子
        ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(pp.px, pp.py + 13, 10, 3.5, 0, 0, 7); ctx.fill();
        // 选中/破产环(ZEALWISH 红)
        if (isSel) { ctx.strokeStyle = '#ff2d2d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pp.px, pp.py + 2, 22, 0, 7); ctx.stroke(); }
        else if (a.balance < 0) { ctx.strokeStyle = 'rgba(255,45,45,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pp.px, pp.py + 2, 20, 0, 7); ctx.stroke(); }
        // 像素小人精灵
        const img = sprite.current;
        if (img && img.complete && img.naturalWidth) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, bx + colOff, by + rowOff, 32, 32, pp.px - 20, pp.py - 27, 40, 40);
        } else {
          ctx.fillStyle = `hsl(${hue(id)},42%,52%)`; roundRect(ctx, pp.px - 8, pp.py - 8, 16, 16, 3); ctx.fill();
        }
        const label = a.name + (isOc ? ' ★' : '');
        ctx.font = (isSel ? '600 ' : '') + '10px ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.8)'; ctx.strokeText(label, pp.px, pp.py + 26);
        ctx.fillStyle = isSel ? '#ff2d2d' : 'rgba(245,245,247,.92)'; ctx.fillText(label, pp.px, pp.py + 26);
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
