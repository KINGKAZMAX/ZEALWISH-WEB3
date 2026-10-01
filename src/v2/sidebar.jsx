// OCWORLD v2 sidebar — paper-cream, single red accent, kanji wayfinding.

function SidebarV2({ active, setActive, collapsed, setCollapsed, sessions, activeSession, setActiveSession, onNewSession, onOpenPalette, affinity = 412 }) {
  const nav = [
    { id: 'home',    label: '广场',  en: 'PLAZA',    kanji: '广场',  icon: IconHome },
    { id: 'chat',    label: '对话',  en: 'TALK',     kanji: '对话',  icon: IconChat },
    { id: 'rewind',  label: '回溯',  en: 'REWIND',   kanji: '记忆',  icon: IconRewind },
    { id: 'memory',  label: '记录',  en: 'RECORD',   kanji: '记录',  icon: IconBook },
    { id: 'settings',label: '设置',  en: 'SETTINGS', kanji: '设定',  icon: IconBars },
  ];

  if (collapsed) {
    return (
      <aside style={{
        width: 56, flexShrink: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--ink)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '12px 0', gap: 4,
      }}>
        <button onClick={() => setCollapsed(false)} title="展开" style={collapsedIconV2}>
          <IconSidebar size={16} color="var(--ink)" />
        </button>
        <div style={{ height: 8 }} />
        <div style={{ padding: '4px 0' }}><OCMark scale={0.55} /></div>
        <div style={{ height: 8, width: 24, borderTop: '1px solid var(--line)' }} />
        {nav.map(n => (
          <button key={n.id} onClick={() => setActive(n.id)} title={n.label}
            style={{
              ...collapsedIconV2,
              color: active === n.id ? 'var(--accent)' : 'var(--ink-muted)',
              background: active === n.id ? '#fff' : 'transparent',
              border: active === n.id ? '1px solid var(--ink)' : '1px solid transparent',
            }}>
            <n.icon size={16} />
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside style={{
      width: 232, flexShrink: 0,
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--ink)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        height: 52, padding: '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--ink)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <OCMark scale={0.45} animated={false} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span className="heitai" style={{ fontSize: 13, color: 'var(--ink)', letterSpacing: '0.02em', fontWeight: 900 }}>OCWORLD</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em', marginTop: 2 }}>v0.2 · 桌面的住人</span>
          </div>
        </div>
        <button onClick={() => setCollapsed(true)} title="收起" style={iconBtnV2}>
          <IconSidebar size={14} color="var(--ink-muted)" />
        </button>
      </div>

      {/* ⌘K bar */}
      <div style={{ padding: '12px 12px 4px' }}>
        <button onClick={onOpenPalette}
          className="mono"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', border: '1px solid var(--line)',
            background: '#fff', color: 'var(--ink-muted)',
            fontSize: 11, letterSpacing: '0.04em', cursor: 'pointer',
            borderRadius: 0,
          }}>
          <IconSearch size={12} color="var(--ink-muted)" />
          <span style={{ flex: 1, textAlign: 'left' }}>搜索 / 命令…</span>
          <span style={{
            padding: '1px 5px', border: '1px solid var(--line)',
            fontSize: 9, color: 'var(--ink-subtle)', letterSpacing: '0.1em',
          }}>⌘K</span>
        </button>
      </div>

      {/* Primary nav — kanji block per item */}
      <div style={{ padding: '8px 10px 4px' }}>
        {nav.map(n => {
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => setActive(n.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 8px', borderRadius: 0,
                marginBottom: 1, border: 'none',
                background: on ? '#fff' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-muted)',
                fontSize: 12.5,
                cursor: 'pointer', textAlign: 'left',
                transition: 'all .12s',
                position: 'relative',
                fontWeight: on ? 600 : 500,
                outline: on ? '1px solid var(--ink)' : 'none',
              }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* kanji block */}
              <span className="kanji" style={{
                width: 26, height: 26, flexShrink: 0,
                display: 'grid', placeItems: 'center',
                background: on ? 'var(--accent)' : 'transparent',
                color: on ? '#fff' : 'var(--ink)',
                border: '1px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                fontSize: 13, fontWeight: 700, letterSpacing: 0,
              }}>{n.kanji[0]}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              <span className="mono" style={{ fontSize: 9, color: on ? 'var(--accent)' : 'var(--ink-faint)', letterSpacing: '0.16em' }}>{n.en}</span>
            </button>
          );
        })}
      </div>

      {/* Section: sessions */}
      <div style={{
        margin: '14px 12px 6px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink)', letterSpacing: '0.2em', fontWeight: 600 }}>
          对话 · CHATS
        </span>
        <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <button onClick={onNewSession} title="新对话" style={{
          width: 18, height: 18, display: 'grid', placeItems: 'center',
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 0, cursor: 'pointer', fontSize: 12, lineHeight: 1, fontWeight: 700,
        }}>＋</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 8px' }}>
        {(sessions || DEFAULT_SESSIONS).map((s) => (
          <SessionRowV2
            key={s.id}
            session={s}
            active={activeSession === s.id}
            onClick={() => setActiveSession(s.id)}
          />
        ))}
      </div>

      {/* Footer — affinity, OZ-style */}
      <div style={{ padding: '10px 12px 12px', borderTop: '1px solid var(--ink)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)', letterSpacing: '0.16em' }}>亲密度 · BOND</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>{affinity} / 1000</span>
        </div>
        <div style={{ height: 4, background: '#f0e9d6', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: (affinity / 1000 * 100) + '%', height: '100%', background: 'var(--accent)' }} />
        </div>
        <div className="mono" style={{ marginTop: 8, fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.16em', display: 'flex', justifyContent: 'space-between' }}>
          <span>DAY 27</span>
          <span>朋友 → 挚友</span>
        </div>
      </div>
    </aside>
  );
}

