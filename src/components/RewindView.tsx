import type { Relationship, TimelineItem } from "../types";

export function RewindView({ timeline, relationship }: { timeline: TimelineItem[]; relationship: Relationship | null }) {
  const items = timeline.length
    ? timeline.slice().reverse()
    : [{ date: new Date().toISOString(), event: "等待第一段真实成长记录。", impact: 0, intimacyAfter: relationship?.intimacy ?? 0 }];

  return (
    <div className="oc-page oc-rewind-page">
      <section className="oc-hero-card">
        <div>
          <p className="oc-kicker mono">REWIND</p>
          <h2 className="oc-page-title serif">回溯</h2>
          <p className="oc-page-copy">把你和 TA 之间长出来的小事，按时间慢慢排开。</p>
        </div>
      </section>

      <section className="oc-timeline-list">
        {items.map((item, index) => (
          <article key={`${item.date}-${item.event}`} className={index === 0 ? "oc-timeline-item is-latest" : "oc-timeline-item"}>
            <div className="oc-timeline-item__date mono">{new Date(item.date).toLocaleString()}</div>
            <div className="oc-timeline-item__event">{item.event}</div>
            <div className="oc-timeline-item__meta">亲密度 {item.impact >= 0 ? `+${item.impact}` : item.impact} · 当前 {item.intimacyAfter}</div>
          </article>
        ))}
      </section>
    </div>
  );
}
