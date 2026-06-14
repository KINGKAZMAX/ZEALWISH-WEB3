import type { GrowthInsight, GrowthProfile, Relationship, TimelineItem } from "../types";

function latestWorries(timeline: TimelineItem[]) {
  const items = timeline.slice(-3).reverse().map((item) => item.event);
  return items.length ? items : ["还没有足够线索"];
}

function firstLatent(insights: GrowthInsight[], type: GrowthInsight["type"]) {
  return insights.find((item) => item.type === type && item.status !== "rejected" && item.status !== "archived");
}

export function MemoryView({
  relationship,
  timeline,
  growthProfile,
  growthInsights,
  open,
  onClose,
}: {
  relationship: Relationship | null;
  timeline: TimelineItem[];
  growthProfile: GrowthProfile;
  growthInsights: GrowthInsight[];
  open: boolean;
  onClose: () => void;
}) {
  const target = firstLatent(growthInsights, "goal");
  const strength = firstLatent(growthInsights, "strength") ?? growthProfile.strengths[0];
  const plan = firstLatent(growthInsights, "plan");
  const evidence = latestWorries(timeline);

  const cards = [
    {
      title: "可能的长期目标",
      text: target?.text ?? growthProfile.goals[0]?.text ?? "你在找的不是一个工具，而是一种人和 AI 长期共同成长的关系。",
      status: target ? (target.status === "confirmed" ? "已确认" : "等待更多证据") : "等待更多证据",
      tag: "目标图谱",
    },
    {
      title: "反复出现的优势",
      text: strength?.text ?? "你很擅长从不对劲的感觉里提出更准确的产品定义。",
      status: strength ? "已出现多次" : "正在观察",
      tag: "优势画像",
    },
    {
      title: "最近的成长证据",
      text: evidence.join("；"),
      status: timeline.length ? "默默记录" : "等待更多证据",
      tag: "成长证据",
    },
    {
      title: "下一步规划",
      text: plan?.text ?? "先验证一个最小动作：用户是否愿意每天和 OC 说一件真实经历。",
      status: plan ? "适合现在" : relationship?.moodBaseline ?? "适合现在",
      tag: "规划建议",
    },
  ];

  return (
    <aside className={open ? "oc-memory-drawer is-open" : "oc-memory-drawer"} aria-label="Luma 正在学会你的内容">
      <div className="oc-memory-drawer__head">
        <div>
          <h2 className="serif">Luma 正在学会你</h2>
          <p>这些不是第一屏功能，是慢慢被发现的成长系统。</p>
        </div>
        <button type="button" className="oc-pill-button oc-pill-button--quiet" onClick={onClose}>
          关闭
        </button>
      </div>
      <div className="oc-memory-drawer__body">
        {cards.map((card) => (
          <section key={card.title} className="oc-memory-drawer__card">
            <div className="oc-memory-drawer__card-head">
              <b>{card.title}</b>
              <span className="oc-memory-drawer__tag">{card.tag}</span>
            </div>
            <p>{card.text}</p>
            <div className="oc-memory-drawer__signal-row">
              <span>{card.status}</span>
              <span>可继续校准</span>
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
