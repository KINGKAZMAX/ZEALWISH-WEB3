import { useEffect, useRef, useState } from 'react';
import { useLiving } from '../store/useLiving';
import { LOCATIONS, locById, ARCHE_CN } from '../sim/data';
import { actionCN } from '../sim/text';
import type { Agent } from '../sim/types';

const HEX: Record<string, string> = {
  '--jade': '#6cc2a0', '--amber': '#e3a948', '--coral': '#e07a5f',
  '--violet': '#a594d6', '--sky': '#74a8c4', '--red': '#d65a4e',
};
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

function Bar({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div className="ibar">
      <div className="ibar-lab"><span>{label}</span><span>{Math.round(v * 100)}</span></div>
      <div className="ibar-track"><span style={{ width: v * 100 + '%', background: color }} /></div>
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
      <div className="insp-sec">性格</div>
      <Bar label="野心" v={a.traits.ambition} color="#6cc2a0" />
      <Bar label="社交" v={a.traits.sociability} color="#6cc2a0" />
      <Bar label="冒险" v={a.traits.risk} color="#6cc2a0" />
      <Bar label="创造" v={a.traits.creativity} color="#6cc2a0" />
      <Bar label="节俭" v={a.traits.frugality} color="#6cc2a0" />
      <div className="insp-sec">需求</div>
      <Bar label="精力" v={a.needs.energy} color="#74a8c4" />
      <Bar label="金钱" v={a.needs.money} color="#74a8c4" />
      <Bar label="社交" v={a.needs.social} color="#74a8c4" />
      <Bar label="声望" v={a.needs.fame} color="#74a8c4" />
      {rels.length > 0 && <>
        <div className="insp-sec">关系网</div>
        {rels.map(([rid, v]) => <div key={rid} className="insp-rel"><span>{a.rel[rid] !== undefined ? rid.split('#')[0].replace('@', '') : rid}</span><span style={{ color: v > 0 ? '#6cc2a0' : '#d65a4e' }}>{v > 0 ? '+' : ''}{v.toFixed(2)}</span></div>)}
      </>}
      <div className="insp-sec">记忆流</div>
      {a.memory.slice(0, 6).map((m, i) => <div key={i} className="insp-mem"><span className="tk">e{m.e}</span> {m.t}</div>)}
      {a.memory.length === 0 && <div className="insp-mem tk">尚无记忆</div>}
    </div>
  );
}

