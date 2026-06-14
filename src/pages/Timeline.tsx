import { GrowthTimeline } from "../components/GrowthTimeline";
import { useChat } from "../hooks/useChat";

export function TimelinePage() {
  const { character, timeline } = useChat();

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div>
        <div style={{ fontSize: 30, fontWeight: 700 }}>{character?.name ?? "OC"} 的成长记录</div>
        <div style={{ color: "#94a3b8", marginTop: 8 }}>用预置数据和聊天里的 growth event 撑起时间线展示。</div>
      </div>
      <GrowthTimeline items={timeline} />
    </section>
  );
}
