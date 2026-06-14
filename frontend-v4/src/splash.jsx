// OCWORLD splash — chunky 黑体 hero, OC waves from the corner.

const BOOT_LINES = [
['00.00', 'OCWORLD · 你的桌面伙伴'],
['00.04', '为你预留一个 OC 位置 ·'],
['00.18', 'TA 还没有名字 · 等你命名'],
['00.31', 'ready · 推门']];


function Splash({ onEnter, fadingOut }) {
  const [shown, setShown] = React.useState(0);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (shown < BOOT_LINES.length) {
      const t = setTimeout(() => setShown((s) => s + 1), 280 + Math.random() * 140);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setReady(true), 280);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div
      className={fadingOut ? 'splash-fading' : ''}
      style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background:
        'radial-gradient(900px 700px at 78% 22%, oklch(0.96 0.04 220) 0%, transparent 60%), ' +
        'radial-gradient(700px 600px at 14% 90%, oklch(0.96 0.04 165) 0%, transparent 55%), ' +
        '#fff',
        userSelect: 'none', overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr',
        gridTemplateRows: '1fr'
      }}>
      
      {/* LEFT — hero type + body + boot log + CTA */}
      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '54px 56px 54px 64px',
        minWidth: 0
      }}>
        {/* eyebrow */}
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          alignItems: 'center', gap: 8,
          padding: '4px 10px',
          border: '1px solid var(--line)',
          borderRadius: 999,
          fontSize: 10, fontFamily: 'ui-monospace, monospace',
          letterSpacing: '0.22em',
          color: 'var(--ink-muted)', textTransform: 'uppercase',
          marginBottom: 22,
          background: '#fff'
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-deep)' }} />
          OCWORLD · v0.1
        </div>

        {/* HERO — chunky 黑体, 3 lines, middle italic */}
        <h1 className="heitai" style={{
          margin: 0,
          fontSize: 'clamp(60px, 7.2vw, 104px)',
          lineHeight: 0.95,
          color: 'var(--ink)',
          letterSpacing: '-0.025em',
          animation: 'fade-in .8s ease-out'
        }}>
          <div style={{ display: 'block' }}>HELLO <span style={{ color: 'var(--accent-deep)', fontFamily: "-apple-system" }}>
