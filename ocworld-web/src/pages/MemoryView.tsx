import { useLang } from '@/hooks/useLang';
import { useIsMobile } from '@/hooks/useIsMobile';
import ViewHeader from '@/components/ViewHeader';
import { IconSearch } from '@/components/Icons';

export default function MemoryView() {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();

  const groups = lang === 'en' ? [
    { titleKey: 'record.group.you', count: 12, items: [
      { text: 'Falls asleep around 1am', d: 'day 3' },
      { text: 'Drinks latte, no sugar', d: 'day 5' },
      { text: "Grandma's osmanthus cake", d: 'day 22' },
      { text: 'Mood dips when it rains', d: 'day 14' },
    ]},
    { titleKey: 'record.group.people', count: 5, items: [
      { text: 'Lao Zhou (coworker)', d: 'day 8' },
      { text: 'Ah-jiang (cat)', d: 'day 11' },
      { text: 'Mom', d: 'day 1' },
    ]},
    { titleKey: 'record.group.thoughts', count: 4, items: [
      { text: "Friday's proposal", d: 'this week' },
      { text: 'Promised: 20-min walk every day', d: 'last week' },
    ]},
  ] : [
    { titleKey: 'record.group.you', count: 12, items: [
      { text: '习惯凌晨 1 点睡', d: 'day 3' },
      { text: '喝拿铁不加糖', d: 'day 5' },
      { text: '外婆做的桂花糕', d: 'day 22' },
      { text: '会因为下雨心情低落', d: 'day 14' },
    ]},
    { titleKey: 'record.group.people', count: 5, items: [
      { text: '老周（同事）', d: 'day 8' },
      { text: '阿酱（猫）', d: 'day 11' },
      { text: '妈妈', d: 'day 1' },
    ]},
    { titleKey: 'record.group.thoughts', count: 4, items: [
      { text: '周五的提案', d: '本周' },
      { text: '答应每天散步 20 分钟', d: '上周' },
    ]},
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeader titleKey="nav.memory" subtitleKey="record.subtitle" rightRaw={`21 ${t('record.items')}`} />
      <div style={{ maxWidth: 940, margin: '24px auto', padding: isMobile ? '0 16px 40px' : '0 56px 80px' }}>
        <div className="glass-soft" style={{
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18,
          padding: '10px 14px', borderRadius: 12,
        }}>
          <IconSearch size={14} color="var(--ink-muted)" />
          <input placeholder={t('record.search')} style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, color: 'var(--ink)',
          }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.16em' }}>21 {t('record.items')}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
          {groups.map((g, i) => (
            <div key={i} className="glass-strong" style={{
              borderRadius: 14, overflow: 'hidden',
              animation: `fade-in .4s ${i * 0.06}s ease-out both`,
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--line-soft)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span className="grotesk" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{t(g.titleKey)}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 600 }}>{g.count}</span>
              </div>
              <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none' }}>
                {g.items.map((it, j) => (
                  <li key={j} style={{
                    padding: '10px 16px',
                    fontSize: 12.5, color: 'var(--ink)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-bg-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ flex: 1 }}>{it.text}</span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>{it.d}</span>
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%', padding: '9px 14px',
                background: 'transparent', border: 'none',
                borderTop: '1px solid var(--line-soft)',
                color: 'var(--ink-muted)', fontSize: 11, cursor: 'pointer',
                letterSpacing: '0.04em', textAlign: 'center',
              }}>+ {lang === 'en' ? 'Add' : '添加'}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
