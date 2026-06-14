import type { CharacterConfig, Relationship } from "../types";
import { OcAvatar } from "./OcAvatar";
import { stageLabel } from "./shared";

export function OcPanel({
  character,
  relationship,
  ttsEnabled,
  onTtsToggle,
}: {
  character: CharacterConfig | null;
  relationship: Relationship | null;
  ttsEnabled: boolean;
  onTtsToggle: () => void;
}) {
  return (
    <div
      style={{
        width: "20%",
        minWidth: 200,
        maxWidth: 280,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "var(--bg-panel, var(--bg-window))",
        borderRight: "0.5px solid var(--line)",
        padding: "20px 16px",
        position: "relative",
      }}
    >
      <div style={{
        fontSize: 10, letterSpacing: ".18em", color: "var(--ink-faint)",
        fontFamily: "ui-monospace, Menlo, monospace", marginBottom: 8,
      }}>
        OCWORLD
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <OcAvatar name={character?.name} avatarPath={character?.avatarPath} size={140} />
        <div
          className="serif"
          style={{ marginTop: 18, fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)" }}
        >
          {character?.name ?? "OC"}
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-faint)", letterSpacing: ".12em", fontFamily: "ui-monospace, Menlo, monospace" }}>
          {stageLabel(relationship?.stage)} · {relationship?.intimacy ?? 0}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onTtsToggle()}
        style={{
          padding: "10px 28px",
          borderRadius: 24,
          border: ttsEnabled ? "1.5px solid oklch(0.78 0.10 220)" : "1px solid var(--line)",
          background: ttsEnabled ? "oklch(0.96 0.03 220)" : "var(--bg-card)",
          color: ttsEnabled ? "oklch(0.45 0.12 220)" : "var(--ink-muted)",
          fontSize: 12.5,
          cursor: "pointer",
          transition: "all .15s",
          letterSpacing: ".04em",
        }}
      >
        {ttsEnabled ? "朗读中…" : "按住说话"}
      </button>
    </div>
  );
}
