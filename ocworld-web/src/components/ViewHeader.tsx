import { useLang } from '@/hooks/useLang';

interface ViewHeaderProps {
  titleKey: string;
  subtitleKey?: string;
  subtitleRaw?: string;
  rightRaw?: string;
}

export default function ViewHeader({ titleKey, subtitleKey, subtitleRaw, rightRaw }: ViewHeaderProps) {
  const { t } = useLang();
  const title = t(titleKey);
  const subtitle = subtitleKey ? t(subtitleKey) : (subtitleRaw || '');

  return (
    <div style={{
      height: 56, padding: '0 28px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--line-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span className="grotesk" style={{ fontSize: 18, color: 'var(--ink)', fontWeight: 600, letterSpacing: '-0.005em' }}>{title}</span>
        {subtitle && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-subtle)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{subtitle}</span>}
      </div>
      {rightRaw && (
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.18em' }}>{rightRaw}</span>
      )}
    </div>
  );
}
