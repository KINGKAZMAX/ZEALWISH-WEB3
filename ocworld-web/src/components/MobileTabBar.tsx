import { useLang } from '@/hooks/useLang';
import { IconHome, IconChat, IconSparkle, IconSettings } from './Icons';
import type { ViewId } from '@/types';

interface MobileTabBarProps {
  active: ViewId;
  setActive: (id: ViewId) => void;
}

const TABS: { id: ViewId; icon: typeof IconHome; labelKey: string }[] = [
  { id: 'home',      icon: IconHome,     labelKey: 'nav.home' },
  { id: 'chat',      icon: IconChat,     labelKey: 'nav.chat' },
  { id: 'create-oc', icon: IconSparkle,  labelKey: 'createOc.title' },
  { id: 'settings',  icon: IconSettings, labelKey: 'nav.settings' },
];

export default function MobileTabBar({ active, setActive }: MobileTabBarProps) {
  const { t } = useLang();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 56, display: 'flex', alignItems: 'center',
      background: 'rgba(10,10,10,0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--line)',
      zIndex: 100,
    }}>
      {TABS.map(({ id, icon: Icon, labelKey }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => setActive(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              background: 'none', border: 'none',
              color: isActive ? 'var(--accent)' : 'var(--ink-faint)',
              cursor: 'pointer', padding: '6px 0',
              transition: 'color .15s',
            }}
          >
            <Icon size={20} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>
              {t(labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
