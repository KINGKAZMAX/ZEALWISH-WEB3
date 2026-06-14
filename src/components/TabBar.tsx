import type { ViewId } from "./shared";
import { IconSearch, IconSettings } from "./OcWorldIcons";

const tabs: { id: ViewId; label: string }[] = [
  { id: "chat", label: "对话" },
  { id: "files", label: "文件" },
  { id: "rewind", label: "故事" },
  { id: "memory", label: "OC世界" },
];

export function TabBar({
  current,
  onChange,
  onSettings,
}: {
  current: ViewId;
  onChange: (view: ViewId) => void;
  onSettings: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        height: 48,
        borderBottom: "0.5px solid var(--line)",
        background: "var(--bg-window)",
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const active = current === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              background: "transparent",
              border: "none",
              padding: "0 16px",
              height: "100%",
              cursor: "pointer",
              position: "relative",
              fontSize: 13.5,
              fontWeight: active ? 600 : 400,
              color: active ? "var(--ink)" : "var(--ink-muted)",
              transition: "color .15s",
            }}
          >
            {tab.label}
            {active && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 16,
                  right: 16,
                  height: 2,
                  borderRadius: 1,
                  background: "var(--ink)",
                }}
              />
            )}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <button type="button" style={{ ...iconBtnSmall }} title="搜索">
        <IconSearch size={14} />
      </button>
      <button type="button" style={{ ...iconBtnSmall }} title="设置" onClick={onSettings}>
        <IconSettings size={14} />
      </button>
    </div>
  );
}

const iconBtnSmall: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "grid",
  placeItems: "center",
  background: "transparent",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  color: "var(--ink-muted)",
};
