const SPRITE_SRC = '/assets/xz.png';
const SPRITE_W = 38;
const SPRITE_H = 48;

interface OCMarkProps {
  size?: number;
  animated?: boolean;
  scale?: number | null;
  blush?: boolean;
}

export default function OCMark({ size = 64, animated = true, scale = null, blush = true }: OCMarkProps) {
  const cell = scale ?? Math.max(1, Math.round(size / SPRITE_W));
  const W = SPRITE_W * cell;
  const H = SPRITE_H * cell;

  return (
    <div style={{
      width: W, height: H,
      display: 'block',
      animation: animated ? 'oc-bob 3s ease-in-out infinite' : 'none',
      filter: 'drop-shadow(0 0 10px rgba(255,45,85,0.35))',
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