OC WORLD</span></div>
        </h1>

        {/* sub-hero — smaller 黑体 / italic, two lines */}
        <div className="heitai" style={{
          marginTop: 14,
          fontSize: 'clamp(24px, 2.4vw, 34px)',
          lineHeight: 1.15,
          letterSpacing: '-0.015em',
          animation: 'fade-in .9s ease-out'
        }}>
          <div style={{
            display: 'block',
            fontFamily: '"PingFang TC"',
            fontStyle: 'italic',
            fontWeight: 700,
            color: 'oklch(0.72 0 0)'
          }}>为你生成一个</div>
          <div style={{
            display: 'block',
            fontFamily: '"PingFang TC"',
            color: 'var(--ink)',
            marginTop: 2
          }}>专属的 OC 角色<span style={{ color: 'var(--accent-deep)' }}>。</span></div>
        </div>

        {/* subhead — heavy but smaller */}
        <div className="heitai" style={{
          marginTop: 20,
          fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em',
          color: 'var(--ink)'
        }}>
          住在桌面角落，一直都在。
        </div>

        <p style={{
          marginTop: 14, fontSize: 14.5, lineHeight: 1.75,
          color: 'var(--ink-muted)', maxWidth: 520,
          fontFamily: "'Noto Sans SC', 'PingFang SC', sans-serif"
        }}>
          OCWORLD 为你生成一个 OC（Original Character）——不是 app，
          也不是聊天机器人。TA 住在你屏幕的边缘，不抢你的注意力，只在该出现时出现。
        </p>

        {/* Boot log + CTA row */}
        <div style={{
          marginTop: 26,
          display: 'flex', alignItems: 'flex-end', gap: 28,
          flexWrap: 'wrap'
        }}>
          <div style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 11.5, lineHeight: 1.85,
            color: 'var(--ink-subtle)',
            minHeight: 96, minWidth: 280,
            paddingLeft: 12,
            borderLeft: '2px solid var(--accent)'
          }}>
            {BOOT_LINES.slice(0, shown).map(([t, msg], i) =>
            <div key={i} style={{ animation: 'boot-in .25s ease-out both', display: 'flex', gap: 14 }}>
                <span style={{ color: 'var(--accent-deep)', width: 36 }}>{t}</span>
                <span style={{ color: i === shown - 1 ? 'var(--ink)' : 'var(--ink-subtle)' }}>{msg}</span>
              </div>
            )}
            {shown < BOOT_LINES.length &&
            <span style={{
              display: 'inline-block', width: 7, height: 12,
              background: 'var(--accent-deep)', verticalAlign: 'middle',
              animation: 'blink 1s steps(2) infinite',
              marginTop: 4
            }} />
            }
          </div>

          {ready &&
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
              onClick={onEnter}
              style={{
                appearance: 'none', cursor: 'pointer', border: 'none',
                background: 'var(--ink)', color: '#fff',
                padding: '14px 22px', borderRadius: 12,
                fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
                display: 'inline-flex', alignItems: 'center', gap: 12,
                animation: 'fade-in .4s ease-out',
                transition: 'all .15s ease',
                boxShadow: '0 8px 18px -10px rgba(0,0,0,0.5)'
              }}
              onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-1px)';}}
              onMouseLeave={(e) => {e.currentTarget.style.transform = 'translateY(0)';}}>
              
                推门进入
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint)' }} />
              </button>
              <button
              onClick={onEnter}
              style={{
                appearance: 'none', cursor: 'pointer',
                border: '1px solid var(--line)', background: '#fff',
                color: 'var(--ink-muted)', padding: '14px 16px',
                borderRadius: 12, fontSize: 12, fontWeight: 500,
                animation: 'fade-in .4s ease-out'
              }}>
              
                生成我的 OC →
              </button>
            </div>
          }
        </div>
      </div>

      {/* RIGHT — OC stage */}
      <div style={{
        position: 'relative',
        borderLeft: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 30px',
        background: 'linear-gradient(180deg, oklch(0.985 0.01 220) 0%, #fff 100%)'
      }}>
        {/* ground glow */}
        <div aria-hidden style={{
          position: 'absolute', left: '50%', bottom: 120, transform: 'translateX(-50%)',
          width: 300, height: 56, borderRadius: '50%',
          background: 'radial-gradient(closest-side, oklch(0.92 0.05 220) 0%, transparent 70%)',
          filter: 'blur(2px)'
        }} />
        {/* pulse rings */}
        <div aria-hidden style={{
          position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)',
          width: 220, height: 220, borderRadius: '50%',
          border: '1px solid oklch(0.85 0.06 220)',
          animation: 'pulse-ring 3s ease-out infinite'
        }} />
        <div aria-hidden style={{
          position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)',
          width: 320, height: 320, borderRadius: '50%',
          border: '1px solid oklch(0.90 0.04 220)',
          opacity: 0.6
        }} />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fade-in .8s ease-out' }}>
          <OCMark scale={2.4} />
          <div style={{
            marginTop: 16, fontFamily: 'ui-monospace, monospace',
            fontSize: 10, letterSpacing: '0.22em',
            color: 'var(--ink-muted)', textTransform: 'uppercase'
          }}>
            SAMPLE · XZ · OC#0001
          </div>
        </div>

        {/* corner crop marks */}
        {[
        { top: 18, left: 18, borders: 'border-top: 1px solid var(--line); border-left: 1px solid var(--line);' },
        { top: 18, right: 18, borders: 'border-top: 1px solid var(--line); border-right: 1px solid var(--line);' },
        { bottom: 18, left: 18, borders: 'border-bottom: 1px solid var(--line); border-left: 1px solid var(--line);' },
        { bottom: 18, right: 18, borders: 'border-bottom: 1px solid var(--line); border-right: 1px solid var(--line);' }].
        map((m, i) =>
        <div key={i} aria-hidden style={{
          position: 'absolute', width: 14, height: 14,
          top: m.top, left: m.left, right: m.right, bottom: m.bottom,
          borderTop: m.top != null ? '1px solid var(--ink-muted)' : 'none',
          borderLeft: m.left != null ? '1px solid var(--ink-muted)' : 'none',
          borderRight: m.right != null ? '1px solid var(--ink-muted)' : 'none',
          borderBottom: m.bottom != null ? '1px solid var(--ink-muted)' : 'none',
          opacity: 0.4
        }} />
        )}
      </div>
    </div>);

}

Object.assign(window, { Splash });