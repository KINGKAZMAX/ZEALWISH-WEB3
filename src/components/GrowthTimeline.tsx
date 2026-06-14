import type { TimelineItem } from "../types";

export function GrowthTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {items.map((item) => (
        <article
          key={`${item.date}-${item.event}`}
          style={{
            padding: 18,
            borderRadius: 18,
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
          }}
        >
          <div style={{ color: "#94a3b8", fontSize: 13 }}>{new Date(item.date).toLocaleString()}</div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 600 }}>{item.event}</div>
          <div style={{ marginTop: 8, color: "#cbd5e1" }}>影响：{item.impact >= 0 ? `+${item.impact}` : item.impact}</div>
          <div style={{ marginTop: 6, color: "#f8fafc" }}>亲密度阶段值：{item.intimacyAfter}</div>
        </article>
      ))}
    </div>
  );
}
