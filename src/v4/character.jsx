// ZEALWISH v4 — Resident OC character.
// A small "living" SVG character with breathing, blinking, eye tracking, blush.
// Replaces the abstract OCMark in the desktop corner.

function ResidentOC({ size = 140, blush = true, mood = 'idle', name = 'XZ' }) {
  const wrapRef = React.useRef(null);
  const [blink, setBlink] = React.useState(false);
  const [eyes, setEyes] = React.useState({ x: 0, y: 0 });
  const [hovered, setHovered] = React.useState(false);

  // periodic blink
  React.useEffect(() => {
    let t;
    const loop = () => {
      const next = 2400 + Math.random() * 2600;
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        loop();
      }, next);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  // eye tracking
  React.useEffect(() => {
    const onMove = (e) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2 - 8;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const len = Math.hypot(dx, dy) || 1;
      const max = 2.4;
      setEyes({ x: (dx / len) * Math.min(max, len / 60), y: (dy / len) * Math.min(max, len / 60) });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // mood drives the mouth + blush + bob speed
  const mouth = mood === 'happy' ? 'M 50 67 Q 60 75 70 67'
              : mood === 'shy'   ? 'M 52 68 Q 60 72 68 68'
              : mood === 'think' ? 'M 52 70 L 68 70'
              :                    'M 52 69 Q 60 73 68 69';

  return (
    <div
      ref={wrapRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: size, height: size * (180/120),
        display: 'grid', placeItems: 'center',
        animation: 'oc-breathe 4.5s ease-in-out infinite',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <svg viewBox="0 0 120 180" width={size} height={size * (180/120)} style={{ overflow: 'visible' }}>
        {/* shadow puddle */}
        <ellipse cx="60" cy="172" rx="32" ry="4" fill="rgba(0,0,0,0.12)" />

        {/* body — soft hoodie shape, accent gradient */}
        <defs>
          <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent-soft)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0.85" />
          </linearGradient>
          <radialGradient id="cheekG" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path d="M 30 165 Q 30 110 60 110 Q 90 110 90 165 Z" fill="url(#bodyG)" />
        <path d="M 30 165 Q 30 110 60 110 Q 90 110 90 165 Z" fill="none" stroke="var(--ink)" strokeOpacity="0.35" strokeWidth="1" />

        {/* head */}
        <circle cx="60" cy="65" r="38" fill="var(--glass-bg-strong)" stroke="var(--ink)" strokeOpacity="0.42" strokeWidth="1.2" />

        {/* hair tuft */}
        <path d="M 28 56 Q 40 28 60 30 Q 82 28 92 56 Q 86 44 72 44 Q 60 36 50 44 Q 40 44 28 56 Z"
          fill="var(--ink)" fillOpacity="0.78" />
        <path d="M 56 33 Q 60 26 64 33" stroke="var(--ink)" strokeOpacity="0.78" strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* eyes */}
        <g transform={`translate(${eyes.x}, ${eyes.y})`}>
          {blink ? (
            <>
              <line x1="44" y1="64" x2="52" y2="64" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
              <line x1="68" y1="64" x2="76" y2="64" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="48" cy="63" rx="3" ry="4.2" fill="var(--ink)" />
              <ellipse cx="72" cy="63" rx="3" ry="4.2" fill="var(--ink)" />
              <circle cx="49" cy="61.5" r="1.1" fill="#FFFFFF" />
              <circle cx="73" cy="61.5" r="1.1" fill="#FFFFFF" />
            </>
          )}
        </g>

        {/* blush */}
        {blush && (
          <>
            <ellipse cx="44" cy="72" rx="6" ry="3" fill="url(#cheekG)" />
            <ellipse cx="76" cy="72" rx="6" ry="3" fill="url(#cheekG)" />
          </>
        )}

        {/* mouth */}
        <path d={mouth} stroke="var(--ink)" strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {/* tiny name tag */}
        <text x="60" y="138" textAnchor="middle"
          fontFamily="JetBrains Mono, monospace" fontSize="6.5"
          fill="var(--ink)" opacity="0.5" letterSpacing="0.3">
          {name}
        </text>
      </svg>

      {hovered && (
        <span style={{
          position: 'absolute', bottom: -4,
          fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em',
          fontFamily: 'JetBrains Mono, monospace',
          animation: 'fade-in .2s ease-out',
        }}>HELLO</span>
      )}
    </div>
  );
}

// add the breathe keyframe to global CSS
(function injectCSS() {
  if (document.getElementById('oc-char-css')) return;
  const s = document.createElement('style');
  s.id = 'oc-char-css';
  s.textContent = `
    @keyframes oc-breathe {
      0%, 100% { transform: translateY(0) scale(1); }
      50%      { transform: translateY(-2px) scale(1.012); }
    }
    @keyframes pcb-trace {
      0%   { stroke-dashoffset: 240; opacity: 0; }
      20%  { opacity: 1; }
      100% { stroke-dashoffset: 0;   opacity: 1; }
    }
    @keyframes pcb-pulse {
      0%, 100% { opacity: 0.4; }
      50%      { opacity: 1;   }
    }
  `;
  document.head.appendChild(s);
})();

window.ResidentOC = ResidentOC;
