import { useState } from 'react';
import { useLiving } from '../store/useLiving';
import { ARCHE_CN } from '../sim/data';
import type { Archetype } from '../sim/types';
import Chat from './Chat';
import LifeFeed from './LifeFeed';

function hue(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 360; }
function Bar({ label, v }: { label: string; v: number }) {
  return (
    <div className="sp-bar"><div className="sp-bar-lab"><span>{label}</span><span>{Math.round(v * 100)}</span></div>
      <div className="sp-bar-track"><span style={{ width: v * 100 + '%' }} /></div></div>
  );
}

// 个人空间:这位 OC 的「家」——身份、性格、此刻、你为它沉淀的信念、记忆、今日人生、对话。
// 你可亲手编辑它的人设(名字/原型/背景故事)—— 共创即拥有。
export default function PersonalSpace() {
  useLiving((s) => s.version);
  const oc = useLiving.getState().oc;
  const editOc = useLiving((s) => s.editOc);
  const [editing, setEditing] = useState(false);
  const [eName, setEName] = useState('');
  const [eBio, setEBio] = useState('');
  const [eArche, setEArche] = useState<Archetype>('creator');
  if (!oc) return null;
  const p = oc.profile;
  const startEdit = () => { setEName(oc.name); setEBio(oc.bio); setEArche(oc.arche); setEditing(true); };
  const save = () => { editOc({ name: eName, bio: eBio, arche: eArche }); setEditing(false); };

  return (
    <div className="app space">
      <div className="space-grid">
        <aside className="space-col">
          <section className="sp-card">
            {editing ? (
              <div className="sp-edit">
                <div className="sp-sec">编辑人设 · 它属于你</div>
                <label className="sp-field"><span>名字</span><input value={eName} onChange={(e) => setEName(e.target.value)} maxLength={12} /></label>
                <label className="sp-field"><span>原型</span>
                  <select value={eArche} onChange={(e) => setEArche(e.target.value as Archetype)}>
                    {(Object.keys(ARCHE_CN) as Archetype[]).map((a) => <option key={a} value={a}>{ARCHE_CN[a]}</option>)}
                  </select>
                </label>
                <label className="sp-field"><span>背景故事 / 人设</span><textarea value={eBio} onChange={(e) => setEBio(e.target.value)} rows={4} placeholder="它是谁、从哪来、在乎什么、说话什么调调…" /></label>
                <div className="sp-edit-actions">
                  <button className="btn primary" onClick={save}>保存 ✦</button>
                  <button className="btn" onClick={() => setEditing(false)}>取消</button>
                </div>
              </div>
            ) : (
              <>
                <div className="sp-id">
                  <span className="sp-av" style={{ background: `hsl(${hue(oc.id)},48%,55%)` }} />
                  <div className="sp-id-txt">
                    <div className="sp-name">{oc.name} <span className="sp-star">★</span></div>
                    <div className="sp-sub">{oc.handle} · {ARCHE_CN[oc.arche]} · 「{oc.mood}」</div>
                  </div>
                  <button className="sp-edit-btn" onClick={startEdit} title="编辑人设(名字 / 原型 / 背景故事)">✎</button>
                </div>
                <div className="sp-meta">
                  <span><i>钱包</i> {oc.wallet.slice(0, 6)}…{oc.wallet.slice(-4)}</span>
                  <span><i>余额</i> {oc.balance.toFixed(2)} ◈</span>
                  <span><i>活过</i> {p.daysLived} 天</span>
                </div>
                <div className="sp-bio">{oc.bio}</div>
                <div className="sp-sec">性格 · Traits</div>
                <Bar label="野心" v={oc.traits.ambition} />
                <Bar label="社交" v={oc.traits.sociability} />
                <Bar label="冒险" v={oc.traits.risk} />
                <Bar label="创造" v={oc.traits.creativity} />
                <Bar label="节俭" v={oc.traits.frugality} />
                <div className="sp-sec">此刻 · Needs</div>
                <Bar label="精力" v={oc.needs.energy} />
                <Bar label="财力" v={oc.needs.money} />
                <Bar label="社交" v={oc.needs.social} />
                <Bar label="名声" v={oc.needs.fame} />
              </>
            )}
          </section>

          <section className="sp-card">
            <div className="sp-sec">信念 · 你为它沉淀的</div>
            {p.guidance.length > 0
              ? p.guidance.slice(0, 6).map((g, i) => <div className="sp-belief" key={i}>“{g}”</div>)
              : <div className="sp-empty">还没有引导过它。在中间「引导」里写一句,会沉淀进它的信念,慢慢长成它的样子。</div>}
            {p.insights.length > 0 && <>
              <div className="sp-sec">领悟 · 它的日记洞察</div>
              {p.insights.slice(0, 5).map((x, i) => <div className="sp-insight" key={i}>· {x}</div>)}
            </>}
          </section>
        </aside>

        <main className="space-col mid"><Chat /></main>

        <aside className="space-col">
          <section className="sp-card"><LifeFeed /></section>
          <section className="sp-card">
            <div className="sp-sec">记忆流 · Memory</div>
            {oc.memory.length > 0
              ? oc.memory.slice(0, 8).map((m, i) => <div className="sp-mem" key={i}><span className="tk">e{m.e}</span> {m.t}</div>)
              : <div className="sp-empty">尚无记忆 —— 让它过一天,记忆会慢慢长出来。</div>}
          </section>
        </aside>
      </div>
    </div>
  );
}
