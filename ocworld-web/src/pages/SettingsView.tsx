import { useLang } from '@/hooks/useLang';
import { useIsMobile } from '@/hooks/useIsMobile';
import ViewHeader from '@/components/ViewHeader';

export default function SettingsView() {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeader titleKey="nav.settings" subtitleKey="settings.subtitle" rightRaw="OC#0001" />
      <div style={{ maxWidth: 720, margin: '24px auto', padding: isMobile ? '0 16px 40px' : '0 56px 80px' }}>
        <SettingsSection title={t('settings.section.character')}>
          <SettingsRow label={t('settings.name')} hint={t('settings.name.hint')}>
            <input defaultValue="XZ" style={settingsInput} />
          </SettingsRow>
          <SettingsRow label={t('settings.callme')} hint={t('settings.callme.hint')}>
            <input defaultValue={lang === 'en' ? 'kiddo' : '小伙伴'} style={settingsInput} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t('settings.section.ui')}>
          <SettingsRow label={t('settings.hue')} hint={t('settings.hue.hint')}>
            <input type="range" min="0" max="360" step="5" defaultValue="0"
              style={{ width: 160 }} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t('settings.section.demo')}>
          <SettingsRow label={t('settings.replay')} hint={t('settings.replay.hint')}>
            <button className="glass-soft" style={{
              padding: '7px 14px', borderRadius: 8,
              color: 'var(--ink)', cursor: 'pointer',
              fontSize: 12, fontWeight: 500,
            }}>{t('settings.replay.btn')}</button>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '0 4px' }}>
        <span className="grotesk" style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--line-soft)' }} />
      </div>
      <div className="glass-strong" style={{ borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16,
      borderBottom: '1px solid var(--line-soft)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

const settingsInput: React.CSSProperties = {
  padding: '7px 12px', border: '1px solid var(--line)', background: 'var(--glass-bg-strong)',
  fontSize: 13, color: 'var(--ink)', outline: 'none', borderRadius: 8,
  fontFamily: 'inherit', minWidth: 120, maxWidth: '100%',
  backdropFilter: 'blur(10px)',
};
