// OCWORLD v4 — OC creation ritual.
// 4-step PCB onboarding: ignite → visual style → prompt → meet.
// Cinematic; only shown on first run, replayable from settings.

const OC_PROMPT_EXAMPLE = '一个带红帽子的冒险少年，酷酷表情，战术护目镜，扎小马尾子，背景白色，像素风格，红色风衣，背包，随身异世界宠物根据我的形象不断的去生成不同的风格和服装，但是色系一致，不要马丁鞋，穿平底 Nike 板鞋，长筒宽松的裤子';

const VISUAL_STYLES = [
  { id: 'pixel',   zh: '像素风',   en: 'Pixel Art',  glyph: '像' },
  { id: 'anime',   zh: '二次元',   en: 'Anime',      glyph: '二' },
  { id: 'cyber',   zh: '赛博机械', en: 'Cyber Mech', glyph: '械' },
  { id: 'figure',  zh: '3D 手办',  en: '3D Figure',  glyph: '3D' },
  { id: 'comic',   zh: '漫画线稿', en: 'Comic Ink',  glyph: '漫' },
  { id: 'arcade',  zh: '复古街机', en: 'Arcade',     glyph: '机' },
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
  const { lang } = useT();
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

  const T = (zh, en) => (lang === 'en' ? en : zh);

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
            }}>OCWORLD · IGNITION</div>
            <h1 className="heitai" style={{
              fontSize: 'clamp(40px, 6vw, 64px)', margin: 0, textAlign: 'center',
              color: 'var(--ink)', lineHeight: 1.1,
            }}>
              {T('让我，住进你的世界。', 'Let me move into your world.')}
            </h1>
            <p className="serif" style={{
              fontSize: 16, color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 460,
              lineHeight: 1.6, fontStyle: 'italic', margin: 0,
            }}>
              {T('一个会陪你的角色，正在被点亮。', 'A character that will keep you company is being ignited.')}
            </p>
            <button onClick={() => setStep(1)} className="grotesk" style={ritualBtn}>
              {T('开始 →', 'Begin →')}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="mono" style={ritualLabel}>{T('STEP 1 · 选择风格', 'STEP 1 · STYLE BASE')}</div>
            <h2 className="heitai" style={ritualHead}>{T('你想让 TA 以哪种视觉风格出现？', 'What visual style should they appear in?')}</h2>
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
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'en' ? a.en : a.zh}</span>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.2em', marginTop: 2 }}>{a.id.toUpperCase()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ ...ritualBtnSecondary }}>{T('← 返回', '← Back')}</button>
              <button onClick={() => visualStyle && setStep(2)} disabled={!visualStyle}
                style={{ ...ritualBtn, opacity: visualStyle ? 1 : 0.4, cursor: visualStyle ? 'pointer' : 'not-allowed' }}>
                {T('下一步 →', 'Next →')}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mono" style={ritualLabel}>{T('STEP 2 · 输入提示词', 'STEP 2 · CHARACTER PROMPT')}</div>
            <h2 className="heitai" style={ritualHead}>{T('直接描述你想生成的 OC。', 'Describe the OC you want to generate.')}</h2>
            <textarea
              value={ocPrompt}
              onChange={(e) => setOCPrompt(e.target.value)}
              className="mono"
              placeholder={T('例如：一个带红帽子的冒险少年，酷酷表情，战术护目镜……', 'Example: an adventurous boy with a red cap, cool expression, tactical goggles...')}
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
              <span>{T('会作为生成 OC 的核心描述保存', 'Saved as the core OC generation prompt')}</span>
              <span>{ocPrompt.trim().length} CHARS</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={ritualBtnSecondary}>{T('← 返回', '← Back')}</button>
              <button onClick={() => promptReady && setStep(3)} disabled={!promptReady}
                style={{ ...ritualBtn, opacity: promptReady ? 1 : 0.4, cursor: promptReady ? 'pointer' : 'not-allowed' }}>
                {T('召唤角色 →', 'Summon →')}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="mono" style={ritualLabel}>{T('STEP 3 · 数字生命相遇', 'STEP 3 · MEETING POINT')}</div>
            <div style={{ animation: 'fade-in .8s ease-out' }}>
              <ResidentOC size={160} blush={true} mood="shy" name={matchedName} />
            </div>
            <h2 className="heitai" style={{ ...ritualHead, fontSize: 28 }}>
              {T(`你好，我是 ${matchedName}。`, `Hi, I'm ${matchedName}.`)}
            </h2>
            <p className="serif" style={{
              fontSize: 15, color: 'var(--ink-muted)', textAlign: 'center', maxWidth: 460,
              lineHeight: 1.7, fontStyle: 'italic', margin: 0,
            }}>
              {T('从今天起，我住在你桌面的角落。\n不打扰你，但我会一直在。',
                  "Starting today, I live in the corner of your desktop.\nI won't get in your way — but I'll be here.")}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button onClick={() => { setMatchedName(''); setStep(2); }} style={ritualBtnSecondary}>{T('再选一个', 'Try another')}</button>
              <button onClick={() => onComplete({ name: matchedName, visualStyle, ocDescription: ocPrompt.trim() || OC_PROMPT_EXAMPLE })} style={ritualBtn}>
                {T('就是你了 →', "It's you →")}
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
