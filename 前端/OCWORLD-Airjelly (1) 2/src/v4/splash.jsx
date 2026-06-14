// OCWORLD v3 splash — glass + gradient, light/dark aware, bilingual.
// Hero: HELLO OC WORLD chunky, with subhead 「角落的住人 / The corner dweller」.

function SplashV2({ onEnter, fadingOut }) {
  const { t, lang } = useT();
  const BOOT_LINES = lang === 'en' ? [
    ['00.00', 'OCWORLD · v0.4 · black signal terminal'],
    ['00.04', 'reserving a slot for one OC ·'],
    ['00.18', 'TA has no name yet · waiting for you'],
    ['00.31', 'ready · push the door'],
  ] : [
    ['00.00', 'OCWORLD · v0.4 · 黑色信号终端'],
    ['00.04', '为你预留一个 OC 位置 ·'],
    ['00.18', 'TA 还没有名字 · 等你命名'],
    ['00.31', 'ready · 推门'],
  ];

  const [shown, setShown] = React.useState(0);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (shown < BOOT_LINES.length) {
      const t = setTimeout(() => setShown(s => s + 1), 280 + Math.random() * 140);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setReady(true), 240);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div
      className={fadingOut ? 'splash-fading' : ''}
      style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: 'var(--bg-base)',
        userSelect: 'none', overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1.35fr 1fr',
      }}
    >
      {/* drifting blobs that subtly tint the page */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'radial-gradient(900px 700px at 78% 22%, var(--accent-soft) 0%, transparent 55%), '+
          'radial-gradient(700px 600px at 14% 90%, var(--accent-soft-2) 0%, transparent 55%)',
      }} />
      {/* Crop marks at outer corners */}
      {[
        { top: 16, left: 16, t: true, l: true },
        { top: 16, right: 16, t: true, r: true },
        { bottom: 16, left: 16, b: true, l: true },
        { bottom: 16, right: 16, b: true, r: true },
      ].map((m, i) => (
        <div key={i} aria-hidden style={{
          position: 'absolute', width: 18, height: 18,
          top: m.top, left: m.left, right: m.right, bottom: m.bottom,
          borderTop:    m.t ? '1px solid var(--line)' : 'none',
          borderLeft:   m.l ? '1px solid var(--line)' : 'none',
          borderRight:  m.r ? '1px solid var(--line)' : 'none',
          borderBottom: m.b ? '1px solid var(--line)' : 'none',
          opacity: 0.6, zIndex: 5,
        }} />
      ))}

      {/* Top marquee — glass ribbon */}
      <div aria-hidden className="glass-soft" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 28,
        borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        display: 'flex', alignItems: 'center',
        overflow: 'hidden', zIndex: 4,
      }}>
        <div className="mono" style={{
          display: 'flex', gap: 36, whiteSpace: 'nowrap',
          fontSize: 10, letterSpacing: '0.22em',
          color: 'var(--ink-muted)',
          animation: 'marquee 60s linear infinite',
          paddingLeft: 36,
        }}>
          {Array.from({ length: 2 }).map((_, k) => (
            <React.Fragment key={k}>
              <span>OCWORLD</span><span style={{ color: 'var(--accent-deep)' }}>·</span>
              <span>{lang === 'en' ? 'corner dweller' : '桌面的住人'}</span><span>·</span>
              <span>{lang === 'en' ? 'your private OC' : '你的专属虚拟角色'}</span><span>·</span>
              <span>{lang === 'en' ? 'v0.4 · signal black' : 'v0.4 · 信号黑箱'}</span><span>·</span>
              <span>RECORD · TALK · REWIND · SETTINGS</span><span>·</span>
              <span>EST.027</span><span>·</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* LEFT — type column */}
      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px 56px 60px 72px',
        minWidth: 0,
        filter: 'brightness(1.35)',
      }}>
        {/* eyebrow */}
        <div className="glass-soft" style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          alignItems: 'center', gap: 10,
          padding: '5px 14px', borderRadius: 99,
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.24em',
          color: 'var(--ink-muted)', textTransform: 'uppercase',
          marginBottom: 26,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          {lang === 'en' ? 'OCWORLD · v0.4 · SIGNAL' : 'OCWORLD · v0.4 · 信号黑箱'}
        </div>

        {/* HERO — HELLO OC WORLD */}
        <h1 className="heitai" style={{
          margin: 0,
          fontSize: 'clamp(64px, 7.6vw, 116px)',
          lineHeight: 0.94,
          color: 'var(--ink)',
          letterSpacing: '-0.03em',
          animation: 'fade-in .8s ease-out',
          textShadow: '0 0 18px rgba(255,255,255,0.16), 0 0 32px rgba(255,45,85,0.12)',
        }}>
          HELLO <span style={{
            color: 'var(--accent)',
            display: 'inline-block',
            position: 'relative',
          }}>
            OC WORLD
            <span aria-hidden style={{
              position: 'absolute', left: -8, right: -8, bottom: '0.04em',
              height: 4, background: 'var(--accent)', opacity: 0.18,
              zIndex: -1,
            }} />
          </span>
        </h1>

        {/* sub-hero */}
        <div className="heitai" style={{
          marginTop: 16,
          fontSize: 'clamp(22px, 2.2vw, 32px)',
          lineHeight: 1.15,
          letterSpacing: '-0.015em',
          animation: 'fade-in .9s .1s ease-out both',
        }}>
          <div style={{ fontStyle: 'italic', fontWeight: 700, color: 'rgba(255,255,255,0.76)' }}>
            {lang === 'en' ? 'we make you' : '为你生成一个'}
          </div>
          <div style={{ color: 'var(--ink)', marginTop: 2 }}>
            {lang === 'en' ? <>your own OC<span style={{ color: 'var(--accent)' }}>.</span></> : <>专属的 OC 角色<span style={{ color: 'var(--accent)' }}>。</span></>}
          </div>
        </div>

        <p style={{
          marginTop: 22, fontSize: 14, lineHeight: 1.75,
          color: 'rgba(255,255,255,0.78)', maxWidth: 520,
          animation: 'fade-in .9s .2s ease-out both',
        }}>
          {lang === 'en'
            ? 'OCWORLD generates an OC (Original Character) for you — not an app, not a chatbot. They live at the edge of your screen, never demanding your attention, only showing up when they should.'
            : 'OCWORLD 为你生成一个 OC（Original Character）——不是 app，也不是聊天机器人。TA 住在你屏幕的边缘，不抢你的注意力，只在该出现时出现。'}
        </p>

        {/* boot log + CTA */}
        <div style={{
          marginTop: 30,
          display: 'flex', alignItems: 'flex-end', gap: 32,
          flexWrap: 'wrap',
        }}>
          <div className="mono" style={{
            fontSize: 11.5, lineHeight: 1.85,
            color: 'rgba(255,255,255,0.66)',
            minHeight: 96, minWidth: 280,
            paddingLeft: 14,
            borderLeft: '2px solid var(--accent)',
          }}>
            {BOOT_LINES.slice(0, shown).map(([t, msg], i) => (
              <div key={i} style={{ animation: 'boot-in .25s ease-out both', display: 'flex', gap: 14 }}>
                <span style={{ color: 'var(--accent-deep)', width: 36 }}>{t}</span>
                <span style={{ color: i === shown - 1 ? 'var(--ink)' : 'rgba(255,255,255,0.66)' }}>{msg}</span>
              </div>
            ))}
            {shown < BOOT_LINES.length && (
              <span style={{
                display: 'inline-block', width: 7, height: 12,
                background: 'var(--accent)', verticalAlign: 'middle',
                animation: 'blink 1s steps(2) infinite',
                marginTop: 4,
              }} />
            )}
          </div>

          {ready && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={onEnter}
                style={{
                  appearance: 'none', cursor: 'pointer', border: 'none',
                  background: 'var(--accent)', color: '#FFFFFF',
                  padding: '14px 22px', borderRadius: 12,
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  display: 'inline-flex', alignItems: 'center', gap: 12,
                  animation: 'fade-in .4s ease-out',
                  transition: 'all .15s ease',
                  boxShadow: '0 8px 24px -6px rgba(255,45,85,0.5)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 14px 30px -8px rgba(255,45,85,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(255,45,85,0.5)';
                }}
              >
                {lang === 'en' ? 'OPEN THE DOOR' : '推门进入'}
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF' }} />
              </button>
              <button
                onClick={onEnter}
                className="glass-soft"
                style={{
                  appearance: 'none', cursor: 'pointer',
                  color: 'var(--ink)', padding: '14px 16px',
                  borderRadius: 12, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  animation: 'fade-in .4s ease-out',
                }}
              >
                {lang === 'en' ? 'GENERATE MY OC →' : '生成我的 OC →'}
              </button>
            </div>
          )}
        </div>

        {/* footer marker */}
        <div className="mono" style={{
          position: 'absolute', bottom: 28, left: 72,
          fontSize: 10, letterSpacing: '0.22em',
          color: 'var(--ink-faint)', textTransform: 'uppercase',
          display: 'flex', gap: 16,
        }}>
          <span>Boot · 0.3.27</span>
          <span style={{ color: 'var(--accent)' }}>●</span>
          <span>Connected</span>
        </div>
      </div>

      {/* RIGHT — OC stage */}
      <div style={{
        position: 'relative',
        borderLeft: '1px solid var(--line-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 30px',
        overflow: 'hidden',
      }}>
        {/* concentric rings — kept thin and pure red */}
        {[260, 360, 460, 560].map((d, i) => (
          <div key={i} aria-hidden style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            width: d, height: d, borderRadius: '50%',
            border: '1px solid var(--accent)',
            opacity: 0.12 + (4 - i) * 0.05,
          }} />
        ))}
        <div aria-hidden style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 200, height: 200, borderRadius: '50%',
          border: '1.5px solid var(--accent)',
          animation: 'pulse-ring 3s ease-out infinite',
        }} />

        {/* 3D isometric virtual plaza — wireframe platform */}
        <svg aria-hidden viewBox="-200 -160 400 320" style={{
          position: 'absolute', left: '50%', top: '54%',
          transform: 'translate(-50%, -50%)',
          width: 440, height: 352, opacity: 0.95,
        }}>
          <defs>
            <linearGradient id="plat" x1="0" y1="-1" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity=".9"/>
              <stop offset="1" stopColor="#FFFFFF" stopOpacity=".45"/>
            </linearGradient>
          </defs>
          {/* outer iso ring */}
          <g stroke="var(--accent)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="0" cy="40" rx="180" ry="60" strokeWidth="1" opacity=".25"/>
            <ellipse cx="0" cy="40" rx="140" ry="46" strokeWidth="1" opacity=".35"/>
            <ellipse cx="0" cy="40" rx="100" ry="32" strokeWidth="1" opacity=".5"/>
            <ellipse cx="0" cy="40" rx="60"  ry="20" strokeWidth="1.4" opacity=".7"/>
          </g>
          {/* iso platform — hex */}
          <g stroke="var(--ink)" strokeWidth="1.4" fill="url(#plat)" strokeLinejoin="round">
            <polygon points="0,-30 90,15 90,40 0,85 -90,40 -90,15" />
            <polyline points="-90,15 0,60 90,15" fill="none" />
            <line x1="0" y1="60" x2="0" y2="85" />
          </g>
          {/* grid on platform top */}
          <g stroke="var(--accent)" strokeWidth=".6" opacity=".45" fill="none">
            <line x1="-60" y1="0" x2="30" y2="45" />
            <line x1="-30" y1="-15" x2="60" y2="30" />
            <line x1="60" y1="0" x2="-30" y2="45" />
            <line x1="30" y1="-15" x2="-60" y2="30" />
          </g>
          {/* floating cubes — wire */}
          <g stroke="var(--ink)" strokeWidth="1" fill="#FFFFFF">
            <g transform="translate(-110,-40)">
              <polygon points="0,0 18,-9 36,0 36,21 18,30 0,21" />
              <line x1="0" y1="0" x2="18" y2="9" />
              <line x1="36" y1="0" x2="18" y2="9" />
              <line x1="18" y1="9" x2="18" y2="30" />
            </g>
            <g transform="translate(80,-70)">
              <polygon points="0,0 14,-7 28,0 28,16 14,23 0,16" fill="var(--accent-paper)" />
              <line x1="0" y1="0" x2="14" y2="7" />
              <line x1="28" y1="0" x2="14" y2="7" />
              <line x1="14" y1="7" x2="14" y2="23" />
            </g>
            <g transform="translate(120,30)">
              <polygon points="0,0 12,-6 24,0 24,14 12,20 0,14" />
              <line x1="0" y1="0" x2="12" y2="6" />
              <line x1="24" y1="0" x2="12" y2="6" />
              <line x1="12" y1="6" x2="12" y2="20" />
            </g>
          </g>
          {/* axis ticks */}
          <g stroke="var(--accent)" strokeWidth=".8" opacity=".7">
            <line x1="-90" y1="15" x2="-90" y2="5" />
            <line x1="90" y1="15" x2="90" y2="5" />
            <line x1="0" y1="-30" x2="0" y2="-40" />
          </g>
        </svg>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fade-in .8s ease-out', zIndex: 2 }}>
          <OCMark scale={2.4} />
          <div className="glass-soft mono" style={{
            marginTop: 16, fontSize: 10, letterSpacing: '0.24em',
            color: 'var(--ink)', textTransform: 'uppercase',
            padding: '5px 12px', borderRadius: 99,
          }}>
            SAMPLE · XZ · OC#0001
          </div>
        </div>

        {/* tag corner */}
        <div className="mono" style={{
          position: 'absolute', top: 50, right: 28,
          fontSize: 10, color: 'var(--accent)',
          letterSpacing: '0.28em',
          fontWeight: 700, textAlign: 'right',
          textTransform: 'uppercase',
        }}>
          {lang === 'en' ? <>VIRTUAL<br/>SPACE · 3D</> : <>虚拟空间<br/>VIRTUAL · 3D</>}
        </div>
        <div className="mono" style={{
          position: 'absolute', bottom: 30, right: 28,
          fontSize: 10, letterSpacing: '0.2em',
          color: 'var(--ink-muted)', textAlign: 'right',
        }}>
          ID 0001 / 0001<br/>
          <span style={{ color: 'var(--accent)' }}>● ALIVE</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SplashV2 });
