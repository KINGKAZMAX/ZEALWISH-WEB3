// OCWORLD v3 sidebar — glass surface, simplified anchors, no kanji medallions.
// One column of icon + label, restrained accent, soft session list.

function SidebarV2({ active, setActive, collapsed, setCollapsed, sessions, activeSession, setActiveSession, onNewSession, onOpenPalette, affinity = 412, intimacy = 32, day = 27 }) {
  const { t, lang } = useT();
  const nav = [
    { id: 'home',     icon: IconHome,   key: 'nav.home' },
    { id: 'chat',     icon: IconChat,   key: 'nav.chat' },
    { id: 'world',    icon: IconRewind, key: 'nav.world' },
    { id: 'rewind',   icon: IconRewind, key: 'nav.rewind' },
    { id: 'memory',   icon: IconBook,   key: 'nav.memory' },
    { id: 'settings', icon: IconBars,   key: 'nav.settings' },
  ];

  if (collapsed) {
    return (
      <aside style={{
        width: 60, flexShrink: 0,
        borderRight: '1px solid var(--line-soft)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '14px 0', gap: 6,
        background: 'transparent',
      }}>
        <button onClick={() => setCollapsed(false)} title={lang === 'en' ? 'Expand' : '展开'} style={collapsedIconV3}>
          <IconSidebar size={16} color="var(--ink-muted)" />
        </button>
        <div style={{ height: 6 }} />
        <div style={{ padding: '4px 0' }}><OCMark scale={0.55} /></div>
        <div style={{ height: 8, width: 22, borderTop: '1px solid var(--line-soft)' }} />
        {nav.map(n => {
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => setActive(n.id)} title={t(n.key)}
              style={{
                ...collapsedIconV3,
                color: on ? 'var(--accent)' : 'var(--ink-muted)',
                background: on ? 'var(--glass-bg-strong)' : 'transparent',
                border: on ? '1px solid var(--glass-border-strong)' : '1px solid transparent',
                backdropFilter: on ? 'blur(20px)' : 'none',
              }}>
              <n.icon size={16} />
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside style={{
      width: 244, flexShrink: 0,
      borderRight: '1px solid var(--line-soft)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      background: 'transparent',
    }}>
      {/* Header — minimal */}
      <div style={{
        height: 56, padding: '0 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <OCMark scale={0.45} animated={false} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span className="grotesk" style={{ fontSize: 13.5, color: 'var(--ink)', letterSpacing: '0.04em', fontWeight: 700 }}>OCWORLD</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em', marginTop: 1 }}>v0.4 · SIGNAL</span>
          </div>
        </div>
        <button onClick={() => setCollapsed(true)} title={lang === 'en' ? 'Collapse' : '收起'} style={iconBtnV3}>
          <IconSidebar size={14} color="var(--ink-muted)" />
        </button>
      </div>

      {/* ⌘K bar — soft glass */}
      <div style={{ padding: '4px 12px 8px' }}>
        <button onClick={onOpenPalette}
          className="glass-soft"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            color: 'var(--ink-muted)',
            fontSize: 12, cursor: 'pointer',
            borderRadius: 10,
            transition: 'all .2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-bg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
        >
          <IconSearch size={12} color="var(--ink-muted)" />
          <span style={{ flex: 1, textAlign: 'left' }}>{t('sidebar.search')}</span>
          <span className="mono" style={{
            padding: '1px 6px',
            border: '1px solid var(--line)',
            borderRadius: 4,
            fontSize: 9, color: 'var(--ink-subtle)', letterSpacing: '0.08em',
          }}>⌘K</span>
        </button>
      </div>

      {/* Primary nav — clean rows */}
      <div style={{ padding: '4px 8px 8px' }}>
        {nav.map(n => {
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => setActive(n.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 11,
                padding: '8px 10px', marginBottom: 2,
                borderRadius: 9,
                border: 'none',
                background: on ? 'var(--glass-bg-strong)' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-muted)',
                fontSize: 13,
                cursor: 'pointer', textAlign: 'left',
                transition: 'all .15s',
                position: 'relative',
                fontWeight: on ? 600 : 500,
                backdropFilter: on ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: on ? 'blur(20px)' : 'none',
                boxShadow: on ? '0 1px 0 rgba(255,255,255,0.4) inset, 0 1px 2px rgba(0,0,0,0.04)' : 'none',
              }}
              onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = 'var(--glass-bg-soft)'; e.currentTarget.style.color = 'var(--ink)'; } }}
              onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; } }}
            >
              {on && (
                <span style={{
                  position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 16, borderRadius: 2,
                  background: 'var(--accent)',
                }} />
              )}
              <span style={{ width: 18, display: 'grid', placeItems: 'center', color: on ? 'var(--accent)' : 'currentColor' }}>
                <n.icon size={15} />
              </span>
              <span style={{ flex: 1 }}>{t(n.key)}</span>
            </button>
          );
        })}
      </div>

      {/* Section: chats */}
      <div style={{
        margin: '10px 14px 6px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span className="mono" style={{ fontSize: 9.5, color: 'var(--ink-subtle)', letterSpacing: '0.22em', fontWeight: 600, textTransform: 'uppercase' }}>
          {t('sidebar.chats')}
        </span>
        <span style={{ flex: 1, height: 1, background: 'var(--line-soft)' }} />
        <button onClick={onNewSession} title={t('sidebar.new')} style={{
          width: 18, height: 18, display: 'grid', placeItems: 'center',
          background: 'transparent',
          color: 'var(--ink-muted)',
          border: '1px solid var(--line)',
          borderRadius: 5, cursor: 'pointer',
          fontSize: 13, lineHeight: 1, fontWeight: 500,
          transition: 'all .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
        >＋</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 8px 8px' }}>
        {(sessions || DEFAULT_SESSIONS).map((s) => (
          <SessionRowV2
            key={s.id}
            session={s}
            active={activeSession === s.id}
            onClick={() => setActiveSession(s.id)}
          />
        ))}
      </div>

      {/* Footer — affinity, glassy */}
      <div style={{
        padding: '12px 16px 14px',
        borderTop: '1px solid var(--line-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
          <span className="mono" style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{t('intimacy.label')}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>{intimacy} / 100</span>
        </div>
        <div style={{ height: 3, background: 'var(--line-soft)', position: 'relative', overflow: 'hidden', borderRadius: 99 }}>
          <div style={{
            width: intimacy + '%', height: '100%',
            background: 'linear-gradient(90deg, var(--accent), var(--accent-deep))',
            borderRadius: 99, transition: 'width .6s ease',
          }} />
        </div>
        <div className="mono" style={{ marginTop: 8, fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em', display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('sidebar.day')} {day}</span>
          <span>{(stageOf ? (lang === 'en' ? stageOf(intimacy).en : stageOf(intimacy).zh) : '')}</span>
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

const iconBtnV3 = {
  width: 26, height: 26, display: 'grid', placeItems: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6,
};
const collapsedIconV3 = {
  width: 38, height: 38, display: 'grid', placeItems: 'center',
  background: 'transparent', border: '1px solid transparent', cursor: 'pointer',
  borderRadius: 9,
  transition: 'all .15s',
};

function SessionRowV2({ session, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        width: '100%', display: 'flex', flexDirection: 'column', gap: 2,
        padding: '8px 10px', marginBottom: 1,
        borderRadius: 8,
        border: 'none',
        background: active ? 'var(--glass-bg-strong)' : 'transparent',
        backdropFilter: active ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: active ? 'blur(20px)' : 'none',
        boxShadow: active ? '0 1px 0 rgba(255,255,255,0.4) inset, 0 1px 2px rgba(0,0,0,0.04)' : 'none',
        cursor: 'pointer', textAlign: 'left',
        position: 'relative',
        transition: 'background .15s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--glass-bg-soft)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {active && (
        <span style={{
          position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 18, borderRadius: 2,
          background: 'var(--accent)',
        }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingLeft: active ? 8 : 0 }}>
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
        paddingLeft: active ? 8 : 0,
      }}>{session.preview}</span>
    </button>
  );
}

Object.assign(window, { SidebarV2, DEFAULT_SESSIONS });
