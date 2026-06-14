import { useEffect, useRef } from 'react';
import { useLiving } from '../store/useLiving';
import { LOCATIONS, locById } from '../sim/data';

// 地点配色 → hex(脱敏自研生命引擎用色)
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

export default function WorldView() {
  useLiving((s) => s.version);
  const ocId = useLiving.getState().oc?.id;
  const worldRunning = useLiving((s) => s.worldRunning);
  const setRun = useLiving((s) => s.setWorldRunning);
  const tick = useLiving((s) => s.tickWorld);

  const ref = useRef<HTMLCanvasElement>(null);
  const pos = useRef(new Map<string, Pos>());
  const lines = useRef<Line[]>([]);
  const lastEpoch = useRef(-1);

  // 世界推进循环(运行时每 700ms 一个纪元)
  useEffect(() => {
    if (!worldRunning) return;
    const iv = setInterval(() => { void tick(); }, 700);
    return () => clearInterval(iv);
  }, [worldRunning, tick]);

  // canvas 渲染循环(读 store.world,自驱动)
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
      if (w) {
        // 地点
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
        // 新纪元 → 收集转账事件,画跨地图救济连线
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
        // 居民(含你的 OC)
        for (const id of w.order) {
          const a = w.agents[id];
          const loc = locById[a.loc]; if (!loc) continue;
          const jx = (hue('x' + id) / 360 - 0.5) * 60, jy = (hue('y' + id) / 360 - 0.5) * 60;
          const tx = loc.x * W + jx, ty = loc.y * H + jy;
          let pp = pos.current.get(id);
          if (!pp) { pp = { px: tx, py: ty }; pos.current.set(id, pp); }
          pp.px += (tx - pp.px) * 0.08; pp.py += (ty - pp.py) * 0.08;
          const sel = id === ocId, r = sel ? 11 : 8;
          const halo = a.balance < 0 ? '#d65a4e' : a.balance > 8 ? '#e3a948' : '#6cc2a0';
          if (sel) { ctx.strokeStyle = '#6cc2a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pp.px, pp.py, r + 5, 0, 7); ctx.stroke(); }
          ctx.fillStyle = `hsl(${hue(id)},45%,55%)`; roundRect(ctx, pp.px - r, pp.py - r, r * 2, r * 2, 3); ctx.fill();
          ctx.strokeStyle = halo; ctx.lineWidth = 1.4; roundRect(ctx, pp.px - r, pp.py - r, r * 2, r * 2, 3); ctx.stroke();
          ctx.fillStyle = sel ? '#6cc2a0' : 'rgba(236,231,218,.7)';
          ctx.font = (sel ? '600 ' : '') + '10px ui-monospace, monospace'; ctx.textAlign = 'center';
          ctx.fillText(a.name + (sel ? ' ★' : ''), pp.px, pp.py + r + 11);
        }
      } else {
        ctx.fillStyle = 'rgba(160,160,168,.6)'; ctx.font = '13px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('世界尚未生成', W / 2, H / 2);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ocId]);

  const w = useLiving.getState().world;
  return (
    <section className="worldview">
      <div className="world-controls">
        <button className="btn" onClick={() => setRun(!worldRunning)}>{worldRunning ? '⏸ 暂停' : '▶ 运行世界'}</button>
        <button className="btn" onClick={() => void tick()}>⏭ 单步</button>
        <span className="world-stat">纪元 {w?.epoch ?? 0} · 居民 {w ? w.order.length : 0} · 供给 {w ? Math.round(w.stats.supply) : 0}◈</span>
        <span className="world-hint">★ 是你的 OC —— 它在这个世界里和别的 agent 一起活</span>
      </div>
      <div className="world-grid">
        <div className="map-wrap"><canvas ref={ref} className="worldcanvas" /></div>
        <div className="world-feed">
          {(w?.feed ?? []).slice(0, 20).map((p) => (
            <div key={p.id} className={'wpost' + (p.ev ? ' ev-' + p.ev.kind : '')}>
              <b>{p.name}</b> <span className="wtext">{p.text}</span>
            </div>
          ))}
          {(!w || w.feed.length === 0) && <div className="world-empty">点「▶ 运行世界」,看你的 OC 和居民们活起来。</div>}
        </div>
      </div>
    </section>
  );
}
