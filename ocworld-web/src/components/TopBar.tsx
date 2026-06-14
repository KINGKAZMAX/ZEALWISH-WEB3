import { useLang } from '@/hooks/useLang';
import { IconSun, IconMoon } from './Icons';

interface TopBarProps {
  theme: string;
  setTheme: (t: string) => void;
}

export default function TopBar({ theme, setTheme }: TopBarProps) {
  const { lang, setLang, t } = useLang();

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
          { id: 'zh' as const, label: '中' },
          { id: 'en' as const, label: 'EN' },
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
        {theme === 'dark' ? <IconSun size={14} color="var(--ink-on-glass)" /> : <IconMoon size={14} color="var(--ink-on-glass)" />}
      </button>
    </div>
  );
}
