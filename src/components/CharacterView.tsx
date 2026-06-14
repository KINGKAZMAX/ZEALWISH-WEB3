import type { CharacterConfig, Emotion } from "../types";
import { useAnimation } from "../hooks/useAnimation";

export function CharacterView({
  character,
  emotion,
}: {
  character: CharacterConfig | null;
  emotion: Emotion;
}) {
  const { getAnimationLabel } = useAnimation();

  return (
    <div
      style={{
        borderRadius: 24,
        padding: 24,
        background: "rgba(15, 23, 42, 0.72)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        minHeight: 420,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>角色形象</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{character?.name ?? "加载中"}</div>
        <div style={{ color: "#cbd5e1", marginTop: 8 }}>{character?.avatarLabel ?? "默认立绘"}</div>
      </div>

      <div
        style={{
          display: "grid",
          placeItems: "center",
          flex: 1,
          fontSize: 72,
          color: "#f8fafc",
        }}
      >
        {getAnimationLabel(emotion)}
      </div>

      <div style={{ color: "#94a3b8", fontSize: 14 }}>当前情绪：{emotion}</div>
    </div>
  );
}
