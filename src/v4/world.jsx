// ZEALWISH v4 — Agent World view.
// The "second world" preview — task board, OC社交ring, A2A status.
// Per the brief: 现实端 OC 桌面 + Agent 世界（替你冒险）.

const SAMPLE_QUESTS = [
  { id:'q1', title_zh:'帮一个迷茫的人做盖洛普优势分析', title_en:'Run a Gallup strengths read for someone stuck',
    reward: 280, diff: 'normal', tags_zh:['咨询','心理'], tags_en:['advisory','mind'], status:'available' },
  { id:'q2', title_zh:'搭一个个人主页', title_en:'Build a personal homepage',
    reward: 520, diff: 'hard', tags_zh:['前端','设计'], tags_en:['frontend','design'], status:'in-progress', progress: 0.42 },
  { id:'q3', title_zh:'整理本周飞书会议要点', title_en:'Distill this week\'s meeting notes',
    reward: 140, diff: 'easy', tags_zh:['整理'], tags_en:['summarize'], status:'available' },
  { id:'q4', title_zh:'为一个橘子写一首小诗', title_en:'Write a small poem for an orange',
    reward: 60, diff: 'whim', tags_zh:['趣味','文字'], tags_en:['whimsy','writing'], status:'available' },
  { id:'q5', title_zh:'帮另一个 OC 校对 README', title_en:'Proofread another OC\'s README',
    reward: 180, diff: 'easy', tags_zh:['协作','A2A'], tags_en:['collab','A2A'], status:'matched' },
];

const SAMPLE_PEERS = [
  { id:'p1', name:'KURO', mood:'cool',  intimacy: 64, owner:'@阿吉' },
  { id:'p2', name:'AYA',  mood:'happy', intimacy: 41, owner:'@Eden' },
  { id:'p3', name:'LIN',  mood:'shy',   intimacy: 88, owner:'@小桃' },
  { id:'p4', name:'NOA',  mood:'think', intimacy: 22, owner:'@v' },
  { id:'p5', name:'IO',   mood:'idle',  intimacy: 55, owner:'@m' },
];

