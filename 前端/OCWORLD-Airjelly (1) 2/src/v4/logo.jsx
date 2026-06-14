// OCWORLD mark — XZ. Renders the user's hand-drawn pixel portrait.
// Keeps the legacy <OCMark scale={N}>/animated/blush API so all callers
// (sidebar, splash, views, resident OC) keep working.

const SPRITE_SRC = 'assets/xz.png';
// Native pixel-art footprint we standardize on (matched the prior frame).
const SPRITE_W = 38;
const SPRITE_H = 48;

function OCMark({ size = 64, animated = true, scale = null, blush = true }) {
  // `scale` is "px per source pixel cell" in the legacy API.
  const cell = scale ?? Math.max(1, Math.round(size / SPRITE_W));
  const W = SPRITE_W * cell;
  const H = SPRITE_H * cell;

  return (
    <div style={{
      width: W, height: H,
      display: 'block',
      animation: animated ? 'oc-bob 3s ease-in-out infinite' : 'none',
      // soft contact shadow under the sprite
      filter: 'drop-shadow(0 0 10px rgba(255,45,85,0.35))',
      // subtle warm cheek glow when blush is on (additive radial behind)
      position: 'relative',
    }}>
      {blush && (
        <span aria-hidden style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(closest-side at 50% 60%, rgba(255,45,85,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
      )}
      <img
        src={SPRITE_SRC}
        alt="XZ"
        draggable={false}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          userSelect: 'none',
          display: 'block',
          position: 'relative',
        }}
      />
    </div>
  );
}

function OCWordmark({ markSize = 26, fontSize = 14 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <OCMark scale={0.55} animated={false} />
      <span style={{
        fontFamily: '"Press Start 2P", ui-monospace, monospace',
        fontSize: fontSize - 2, fontWeight: 400,
        letterSpacing: '0.04em',
        color: 'var(--ink)',
      }}>
        OCWORLD
      </span>
    </div>
  );
}

Object.assign(window, { OCMark, OCWordmark });
