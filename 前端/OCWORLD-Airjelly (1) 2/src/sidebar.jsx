// Sidebar — soft pearl panel, blue-grey lines, mint accent.

function Sidebar({ active, setActive, collapsed, setCollapsed, sessions, activeSession, setActiveSession, onNewSession }) {
  const nav = [
    { id: 'home',    label: '广场',  en: 'Plaza',   icon: IconHome },
    { id: 'chat',    label: '对话',  en: 'Talk',    icon: IconAgent },
    { id: 'rewind',  label: '回溯',  en: 'Rewind',  icon: IconRewind },
    { id: 'memory',  label: '记录',  en: 'Record',  icon: IconTasks },
  ];

  const [tab, setTab] = React.useState('chats');

  if (collapsed) {
    return (
      <aside style={{
        width: 60, flexShrink: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '14px 0', gap: 6,
      }}>
        <button onClick={() => setCollapsed(false)} title="展开" style={collapsedIcon}>
          <IconSidebar size={16} color="var(--ink-muted)" />
        </button>
        <div style={{ height: 8 }} />
        <div style={{ padding: '4px 0' }}><OCMark scale={0.65} /></div>
        <div style={{ height: 4 }} />
        {nav.map(n => (
          <button key={n.id} onClick={() => setActive(n.id)} title={n.label}
            style={{
              ...collapsedIcon,
              color: active === n.id ? 'var(--ink)' : 'var(--ink-muted)',
              background: active === n.id ? 'var(--bg-active)' : 'transparent',
              borderRadius: 10,
            }}>
            <n.icon size={16} />
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside style={{
      width: 244, flexShrink: 0,
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        height: 52, padding: '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <OCMark scale={0.5} animated={false} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.02em' }}>OCWORLD</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em', marginTop: 2 }}>YOUR PLAZA</span>
          </div>
        </div>
        <button onClick={() => setCollapsed(true)} title="收起" style={iconBtn}>
          <IconSidebar size={14} color="var(--ink-muted)" />
        </button>
      </div>

      {/* Primary nav */}
      <div style={{ padding: '12px 10px 6px' }}>
        {nav.map(n => {
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => setActive(n.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10,
                marginBottom: 2, border: 'none',
                background: on ? 'var(--bg-active)' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-muted)',
                fontWeight: on ? 600 : 500, fontSize: 13,
                cursor: 'pointer', textAlign: 'left',
                transition: 'all .12s',
              }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
            >
              <n.icon size={15} color={on ? 'var(--accent-deep)' : 'var(--ink-subtle)'} />
              <span style={{ flex: 1 }}>{n.label}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>{n.en}</span>
            </button>
          );
        })}
      </div>

      {/* Section header */}
      <div style={{
        margin: '14px 14px 4px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          {tab === 'chats' ? '对话' : '人物'}
        </span>
        <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <button onClick={onNewSession} title="新对话" style={{
          width: 18, height: 18, display: 'grid', placeItems: 'center',
          background: 'var(--accent-deep)', color: '#fff', border: 'none',
          borderRadius: 5, cursor: 'pointer', fontSize: 12, lineHeight: 1,
        }}>+</button>
      </div>

      {/* Tab */}
      <div style={{ padding: '0 12px 8px', display: 'flex', gap: 4 }}>
        {[['chats', '对话'], ['people', '人物']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{
              flex: 1, padding: '5px 6px', fontSize: 11, fontWeight: 600,
              border: '1px solid ' + (tab === k ? 'var(--ink-muted)' : 'var(--line)'),
              background: tab === k ? '#fff' : 'transparent',
              color: tab === k ? 'var(--ink)' : 'var(--ink-muted)',
              borderRadius: 8, cursor: 'pointer',
            }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px' }}>
        {tab === 'chats' ? (
          <>
            <SessionRow name="今天降温了，记得加件外套" onClick={() => setActiveSession('今天降温了，记得加件外套')} active={activeSession === '今天降温了，记得加件外套'} />
            <SessionRow name="关于昨晚那个梦"          onClick={() => setActiveSession('关于昨晚那个梦')} active={activeSession === '关于昨晚那个梦'} />
            <SessionRow name="我又拖延了…"              onClick={() => setActiveSession('我又拖延了…')} active={activeSession === '我又拖延了…'} />
            <div style={{ height: 10 }} />
            <div style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace', color: 'var(--ink-faint)', letterSpacing: '0.16em', padding: '6px 4px' }}>
              EARLIER
            </div>
            <SessionRow name="第27天 · 你说的咖啡馆" onClick={() => setActiveSession('第27天 · 你说的咖啡馆')} active={activeSession === '第27天 · 你说的咖啡馆'} />
            <SessionRow name="给XZ的一封信"        onClick={() => setActiveSession('给XZ的一封信')} active={activeSession === '给XZ的一封信'} />
            <SessionRow name="周末计划讨论"          onClick={() => setActiveSession('周末计划讨论')} active={activeSession === '周末计划讨论'} />
          </>
        ) : (
          <>
            <RosterRow letter="X" name="XZ"   stage="朋友 · 412" active />
            <RosterRow letter="J" name="阿橘"  stage="陌生 · 28"  />
            <RosterRow letter="R" name="软糖"  stage="熟人 · 156" />
            <RosterRow letter="X" name="老熊"  stage="新友 · 84"  />
          </>
        )}
      </div>

      {/* Footer — affinity */}
      <div style={{ padding: '10px 12px 12px', borderTop: '1px solid var(--line)' }}>
        <div style={{
          padding: 10, borderRadius: 10,
          background: 'linear-gradient(180deg, var(--accent-soft), #fff)',
          border: '1px solid var(--line-soft)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>亲密度</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--accent-deep)' }}>412</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', background: 'var(--accent-deep)' }} />
          </div>
          <div style={{ marginTop: 8, fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>
            DAY 27 · 朋友 → 挚友
          </div>
        </div>
      </div>
    </aside>
  );
}

const iconBtn = {
  width: 24, height: 24, display: 'grid', placeItems: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6,
};
const collapsedIcon = {
  width: 36, height: 36, display: 'grid', placeItems: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer',
};

function SessionRow({ name, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', marginBottom: 1, borderRadius: 8,
        border: 'none', background: active ? 'var(--accent-soft)' : 'transparent',
        cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: active ? 'var(--accent-deep)' : 'transparent' }} />
      <span style={{
        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        fontSize: 12.5, color: active ? 'var(--ink)' : 'var(--ink-muted)',
        fontWeight: active ? 600 : 400,
      }}>{name}</span>
    </button>
  );
}

function RosterRow({ letter, name, stage, active }) {
  return (
    <button style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px', marginBottom: 2, borderRadius: 10,
      border: 'none', background: active ? 'var(--accent-soft)' : 'transparent',
      cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{
        width: 26, height: 26, borderRadius: 9,
        display: 'grid', placeItems: 'center',
        background: '#fff',
        border: '1px solid var(--line)',
        color: 'var(--ink)', fontSize: 12, fontWeight: 700,
      }}>{letter}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{name}</div>
        <div style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.06em', fontFamily: 'ui-monospace, monospace' }}>{stage}</div>
      </div>
    </button>
  );
}

Object.assign(window, { Sidebar });
