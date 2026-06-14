// OCWORLD v3 — Top-right floating control: language + theme toggle.
// Glass pill, sits in the macOS chrome area (top-right of viewport).

function TopBar({ lang, setLang, theme, setTheme }) {
  const { t } = useT();

  return (
    <div style={{
      position: 'fixed',
      top: 14, right: 18,
      zIndex: 90,
      display: 'flex', gap: 8,
      animation: 'fade-in .5s .8s ease-out both',
    }}>
      {/* language toggle */}
      <div className="glass-strong" style={{
        display: 'flex', alignItems: 'center',
        padding: 3, borderRadius: 999,
        height: 32,
      }}>
        {[
          { id: 'zh', label: '中' },
          { id: 'en', label: 'EN' },
        ].map((opt) => {
          const active = lang === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setLang(opt.id)}
              className={opt.id === 'zh' ? 'heitai' : 'mono'}
              style={{
                height: 26,
                minWidth: opt.id === 'zh' ? 28 : 34,
                padding: '0 10px',
                border: 'none',
                borderRadius: 999,
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#FFFFFF' : 'var(--ink-on-glass)',
                fontSize: opt.id === 'zh' ? 13 : 11,
                fontWeight: opt.id === 'zh' ? 700 : 600,
                letterSpacing: opt.id === 'zh' ? 0 : '0.08em',
                cursor: 'pointer',
                transition: 'all .2s',
              }}
              aria-label={opt.id}
              title={t('topbar.lang')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="glass-strong"
        style={{
          height: 32, width: 32,
          border: '1px solid var(--glass-border)',
          borderRadius: 999,
          display: 'grid', placeItems: 'center',
          cursor: 'pointer',
          transition: 'all .25s',
          padding: 0,
        }}
        title={theme === 'dark' ? t('topbar.theme.light') : t('topbar.theme.dark')}
        aria-label="theme"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-on-glass)' }}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-on-glass)' }}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

window.TopBar = TopBar;
