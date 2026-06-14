import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { useIsMobile } from '@/hooks/useIsMobile';
import ViewHeader from '@/components/ViewHeader';
import Composer from '@/components/Composer';
import OCMark from '@/components/OCMark';

interface HomeViewProps {
  onSendTask: (text: string) => void;
  onPickQuickStart: (kind: string) => void;
  avatarDataUrl?: string;
}

const GATE_ITEMS = [
  { key: 'gate.readme', label: 'Read Me', body: 'gate.readme.body' },
  { key: 'gate.insights', label: 'Insights', body: 'gate.insights.body' },
  { key: 'gate.plan', label: 'Plan', body: 'gate.plan.body' },
  { key: 'gate.unblock', label: 'Unblock', body: 'gate.unblock.body' },
  { key: 'gate.daily', label: 'Daily Report', body: 'gate.daily.body' },
  { key: 'gate.snapshot', label: 'Snapshot', body: 'gate.snapshot.body' },
];

export default function HomeView({ onSendTask, onPickQuickStart, avatarDataUrl }: HomeViewProps) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [text, setText] = useState('');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', position: 'relative' }}>
      <ViewHeader titleKey="nav.home" subtitleKey="home.greeting.kicker" />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isMobile ? '20px 16px 32px' : '32px 56px 60px',
        maxWidth: 960, width: '100%', margin: '0 auto',
      }}>
        {/* Create OC CTA — prominent banner */}
        {!avatarDataUrl && (
          <button
            onClick={() => navigate('/create-oc')}
            className="glass-strong"
            style={{
              width: '100%', marginBottom: 24,
              padding: '18px 24px', borderRadius: 16,
              border: '1px solid var(--accent)',
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all .2s',
              boxShadow: '0 0 28px rgba(255,45,85,0.10)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 36px rgba(255,45,85,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 28px rgba(255,45,85,0.10)';
            }}
          >
            <div>
              <div className="grotesk" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
                {t('home.createOc')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                {t('createOc.subtitle')}
              </div>
            </div>
            <span style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--accent)', color: '#FFFFFF',
              display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700,
            }}>→</span>
          </button>
        )}

        {/* OC stage with greeting card */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr', gap: isMobile ? 16 : 28, alignItems: 'center', marginBottom: isMobile ? 20 : 32 }}>
          <div className="glass-soft" style={{
            position: 'relative', height: 220, borderRadius: 18,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {[160, 220, 280].map((d, i) => (
              <div key={i} aria-hidden style={{
                position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-50%)',
                width: d, height: d, borderRadius: '50%',
                border: '1px solid var(--accent)',
                opacity: 0.10 + i * 0.03,
              }} />
            ))}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="OC portrait" style={{
                  width: 190, height: 108, objectFit: 'contain',
                  borderRadius: 18,
                  border: '1px solid var(--line)',
                  boxShadow: '0 18px 44px -18px rgba(0,0,0,.35)',
                  animation: 'oc-bob 3s ease-in-out infinite',
                }} />
              ) : (
                <img src="/assets/xz.png" alt="XZ" style={{
                  width: 190, height: 108, objectFit: 'contain',
                  borderRadius: 18,
                  border: '1px solid var(--line)',
                  boxShadow: '0 18px 44px -18px rgba(0,0,0,.35)',
                  animation: 'oc-bob 3s ease-in-out infinite',
                }} />
              )}
            </div>
            <div className="mono" style={{
              position: 'absolute', top: 12, left: 12,
              fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-muted)',
              padding: '3px 8px',
              border: '1px solid var(--line)', borderRadius: 99,
              background: 'var(--glass-bg-strong)', backdropFilter: 'blur(10px)',
            }}>OC#0001</div>
            <div className="mono" style={{
              position: 'absolute', bottom: 12, right: 12,
              fontSize: 9, letterSpacing: '0.2em', color: 'var(--accent)', fontWeight: 600,
            }}>● ALIVE</div>
          </div>

          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-subtle)', letterSpacing: '0.22em', marginBottom: 10, textTransform: 'uppercase' }}>
              {t('home.greeting.kicker')}
            </div>
            <div className="serif" style={{ fontSize: 26, lineHeight: 1.45, color: 'var(--ink)', fontWeight: 500, letterSpacing: lang === 'en' ? '-0.005em' : 0 }}>
              "{t('home.greeting.line1')}<br/>
              <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>{t('home.greeting.line2')}</em>"
            </div>
            <div className="mono" style={{ marginTop: 14, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.18em' }}>
              {t('home.greeting.log')}
            </div>
          </div>
        </div>

        {/* Composer */}
        <Composer text={text} setText={setText} onSubmit={() => { onSendTask(text); setText(''); }}
          placeholder={t('home.placeholder')} />

        {/* Quick gates */}
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: 10, marginTop: isMobile ? 16 : 24,
        }}>
          {GATE_ITEMS.map((g, i) => (
            <GateCard key={i} label={t(g.key + '.label')} body={t(g.body)} onClick={() => onPickQuickStart(g.label)} />
          ))}
        </div>

        {/* corner status */}
        <div className="glass-soft" style={{
          marginTop: 22, padding: '10px 16px', borderRadius: 99,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.16em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: 'var(--accent)' }}>●</span>　Web 端演示模式
          </span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', fontWeight: 700, display: 'flex', gap: 10, whiteSpace: 'nowrap' }}>
            <span>AirJelly Mock</span>
            <span>TTS Browser</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function GateCard({ label, body, onClick }: { label: string; body: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={hov ? 'glass-strong' : 'glass-soft'}
      style={{
        textAlign: 'left', padding: 16, borderRadius: 14,
        cursor: 'pointer', transition: 'all .2s',
        position: 'relative', minHeight: 96,
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      <div className="grotesk" style={{
        fontSize: 13, fontWeight: 600, color: hov ? 'var(--accent)' : 'var(--ink)',
        letterSpacing: '0.01em', marginBottom: 8,
        transition: 'color .2s',
      }}>{label}</div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--ink-muted)' }}>{body}</div>
      <span style={{
        position: 'absolute', top: 14, right: 14,
        width: 18, height: 18, borderRadius: 99,
        background: hov ? 'var(--accent)' : 'transparent',
        border: '1px solid ' + (hov ? 'var(--accent)' : 'var(--line)'),
        display: 'grid', placeItems: 'center',
        transition: 'all .2s',
      }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M2 6 L6 2 M6 2 L3 2 M6 2 L6 5" stroke={hov ? '#FFFFFF' : 'var(--ink-faint)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </button>
  );
}
