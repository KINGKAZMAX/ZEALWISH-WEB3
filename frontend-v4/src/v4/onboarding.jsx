// ZEALWISH v4 — character passport creation ritual.
// 4-step PCB onboarding: ignite → visual style → prompt → meet.
// English-only, replayable from settings.

const OC_PROMPT_EXAMPLE = 'An adventurous boy with a red cap, cool expression, tactical goggles, small ponytail, white background, pixel art style, red windbreaker, backpack, and a small isekai companion pet. Keep the color system consistent across style and outfit variations. No boots; flat skate sneakers and long loose wide-leg pants.';

const VISUAL_STYLES = [
  { id: 'pixel',   en: 'Pixel Art',  glyph: 'PX' },
  { id: 'anime',   en: 'Anime',      glyph: 'AN' },
  { id: 'cyber',   en: 'Cyber Mech', glyph: 'CY' },
  { id: 'figure',  en: '3D Figure',  glyph: '3D' },
  { id: 'comic',   en: 'Comic Ink',  glyph: 'CM' },
  { id: 'arcade',  en: 'Arcade',     glyph: 'AR' },
];

// PCB circuit backdrop — animated traces converging to center
function PCBBackdrop({ phase = 0 }) {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.85 }}>
      <defs>
        <radialGradient id="pcb-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="400" cy="250" r="180" fill="url(#pcb-glow)" />
      {[
        'M 0 80 L 180 80 L 200 100 L 320 100 L 360 140',
        'M 800 80 L 620 80 L 600 100 L 480 100 L 440 140',
        'M 0 420 L 180 420 L 200 400 L 320 400 L 360 360',
        'M 800 420 L 620 420 L 600 400 L 480 400 L 440 360',
        'M 0 250 L 200 250 L 240 220 L 360 220',
        'M 800 250 L 600 250 L 560 280 L 440 280',
        'M 400 0 L 400 100 L 380 130',
        'M 400 500 L 400 380 L 420 360',
      ].map((d, i) => (
        <path key={i} d={d}
          fill="none" stroke="var(--accent)" strokeOpacity="0.7"
          strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="240"
          style={{ animation: `pcb-trace ${1.4 + i * 0.12}s ease-out forwards`, animationDelay: `${i * 0.08}s` }} />
      ))}
      {/* node pads */}
      {[[200,80],[320,100],[600,80],[480,100],[200,420],[320,400],[600,420],[480,400],[200,250],[600,250],[400,100],[400,380]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3"
          fill="var(--accent)"
          style={{ animation: 'pcb-pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
      ))}
      {/* center pad */}
      <circle cx="400" cy="250" r="6" fill="var(--accent)" />
      <circle cx="400" cy="250" r="14" fill="none" stroke="var(--accent)" strokeOpacity="0.5"
        style={{ animation: 'pulse-ring 2.4s ease-out infinite' }} />
    </svg>
  );
}