const DEFAULT_SESSIONS = [
  { id: 's1', title: '今天降温了，记得加件外套', date: '14:32', preview: '"昨晚你 1 点才睡哦。"', tag: 'today' },
  { id: 's2', title: '关于昨晚那个梦', date: '昨天', preview: '梦到一个会说话的橘子。', tag: 'today' },
  { id: 's3', title: '我又拖延了…', date: '前天', preview: '我帮你把任务切小了。', tag: 'today' },
  { id: 's4', title: '第27天 · 你说的咖啡馆', date: '5天前', preview: '风信子拿铁，下雨天。', tag: 'earlier' },
  { id: 's5', title: '给XZ的一封信', date: '2周前', preview: '不一定要寄出去。', tag: 'earlier' },
  { id: 's6', title: '周末计划讨论', date: '3周前', preview: '想去看那个展览。', tag: 'earlier' },
];

const iconBtnV2 = {
  width: 24, height: 24, display: 'grid', placeItems: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 0,
};
const collapsedIconV2 = {
  width: 36, height: 36, display: 'grid', placeItems: 'center',
  background: 'transparent', border: '1px solid transparent', cursor: 'pointer', borderRadius: 0,
};

function SessionRowV2({ session, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        width: '100%', display: 'flex', flexDirection: 'column', gap: 2,
        padding: '8px 10px', marginBottom: 1, borderRadius: 0,
        border: 'none', background: active ? '#fff' : 'transparent',
        outline: active ? '1px solid var(--ink)' : 'none',
        cursor: 'pointer', textAlign: 'left',
        position: 'relative',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {active && (
        <span style={{
          position: 'absolute', left: -1, top: 0, bottom: 0,
          width: 3, background: 'var(--accent)',
        }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontSize: 12.5, color: active ? 'var(--ink)' : 'var(--ink-muted)',
          fontWeight: active ? 600 : 500,
        }}>{session.title}</span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.1em', marginLeft: 6 }}>{session.date}</span>
      </div>
      <span style={{
        fontSize: 10.5, color: 'var(--ink-faint)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{session.preview}</span>
    </button>
  );
}

Object.assign(window, { SidebarV2, DEFAULT_SESSIONS });
