import type { Emotion } from "../types";

const colorMap: Record<Emotion, string> = {
  idle: "#94a3b8",
  happy: "#22c55e",
  shy: "#f472b6",
  thinking: "#38bdf8",
  sad: "#a78bfa",
  angry: "#f97316",
};

export function EmotionBadge({ emotion }: { emotion: Emotion }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(15, 23, 42, 0.75)",
        border: `1px solid ${colorMap[emotion]}`,
        color: "#f8fafc",
        fontSize: 14,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: colorMap[emotion],
        }}
      />
      {emotion}
    </span>
  );
}
