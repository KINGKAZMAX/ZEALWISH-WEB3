// ZEALWISH v4 — top-right fixed controls.
// English-only product UI: no language switch, theme control only.

function AppTopBar({ theme, setTheme }) {
  return (
    <div style={{
      position: 'fixed',
      top: 14, right: 18,
      zIndex: 90,
      display: 'flex', gap: 8,
      animation: 'fade-in .5s .8s ease-out both',
    }}>
      <div className="glass-strong mono" style={{
        height: 32,
        display: 'inline-flex', alignItems: 'center',
        padding: '0 12px',
        border: '1px solid var(--line-red)',
        borderRadius: 0,
        color: 'var(--red)',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}>
        English Only
      </div>

      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="glass-strong"
        style={{
          height: 32, width: 32,
          border: '1px solid var(--line-red)',
          borderRadius: 0,
          display: 'grid', placeItems: 'center',
          cursor: 'pointer',
          transition: 'all .25s',
          padding: 0,
        }}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
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

window.AppTopBar = AppTopBar;
