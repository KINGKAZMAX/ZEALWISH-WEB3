const ocFrame = [
  "....OOOOOO......",
  "...OHHHHHHO.....",
  "..OHHHHHHHHO....",
  "..OHHSSSSHHO....",
  "..OSEESSEESO....",
  "..OSSSSSSSSO....",
  "...OSSCSSCSO....",
  "....OOSSSOOO....",
  "...OJJJJJJJO....",
  "..OJJKJJJKJJO...",
  "..OJJJJJJJJJO...",
  "..OJKJJJJJJKO...",
  "..OJJJJJJJJJO...",
  "...OJPPPPPJO....",
  "....OPPPPPO.....",
  "....OPPPPPO.....",
  "....OPPPPPO.....",
  "....OBBBBBO.....",
  "...OBBBOBBBO....",
  "....OOO.OOO.....",
];

const palette: Record<string, string> = {
  O: "oklch(0.22 0.04 175)",
  S: "oklch(0.86 0.04 60)",
  H: "oklch(0.55 0.13 50)",
  J: "oklch(0.62 0.13 175)",
  K: "oklch(0.42 0.10 180)",
  P: "oklch(0.32 0.04 240)",
  B: "oklch(0.22 0.02 240)",
  E: "oklch(0.18 0.02 240)",
};

export function OCMark({
  size = 32,
  animated = true,
  scale = null,
  blush = true,
}: {
  size?: number;
  animated?: boolean;
  scale?: number | null;
  blush?: boolean;
}) {
  const cell = scale ?? Math.max(2, Math.floor(size / 16));
  const width = ocFrame[0].length;
  const height = ocFrame.length;
  const pixelWidth = width * cell;
  const pixelHeight = height * cell;
  const colors: Record<string, string> = {
    ...palette,
    C: blush ? "oklch(0.78 0.10 10)" : "oklch(0.86 0.04 60)",
  };

  return (
    <svg
      width={pixelWidth}
      height={pixelHeight}
      viewBox={`0 0 ${pixelWidth} ${pixelHeight}`}
      shapeRendering="crispEdges"
      style={{
        display: "block",
        animation: animated ? "oc-bob 3s ease-in-out infinite" : "none",
        imageRendering: "pixelated",
      }}
    >
      {ocFrame.flatMap((row, y) =>
        [...row].map((char, x) => {
          if (char === ".") {
            return null;
          }

          return (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill={colors[char] || colors.J}
            />
          );
        }),
      )}
    </svg>
  );
}

export function OCWordmark({ markSize = 24, fontSize = 14 }: { markSize?: number; fontSize?: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <OCMark size={markSize} scale={1.5} />
      <span
        style={{
          fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
          fontSize,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "var(--ink)",
        }}
      >
        OC<span style={{ color: "var(--accent-deep)", margin: "0 1px" }}>·</span>WORLD
      </span>
    </div>
  );
}