function OnboardingRitual({ onComplete }) {
  const [step, setStep] = React.useState(0);
  const [visualStyle, setVisualStyle] = React.useState(null);
  const [ocPrompt, setOCPrompt] = React.useState(() => localStorage.getItem('ocworld.ocDescription') || OC_PROMPT_EXAMPLE);
  const [matchedName, setMatchedName] = React.useState('');
  const promptReady = ocPrompt.trim().length > 0;

  // generate match name when reaching step 3
  React.useEffect(() => {
    if (step === 3 && !matchedName) {
      const pool = ['XZ', 'KURO', 'AYA', 'LIN', 'NOA', 'SOL', 'MIRA', 'IO'];
      setMatchedName(pool[Math.floor(Math.random() * pool.length)]);
    }
  }, [step, matchedName]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 99,
      background: 'var(--bg-base)',
      display: 'grid', placeItems: 'center',
      overflow: 'hidden',
    }}>
      <PCBBackdrop phase={step} />
      {/* fine grid overlay for that "boot screen" feel */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--ink-faint) 1px, transparent 1px), linear-gradient(90deg, var(--ink-faint) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.06, pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: 'min(720px, 92%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30,
        animation: 'fade-in .6s ease-out',
      }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {[0,1,2,3].map(i => (
            <React.Fragment key={i}>
              <div className="mono" style={{
                fontSize: 10, color: i <= step ? 'var(--accent)' : 'var(--ink-faint)',
                letterSpacing: '0.22em', fontWeight: 700,
                transition: 'color .3s',
              }}>NT 0{i+1}</div>
              {i < 3 && <div style={{ width: 22, height: 1, background: i < step ? 'var(--accent)' : 'var(--line)' }} />}
            </React.Fragment>
          ))}
        </div>

        {step === 0 && (
          <>
            <div className="grotesk" style={{
              fontSize: 11, letterSpacing: '0.4em', color: 'var(--ink-muted)',
            }}>ZEALWISH · IGNITION</div>
            <h1 className="heitai" style={{
              fontSize: 'clamp(40px, 6vw, 64px)', margin: 0, textAlign: 'center',
              color: 'var(--ink)', lineHeight: 1.1,
            }}>
              Let me move into your world.
            </h1>
            <p className="serif" style={{
              fontSize: 16, color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 460,
              lineHeight: 1.6, fontStyle: 'italic', margin: 0,
            }}>
              A character that will keep you company is being ignited.
            </p>
            <button onClick={() => setStep(1)} className="grotesk" style={ritualBtn}>
              Begin →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="mono" style={ritualLabel}>STEP 1 · STYLE BASE</div>
            <h2 className="heitai" style={ritualHead}>What visual style should they appear in?</h2>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
              width: '100%',
            }}>
              {VISUAL_STYLES.map(a => {
                const on = visualStyle === a.id;
                return (
                  <button key={a.id} onClick={() => setVisualStyle(a.id)}
                    className={on ? 'glass-strong' : 'glass'}
                    style={{
                      padding: '18px 14px', borderRadius: 12,
                      border: on ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                      cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 14,
                      transition: 'all .2s',
                      color: 'var(--ink)',
                    }}
                  >
                    <div className="heitai" style={{
                      width: 40, height: 40, display: 'grid', placeItems: 'center',
                      borderRadius: 8, fontSize: 20,
                      background: on ? 'var(--accent)' : 'var(--accent-soft)',
                      color: on ? '#FFFFFF' : 'var(--accent)',
                    }}>{a.glyph}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.en}</span>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.2em', marginTop: 2 }}>{a.id.toUpperCase()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ ...ritualBtnSecondary }}>← Back</button>
              <button onClick={() => visualStyle && setStep(2)} disabled={!visualStyle}
                style={{ ...ritualBtn, opacity: visualStyle ? 1 : 0.4, cursor: visualStyle ? 'pointer' : 'not-allowed' }}>
                Next →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mono" style={ritualLabel}>STEP 2 · CHARACTER PROMPT</div>
            <h2 className="heitai" style={ritualHead}>Describe the character you want to generate.</h2>
            <textarea
              value={ocPrompt}
              onChange={(e) => setOCPrompt(e.target.value)}
              className="mono"
              placeholder="Example: an adventurous boy with a red cap, cool expression, tactical goggles..."
              style={{
                width: '100%',
                minHeight: 150,
                resize: 'vertical',
                boxSizing: 'border-box',
                padding: '16px 18px',
                borderRadius: 2,
                border: '1px solid var(--accent)',
                background: 'rgba(10,10,10,0.78)',
                color: 'var(--ink)',
                outline: 'none',
                fontSize: 13,
                lineHeight: 1.7,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 30px rgba(255,45,85,0.10)',
              }}
            />
            <div className="mono" style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              color: 'var(--ink-faint)',
              fontSize: 9,
              letterSpacing: '0.12em',
            }}>
              <span>Saved as the core character generation prompt</span>
              <span>{ocPrompt.trim().length} CHARS</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={ritualBtnSecondary}>← Back</button>
              <button onClick={() => promptReady && setStep(3)} disabled={!promptReady}
                style={{ ...ritualBtn, opacity: promptReady ? 1 : 0.4, cursor: promptReady ? 'pointer' : 'not-allowed' }}>
                Summon →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="mono" style={ritualLabel}>STEP 3 · MEETING POINT</div>
            <div style={{ animation: 'fade-in .8s ease-out' }}>
              <ResidentOC size={160} blush={true} mood="shy" name={matchedName} />
            </div>
            <h2 className="heitai" style={{ ...ritualHead, fontSize: 28 }}>
              {`Hi, I'm ${matchedName}.`}
            </h2>
            <p className="serif" style={{
              fontSize: 15, color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 460,
              lineHeight: 1.7, fontStyle: 'italic', margin: 0,
            }}>
              Starting today, I live in the corner of your desktop.<br />I won't get in your way — but I'll be here.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button onClick={() => { setMatchedName(''); setStep(2); }} style={ritualBtnSecondary}>Try another</button>
              <button onClick={() => onComplete({ name: matchedName, visualStyle, ocDescription: ocPrompt.trim() || OC_PROMPT_EXAMPLE })} style={ritualBtn}>
                It's you →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ritualBtn = {
  padding: '12px 26px',
  background: 'var(--accent)', color: '#FFFFFF',
  border: '1px solid var(--accent)',
  borderRadius: 999, cursor: 'pointer',
  fontSize: 13, fontWeight: 600, letterSpacing: '0.06em',
  boxShadow: '0 8px 22px -8px var(--accent)',
  transition: 'all .15s',
  fontFamily: 'Space Grotesk, Inter, sans-serif',
};
const ritualBtnSecondary = {
  padding: '12px 22px',
  background: 'transparent', color: 'var(--ink-muted)',
  border: '1px solid var(--line)',
  borderRadius: 999, cursor: 'pointer',
  fontSize: 12, fontWeight: 500, letterSpacing: '0.06em',
  transition: 'all .15s',
  fontFamily: 'Space Grotesk, Inter, sans-serif',
};
const ritualLabel = {
  fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.32em', fontWeight: 600,
};
const ritualHead = {
  margin: 0, fontSize: 'clamp(28px, 4vw, 40px)', textAlign: 'center', color: 'var(--ink)', lineHeight: 1.15,
};

window.OnboardingRitual = OnboardingRitual;