export default function WorldView() {
  useLiving((s) => s.version);
  const ocId = useLiving.getState().oc?.id;
  const worldRunning = useLiving((s) => s.worldRunning);
  const setRun = useLiving((s) => s.setWorldRunning);
  const tick = useLiving((s) => s.tickWorld);
  const [sel, setSel] = useState<string | null>(null);

  const ref = useRef<HTMLCanvasElement>(null);
  const pos = useRef(new Map<string, Pos>());
  const lines = useRef<Line[]>([]);
  const lastEpoch = useRef(-1);
  const selRef = useRef<string | null>(null);
  selRef.current = sel ?? ocId ?? null;

  useEffect(() => {
    if (!worldRunning) return;
    const iv = setInterval(() => { void tick(); }, 700);
    return () => clearInterval(iv);
  }, [worldRunning, tick]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const dpr = window.devicePixelRatio || 1;
    const draw = () => {
      const w = useLiving.getState().world;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!w) { raf = requestAnimationFrame(draw); return; }
      LOCATIONS.forEach((l) => {
        const lx = l.x * W, ly = l.y * H, col = HEX[l.colorVar] || '#6cc2a0';
        const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 64);
        g.addColorStop(0, col + '22'); g.addColorStop(1, col + '00');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 64, 0, 7); ctx.fill();
        ctx.strokeStyle = col + '66'; ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.arc(lx, ly, 40, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = col + 'cc'; ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.fillText(l.name, lx, ly - 50);
      });
      if (w.epoch !== lastEpoch.current) {
        lastEpoch.current = w.epoch;
        for (const p of w.feed) {
          if (p.epoch !== w.epoch || !p.ev || p.ev.kind !== 'transfer') continue;
          const from = w.order.map((id) => w.agents[id]).find((o) => o.name === p.ev!.fromName);
          const to = w.order.map((id) => w.agents[id]).find((o) => o.name === p.ev!.toName);
          const pf = from && pos.current.get(from.id);
          const pt = to && pos.current.get(to.id);
          if (pf && pt) lines.current.push({ ax: pf.px, ay: pf.py, bx: pt.px, by: pt.py, life: 1 });
        }
      }
      for (let i = lines.current.length - 1; i >= 0; i--) {
        const L = lines.current[i];
        ctx.strokeStyle = `rgba(227,169,72,${L.life * 0.5})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(L.ax, L.ay); ctx.lineTo(L.bx, L.by); ctx.stroke();
        L.life -= 0.02; if (L.life <= 0) lines.current.splice(i, 1);
      }
      for (const id of w.order) {
        const a = w.agents[id]; const loc = locById[a.loc]; if (!loc) continue;
        const jx = (hue('x' + id) / 360 - 0.5) * 60, jy = (hue('y' + id) / 360 - 0.5) * 60;
        const tx = loc.x * W + jx, ty = loc.y * H + jy;
        let pp = pos.current.get(id);
        if (!pp) { pp = { px: tx, py: ty }; pos.current.set(id, pp); }
        pp.px += (tx - pp.px) * 0.08; pp.py += (ty - pp.py) * 0.08;
        const isOc = id === ocId, isSel = id === selRef.current, r = isSel ? 12 : 8;
        const halo = a.balance < 0 ? '#d65a4e' : a.balance > 8 ? '#e3a948' : '#6cc2a0';
        if (isSel) { ctx.strokeStyle = '#f5f5f7'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pp.px, pp.py, r + 6, 0, 7); ctx.stroke(); }
        ctx.fillStyle = `hsl(${hue(id)},45%,55%)`; roundRect(ctx, pp.px - r, pp.py - r, r * 2, r * 2, 3); ctx.fill();
        ctx.strokeStyle = halo; ctx.lineWidth = 1.4; roundRect(ctx, pp.px - r, pp.py - r, r * 2, r * 2, 3); ctx.stroke();
        ctx.fillStyle = isSel ? '#f5f5f7' : 'rgba(236,231,218,.7)';
        ctx.font = (isSel ? '600 ' : '') + '10px ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.fillText(a.name + (isOc ? ' ★' : ''), pp.px, pp.py + r + 11);
      }
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

  return (
    <section className="worldview">
      <div className="world-controls">
        <button className="btn" onClick={() => setRun(!worldRunning)}>{worldRunning ? '⏸ 暂停' : '▶ 运行世界'}</button>
        <button className="btn" onClick={() => void tick()}>⏭ 单步</button>
        <span className="world-stat">纪元 {w?.epoch ?? 0} · 居民 {w ? w.order.length : 0} · 供给 {w ? Math.round(w.stats.supply) : 0}◈ · NFT {w?.stats.nftCount ?? 0} · 破产 {w?.stats.bankruptCount ?? 0}</span>
        <span className="world-hint">★ 你的 OC · 点地图上任意人格看档案</span>
      </div>
      <div className="world-grid3">
        <div className="map-wrap"><canvas ref={ref} className="worldcanvas" onClick={onCanvasClick} /></div>
        <div className="world-feed">
          <div className="col-head">实时社交流</div>
          {(w?.feed ?? []).slice(0, 24).map((p) => (
            <div key={p.id} className={'wpost' + (p.ev ? ' ev-' + p.ev.kind : '')}>
              <div className="wrow">
                <span className="wav" style={{ background: `hsl(${hue(p.agentId)},45%,55%)` }} />
                <b>{p.name}</b><span className="whandle">{p.handle}</span>
                <span className="wact">{actionCN[p.action]}</span>
              </div>
              <div className="wtext">{p.text}</div>
              {p.ev && <div className="wev">⛓ {p.ev.kind === 'transfer' ? `${p.ev.fromName} → ${p.ev.toName} 转账 ${p.ev.amount}◈` : p.ev.kind === 'mint' ? `${p.ev.fromName} 铸造《${p.ev.nft}》` : `${p.ev.fromName} 破产 · ${p.ev.balance?.toFixed(2)}◈`}</div>}
            </div>
          ))}
          {(!w || w.feed.length === 0) && <div className="world-empty">点「▶ 运行世界」,看你的 OC 和居民们活起来。</div>}
        </div>
        <div className="world-insp">
          <div className="col-head">人格档案</div>
          {selAgent ? <Inspector a={selAgent} isOc={selId === ocId} /> : <div className="world-empty">点地图上的人格查看档案。</div>}
        </div>
      </div>
    </section>
  );
}
