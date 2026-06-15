import { useEffect, useRef, useState } from 'react';
import { useLiving } from '../store/useLiving';
import { LOCATIONS, locById, ARCHE_CN } from '../sim/data';
import { actionCN } from '../sim/text';
import type { Agent, ActionKind } from '../sim/types';
import WorldGoLive from './WorldGoLive';

// 资源基址:dev '/' / 构建 './'(/world 子路径)
const BASE = import.meta.env.BASE_URL;
// FRLG 原版小镇底图尺寸(裁掉底部署名条);宽 384=24 格
const SRC_W = 384, SRC_H = 327, TOWN_TILES = 24;
// FRLG 训练师/NPC 行走条(pret/pokefirered,16×32 帧/条)
const FRLG_CHARS = ['red_normal', 'green_normal', 'boy', 'lass', 'youngster', 'fat_man', 'beauty', 'gentleman'];
// FRLG 帧序:f0下-idle f2左-idle f5上-idle;下走[3,4] 上走[6,5] 左走[7,8](右=左翻转)
const FRAME: Record<string, { idle: number; walk: [number, number] }> = {
  down: { idle: 0, walk: [3, 4] }, up: { idle: 5, walk: [6, 5] }, side: { idle: 2, walk: [7, 8] },
};
// 夜里透红光的窗户(归一化:两栋民居 + 实验室)
const WINDOWS: [number, number][] = [[0.27, 0.26], [0.34, 0.26], [0.63, 0.24], [0.7, 0.24], [0.76, 0.62], [0.84, 0.62]];

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
  const chars = useRef<HTMLImageElement[]>([]);
  const townImg = useRef<HTMLImageElement | null>(null);
  const selRef = useRef<string | null>(null);
  selRef.current = sel ?? ocId ?? null;

  useEffect(() => {
    if (!worldRunning) return;
    const iv = setInterval(() => { void tick(); }, 1300 - worldSpeed * 110);
    return () => clearInterval(iv);
  }, [worldRunning, worldSpeed, tick]);

  // FRLG 原版小镇底图 + 训练师/NPC 行走精灵
  useEffect(() => {
    const t = new Image(); t.src = BASE + 'sprites/frlg-town.png'; t.onload = () => { townImg.current = t; };
    chars.current = FRLG_CHARS.map((n) => { const im = new Image(); im.src = BASE + 'sprites/chr-' + n + '.png'; return im; });
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
      // 底图:真 FRLG 帕烈镇地图,等比 contain 进正方形面板(裁掉底部署名条)
      const mapSize = Math.min(W, H);
      const sc = mapSize / SRC_W, dW = mapSize, dH = SRC_H * sc;
      const ox = (W - mapSize) / 2, oy = (H - mapSize) / 2 + (mapSize - dH) / 2;
      ctx.fillStyle = '#0b0b0d'; ctx.fillRect((W - mapSize) / 2, (H - mapSize) / 2, mapSize, mapSize);
      const tm = townImg.current;
      if (tm) { ctx.imageSmoothingEnabled = false; ctx.drawImage(tm, 0, 0, SRC_W, SRC_H, ox, oy, dW, dH); }
      const MX = (nx: number) => ox + nx * dW, MY = (ny: number) => oy + ny * dH;
      const tDest = dW / TOWN_TILES;
      // ── 昼夜光照(每 24 epoch 一天):夜蓝 + 黄昏暖光 + 夜里窗户红光 ──
      const epoch = w ? w.epoch : 12;
      const ph = (((epoch % 24) + 24) % 24) / 24;
      const sun = Math.max(0, Math.sin(ph * Math.PI));
      const night = Math.max(0, 1 - sun * 1.15);
      const golden = sun > 0.02 ? Math.max(0, 1 - Math.abs(sun - 0.25) / 0.25) : 0;
      if (night > 0.01) { ctx.fillStyle = `rgba(14,18,54,${(night * 0.58).toFixed(3)})`; ctx.fillRect(ox, oy, dW, dH); }
      if (golden > 0.01) { ctx.fillStyle = `rgba(255,150,60,${(golden * 0.16).toFixed(3)})`; ctx.fillRect(ox, oy, dW, dH); }
      if (night > 0.22) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const ga = (night - 0.22) / 0.78, rad = tDest * 0.9;
        for (const [nx, ny] of WINDOWS) {
          const gx = MX(nx), gy = MY(ny);
          const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
          g.addColorStop(0, `rgba(255,80,50,${(ga * 0.8).toFixed(3)})`); g.addColorStop(1, 'rgba(255,80,50,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, rad, 0, 7); ctx.fill();
        }
        ctx.restore();
      }
      LOCATIONS.forEach((l) => {
        const x = MX(l.x), y = MY(l.y) - tDest * 1.5;
        ctx.font = '10px ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.85)'; ctx.strokeText(l.name, x, y);
        ctx.fillStyle = 'rgba(245,245,247,.92)'; ctx.fillText(l.name, x, y);
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
      // 每个 agent 最近动作 → 是否在室内(work/mint/reflect = 进屋)
      const lastAct = new Map<string, { a: ActionKind; e: number }>();
      for (const p of w.feed) { const cur = lastAct.get(p.agentId); if (!cur || p.epoch >= cur.e) lastAct.set(p.agentId, { a: p.action, e: p.epoch }); }
      const t = Math.floor(Date.now() / 180);
      for (const id of w.order) {
        const a = w.agents[id]; if (!a) continue; const loc = locById[a.loc]; if (!loc) continue;
        const act = lastAct.get(id)?.a;
        const indoor = act === 'work' || act === 'mint' || act === 'reflect';
        const jx = (hue('x' + id) / 360 - 0.5) * tDest * 2.6, jy = (hue('y' + id) / 360 - 0.5) * tDest * 2.6;
        const tx = indoor ? MX(loc.x) + jx * 0.25 : MX(loc.x) + jx;
        const ty = indoor ? MY(loc.y) - tDest * 1.1 : MY(loc.y) + jy;
        let pp = pos.current.get(id); if (!pp) { pp = { px: tx, py: ty }; pos.current.set(id, pp); }
        pp.px += (tx - pp.px) * 0.08; pp.py += (ty - pp.py) * 0.08;
        const isOc = id === ocId, isSel = id === selRef.current;
        const dx = tx - pp.px, dy = ty - pp.py, moving = Math.abs(dx) + Math.abs(dy) > 0.6;
        // FRLG 训练师精灵(16×32):方向 + 行走帧;按 id 选角色
        const charW = tDest * 1.06, charH = charW * 2;
        let dir = 'down', flip = false;
        if (moving) {
          if (Math.abs(dx) > Math.abs(dy)) { dir = 'side'; flip = dx > 0; }
          else dir = dy < 0 ? 'up' : 'down';
        }
        const fr = FRAME[dir]; const fi = moving ? fr.walk[t % 2] : fr.idle;
        const img = chars.current[hue(id) % chars.current.length];
        // 影子
        ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(pp.px, pp.py + 1, charW * 0.34, charW * 0.13, 0, 0, 7); ctx.fill();
        // 选中/破产环(ZEALWISH 红)
        if (isSel) { ctx.strokeStyle = '#ff2d2d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pp.px, pp.py - charH * 0.38, charW * 0.82, 0, 7); ctx.stroke(); }
        else if (a.balance < 0) { ctx.strokeStyle = 'rgba(255,45,45,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pp.px, pp.py - charH * 0.38, charW * 0.76, 0, 7); ctx.stroke(); }
        // 精灵(脚底对齐 pp.py;进屋则半透明)
        if (indoor) ctx.globalAlpha = moving ? 0.62 : 0.34;
        if (img && img.complete && img.naturalWidth) {
          ctx.imageSmoothingEnabled = false;
          const dy0 = pp.py + 2 - charH;
          if (flip) { ctx.save(); ctx.translate(pp.px + charW / 2, dy0); ctx.scale(-1, 1); ctx.drawImage(img, fi * 16, 0, 16, 32, 0, 0, charW, charH); ctx.restore(); }
          else ctx.drawImage(img, fi * 16, 0, 16, 32, pp.px - charW / 2, dy0, charW, charH);
        } else {
          ctx.fillStyle = `hsl(${hue(id)},42%,52%)`; roundRect(ctx, pp.px - 8, pp.py - 18, 16, 18, 3); ctx.fill();
        }
        ctx.globalAlpha = 1;
        const label = a.name + (isOc ? ' ★' : '');
        ctx.font = (isSel ? '600 ' : '') + '10px ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.82)'; ctx.strokeText(label, pp.px, pp.py + 13);
        ctx.fillStyle = isSel ? '#ff2d2d' : 'rgba(245,245,247,.94)'; ctx.fillText(label, pp.px, pp.py + 13);
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
    let best: string | null = null, bd = 28 * 28;
    for (const id of w.order) {
      const p = pos.current.get(id); if (!p) continue;
      const d = (p.px - mx) ** 2 + (p.py - my - 14) ** 2;
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