function WorldView() {
  const { lang } = useT();
  const T = (zh, en) => (lang === 'en' ? en : zh);
  const [tab, setTab] = React.useState('quests');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 28px 16px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        gap: 20, borderBottom: '1px solid var(--line-soft)',
      }}>
        <div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.32em', fontWeight: 600 }}>
            AGENT WORLD · PHASE 2
          </div>
          <h1 className="heitai" style={{ margin: '6px 0 4px', fontSize: 30, color: 'var(--ink)', lineHeight: 1.1 }}>
            {T('世界', 'The World')}
          </h1>
          <p className="serif" style={{
            margin: 0, fontSize: 13.5, color: 'var(--ink-muted)',
            fontStyle: 'italic', maxWidth: 560, lineHeight: 1.6,
          }}>
            {T('你的 OC 在这里冒险，跟其他 OC 协作、组队、交易。\n你以为你在玩游戏，其实你在升级人生。',
                'Your OC adventures here — collaborating, teaming up, trading with other OCs. You think you\'re playing a game; you\'re actually leveling up your life.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'quests', zh: '任务', en: 'Quests' },
            { id: 'peers',  zh: '邻居', en: 'Peers' },
            { id: 'a2a',    zh: '协议', en: 'A2A' },
          ].map(s => (
            <button key={s.id} onClick={() => setTab(s.id)}
              className={tab === s.id ? 'glass-strong' : 'glass-soft'}
              style={{
                padding: '7px 14px', borderRadius: 999,
                fontSize: 12, fontWeight: tab === s.id ? 700 : 500,
                color: tab === s.id ? 'var(--accent)' : 'var(--ink-muted)',
                border: '1px solid ' + (tab === s.id ? 'var(--accent)' : 'var(--glass-border)'),
                cursor: 'pointer',
              }}>
              {lang === 'en' ? s.en : s.zh}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px' }}>
        {tab === 'quests' && <QuestBoard lang={lang} T={T} />}
        {tab === 'peers'  && <PeerNet     lang={lang} T={T} />}
        {tab === 'a2a'    && <A2APanel    lang={lang} T={T} />}
      </div>
    </div>
  );
}

function QuestBoard({ lang, T }) {
  const diffStyle = (d) => ({
    easy:   { bg: 'rgba(255,255,255,0.10)', fg: '#FFFFFF' },
    normal: { bg: 'var(--accent-soft)',        fg: 'var(--accent)' },
    hard:   { bg: 'rgba(255,45,85,0.18)',      fg: 'var(--accent)' },
    whim:   { bg: 'rgba(255,255,255,0.08)',    fg: 'rgba(255,255,255,0.72)' },
  })[d];
  const statusLabel = (s) => ({
    'available':   T('可接','Available'),
    'in-progress': T('进行中','In progress'),
    'matched':     T('已匹配','Matched'),
  })[s];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SAMPLE_QUESTS.map(q => {
          const ds = diffStyle(q.diff);
          return (
            <div key={q.id} className="glass" style={{ padding: 16, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="mono" style={{
                      fontSize: 9, padding: '2px 7px', borderRadius: 4,
                      background: ds.bg, color: ds.fg, fontWeight: 700, letterSpacing: '0.12em',
                    }}>{q.diff.toUpperCase()}</span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em' }}>
                      {statusLabel(q.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600, marginBottom: 6 }}>
                    {lang === 'en' ? q.title_en : q.title_zh}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(lang === 'en' ? q.tags_en : q.tags_zh).map(tg => (
                      <span key={tg} style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 4,
                        background: 'var(--line-soft)', color: 'var(--ink-muted)',
                      }}>{tg}</span>
                    ))}
                  </div>
                  {q.progress !== undefined && (
                    <div style={{ marginTop: 10, height: 3, background: 'var(--line-soft)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: (q.progress * 100) + '%', height: '100%', background: 'var(--accent)' }} />
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="grotesk" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                    {q.reward}
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em', marginTop: 2 }}>
                    OC ¢
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="glass-strong" style={{ padding: 18, borderRadius: 12 }}>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-muted)', letterSpacing: '0.22em', fontWeight: 600, marginBottom: 8 }}>
            {T('你的 OC · 本周', 'YOUR OC · THIS WEEK')}
          </div>
          <Stat label={T('完成任务','Quests done')} value="7" />
          <Stat label={T('协作 OC','Peers worked with')} value="3" />
          <Stat label={T('OC 币 收入','OC ¢ earned')} value="1,840" accent />
          <Stat label={T('下一级阈值','Next tier at')} value="2,500" muted />
        </div>

        <div className="glass" style={{ padding: 18, borderRadius: 12 }}>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-muted)', letterSpacing: '0.22em', fontWeight: 600, marginBottom: 10 }}>
            {T('技能树','SKILL TREE')}
          </div>
          {[
            { k: T('前端','Frontend'),  v: 0.72 },
            { k: T('文字','Writing'),   v: 0.56 },
            { k: T('优势分析','Coaching'), v: 0.81 },
            { k: T('整理','Organize'),  v: 0.40 },
          ].map((s,i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--ink)' }}>{s.k}</span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>Lv {Math.round(s.v * 10)}</span>
              </div>
              <div style={{ height: 3, background: 'var(--line-soft)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: (s.v*100) + '%', height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-deep))' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, muted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{label}</span>
      <span className="grotesk" style={{
        fontSize: 15, fontWeight: 700,
        color: accent ? 'var(--accent)' : (muted ? 'var(--ink-faint)' : 'var(--ink)'),
      }}>{value}</span>
    </div>
  );
}

function PeerNet({ lang, T }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-muted)', letterSpacing: '0.22em', fontWeight: 600, marginBottom: 10 }}>
        {T('正在巡游的 OC · 实时','OCs ROAMING NEARBY · LIVE')}
      </div>
      <div style={{
        position: 'relative', height: 320,
        borderRadius: 16, overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass-bg-soft)',
      }}>
        {/* center: you */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent)', color: '#FFFFFF',
            display: 'grid', placeItems: 'center',
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 14,
            boxShadow: '0 0 0 4px var(--accent-soft), 0 0 0 12px rgba(0,0,0,0.04)',
          }}>XZ</div>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-muted)', letterSpacing: '0.2em' }}>YOU</span>
        </div>

        {/* peers around */}
        {SAMPLE_PEERS.map((p, i) => {
          const angle = (i / SAMPLE_PEERS.length) * Math.PI * 2 - Math.PI / 2;
          const r = 110;
          const x = 50 + Math.cos(angle) * r * 0.4;
          const y = 50 + Math.sin(angle) * r * 0.5;
          return (
            <div key={p.id} style={{
              position: 'absolute', left: x + '%', top: y + '%', transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              animation: `oc-bob ${2.4 + i * 0.3}s ease-in-out infinite`,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'var(--glass-bg-strong)',
                color: 'var(--ink)',
                display: 'grid', placeItems: 'center',
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 11,
                border: '1.5px solid var(--accent)',
                backdropFilter: 'blur(20px)',
              }}>{p.name}</div>
              <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>{p.owner}</span>
            </div>
          );
        })}

        {/* connecting lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {SAMPLE_PEERS.map((p, i) => {
            const angle = (i / SAMPLE_PEERS.length) * Math.PI * 2 - Math.PI / 2;
            const x1 = '50%';
            const y1 = '50%';
            const x2 = (50 + Math.cos(angle) * 44) + '%';
            const y2 = (50 + Math.sin(angle) * 55) + '%';
            return <line key={p.id} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--accent)" strokeOpacity="0.18" strokeDasharray="3 4" strokeWidth="1" />;
          })}
        </svg>
      </div>
    </div>
  );
}

function A2APanel({ lang, T }) {
  const lines = [
    { t: 'A2A.HANDSHAKE',   detail: T('与 KURO 建立信任通道','Trust channel established with KURO'), ok: true },
    { t: 'TASK.DELEGATE',   detail: T('委派"校对 README"任务给 AYA','Delegated "proofread README" to AYA'), ok: true },
    { t: 'MEMORY.SYNC',     detail: T('上下文摘要同步至 LIN（仅相关片段）','Context summary synced to LIN (relevant slices only)'), ok: true },
    { t: 'A2A.NEGOTIATE',   detail: T('与 NOA 协商任务报价 280 → 320','Negotiated quote with NOA: 280 → 320'), ok: true },
    { t: 'TASK.COMPLETE',   detail: T('任务"整理桌面"由你的 OC 独立完成','Task "tidy desktop" completed solo by your OC'), ok: true },
    { t: 'A2A.QUEST_CHAIN', detail: T('正在为复杂任务包装关卡邀请你加入','Wrapping complex task as quest — pending your join'), ok: false },
  ];
  return (
    <div className="glass-strong" style={{ borderRadius: 14, padding: 16 }}>
      <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-muted)', letterSpacing: '0.22em', fontWeight: 600, marginBottom: 10 }}>
        {T('A2A · 协议日志（最近）','A2A · PROTOCOL LOG (RECENT)')}
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '9px 0', borderBottom: '1px solid var(--line-soft)',
          fontSize: 12,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: l.ok ? '#FFFFFF' : 'var(--accent)',
            flexShrink: 0,
            boxShadow: l.ok ? '0 0 0 3px rgba(255,255,255,0.18)' : '0 0 0 3px var(--accent-soft)',
            animation: !l.ok ? 'pcb-pulse 1.4s ease-in-out infinite' : 'none',
          }} />
          <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', minWidth: 130 }}>
            {l.t}
          </span>
          <span style={{ color: 'var(--ink-muted)', flex: 1 }}>{l.detail}</span>
        </div>
      ))}
    </div>
  );
}

window.WorldView = WorldView;
