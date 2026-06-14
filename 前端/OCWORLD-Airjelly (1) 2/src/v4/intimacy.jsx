// OCWORLD v4 — intimacy hook + chat header strip.
// 0–100, persisted, with stage labels and a称呼 dictionary the chat uses.

const INTIMACY_STAGES = [
  { min:  0, max: 19,  zh: '陌生',   en: 'Stranger',  call_zh: '你',     call_en: 'you'    },
  { min: 20, max: 49,  zh: '熟悉',   en: 'Familiar',  call_zh: '小伙伴', call_en: 'friend' },
  { min: 50, max: 79,  zh: '朋友',   en: 'Friend',    call_zh: '亲爱的', call_en: 'dear'   },
  { min: 80, max: 100, zh: '亲密',   en: 'Intimate',  call_zh: '宝贝',   call_en: 'darling'},
];

function stageOf(value) {
  return INTIMACY_STAGES.find(s => value >= s.min && value <= s.max) || INTIMACY_STAGES[0];
}

function useIntimacy() {
  const [value, setValue] = React.useState(() => {
    const v = parseInt(localStorage.getItem('ocworld.intimacy') || '32', 10);
    return isNaN(v) ? 32 : v;
  });
  const [day, setDay] = React.useState(() => {
    const v = parseInt(localStorage.getItem('ocworld.day') || '27', 10);
    return isNaN(v) ? 27 : v;
  });

  const bump = (delta) => {
    setValue(v => {
      const next = Math.max(0, Math.min(100, v + delta));
      localStorage.setItem('ocworld.intimacy', String(next));
      return next;
    });
  };
  const reset = () => {
    setValue(32);
    localStorage.setItem('ocworld.intimacy', '32');
  };

  const stage = stageOf(value);
  return { value, day, bump, reset, stage, setValue, setDay };
}

function IntimacyStrip({ value, day, name = 'XZ' }) {
  const { lang } = useT();
  const stage = stageOf(value);
  const label = lang === 'en' ? stage.en : stage.zh;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 14px',
      borderRadius: 12,
      border: '1px solid var(--glass-border)',
      background: 'var(--glass-bg-soft)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'var(--accent-soft)',
        border: '1.5px solid var(--accent)',
        display: 'grid', placeItems: 'center',
        fontSize: 11, fontWeight: 700, color: 'var(--accent)',
        fontFamily: 'JetBrains Mono, monospace',
      }}>{name.slice(0,2)}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 78 }}>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.22em', fontWeight: 600 }}>
          {lang === 'en' ? `DAY ${day}` : `第 ${day} 天`}
        </span>
        <span style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>{label}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-muted)', letterSpacing: '0.22em', fontWeight: 600 }}>
            {lang === 'en' ? 'INTIMACY' : '亲密度'}
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>{value} / 100</span>
        </div>
        <div style={{
          height: 4, background: 'var(--line-soft)',
          borderRadius: 99, overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            width: value + '%', height: '100%',
            background: 'linear-gradient(90deg, var(--accent), var(--accent-deep))',
            borderRadius: 99, transition: 'width .6s ease',
          }} />
          {/* stage markers */}
          {[20,50,80].map(m => (
            <div key={m} style={{
              position: 'absolute', left: m + '%', top: -2, bottom: -2,
              width: 1, background: 'var(--ink-faint)', opacity: 0.4,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

window.useIntimacy = useIntimacy;
window.IntimacyStrip = IntimacyStrip;
window.stageOf = stageOf;
window.INTIMACY_STAGES = INTIMACY_STAGES;
