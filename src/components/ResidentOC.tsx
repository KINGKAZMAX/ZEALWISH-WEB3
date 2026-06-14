import { useState } from "react";
import { OcAvatar } from "./OcAvatar";

export function ResidentOC() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", right: 22, bottom: 22, zIndex: 5,
        display: "flex", flexDirection: "column", alignItems: "flex-end",
        pointerEvents: "auto", userSelect: "none",
      }}
    >
      {hovered && (
        <div style={{
          marginBottom: 8, padding: "7px 11px", borderRadius: 10,
          background: "oklch(0.96 0.04 175)", border: "0.5px solid oklch(0.85 0.06 175)",
          color: "oklch(0.32 0.07 175)", fontSize: 12, lineHeight: 1.4, maxWidth: 220,
          boxShadow: "var(--shadow-pop)", animation: "fade-in .25s ease-out",
        }}>
          我在这儿，不打扰你。
        </div>
      )}
      <div style={{ filter: hovered ? "none" : "grayscale(0.15)", transition: "filter .3s" }}>
        <OcAvatar size={56} />
      </div>
    </div>
  );
}
