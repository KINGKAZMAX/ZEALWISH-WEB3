import { IconSettings } from "./OcWorldIcons";
import { type ViewId } from "./shared";

export function OcWorkspaceHeader({ current, onChange, onOpenSettings }: { current: ViewId; onChange: (view: ViewId) => void; onOpenSettings: () => void }) {
  const title =
    current === "chat" ? "先对话，系统在背后长出来" :
    current === "memory" ? "Luma 正在学会你" :
    current === "world" ? "OC 的像素世界" : "OC World";
  const subtitle =
    current === "chat"
      ? "一开始不展示人生系统。OC 先陪伴、记住、理解，再等待你探索。"
      : current === "memory"
        ? "这些不是第一屏功能，是慢慢被发现的成长系统。"
        : current === "world"
          ? "像素办公室 · OC 在这里生活、工作、等待你。"
          : "让隐藏成长系统在关系里自然浮现。";

  return (
    <header className="oc-demo-header">
      <div>
        <h1 className="serif">{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="oc-demo-header__actions">
        <button type="button" className="oc-pill-button" onClick={() => onChange(current === "world" ? "memory" : "world")}>
          {current === "world" ? "记忆" : "世界"}
        </button>
        <button type="button" className="oc-pill-button oc-pill-button--quiet" onClick={onOpenSettings} title="设置" aria-label="设置">
          <IconSettings size={15} />
          设置
        </button>
      </div>
    </header>
  );
}
