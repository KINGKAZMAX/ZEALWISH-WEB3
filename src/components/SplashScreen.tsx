import { useEffect, useState } from "react";
import { OCMark } from "./OcWorldMark";

export function SplashScreen({
  rows,
  leaving,
  onEnter,
}: {
  rows: readonly (readonly [string, string])[];
  leaving: boolean;
  onEnter: () => void;
}) {
  const [shown, setShown] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (shown < rows.length) {
      const timer = window.setTimeout(() => setShown((current) => current + 1), 320 + Math.random() * 160);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setReady(true), 350);
    return () => window.clearTimeout(timer);
  }, [rows.length, shown]);

  return (
    <div
      className={leaving ? "splash-fading" : ""}
      onClick={() => ready && onEnter()}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 100,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "var(--bg-page)",
        cursor: ready ? "pointer" : "default",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(oklch(0.22 0.01 240 / 0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "0.5px solid var(--line)" }}>
        <div style={{ position: "relative" }}>
          <div style={{ animation: "fade-in .6s ease-out" }}>
            <OCMark size={240} scale={14} />
          </div>
          <div style={{ position: "absolute", left: "50%", top: "calc(100% + 18px)", transform: "translateX(-50%)", width: 80, height: 1, background: "var(--line)" }} />
          <div
            style={{
              position: "absolute", left: "50%", top: "calc(100% + 28px)", transform: "translateX(-50%)",
              fontSize: 10, letterSpacing: "0.18em", color: "var(--ink-faint)",
              fontFamily: "ui-monospace, Menlo, monospace", textTransform: "uppercase", whiteSpace: "nowrap",
            }}
          >
            OC · 水母 · jellyfish
          </div>
        </div>

        <div
          style={{
            position: "absolute", top: 32, left: 32,
            fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11,
            color: "var(--ink-faint)", letterSpacing: "0.18em", textTransform: "uppercase",
          }}
        >
          / OCWORLD <span style={{ color: "var(--ink-subtle)" }}>· desktop companion</span>
        </div>
        <div
          style={{
            position: "absolute", bottom: 32, left: 32,
            fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10,
            color: "var(--ink-faint)", letterSpacing: "0.16em", textTransform: "uppercase",
          }}
        >
          AirJelly · Desktop
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
        <div
          style={{
            fontSize: 11, letterSpacing: "0.24em", color: "var(--ink-faint)",
            textTransform: "uppercase", marginBottom: 18,
            fontFamily: "ui-monospace, Menlo, monospace",
          }}
        >
          system · boot
        </div>
        <h1 className="serif" style={{ margin: 0, fontSize: 56, lineHeight: 1.05, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)" }}>
          进入这个世界，<br />你会拥有你的<em style={{ fontStyle: "italic", color: "var(--accent-deep)" }}>第一个伙伴</em>
        </h1>
        <p style={{ margin: "22px 0 0", maxWidth: 440, color: "var(--ink-muted)", fontSize: 14, lineHeight: 1.7 }}>
          它不是工具——它会陪你聊天、理解你的情绪、记住你说过的每一句话。
          更重要的是，它会学习你：你的表达方式、判断逻辑、品味和偏好。
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>你不是在使用 AI，你是在培养另一个自己。</span>
        </p>

        <div
          style={{
            marginTop: 44, fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 12, lineHeight: 1.85, color: "var(--ink-subtle)", minHeight: 200,
          }}
        >
          {rows.slice(0, shown).map(([time, label], index) => (
            <div key={`${time}-${label}-${index}`} style={{ animation: "boot-in .25s ease-out both", display: "flex", gap: 16 }}>
              <span style={{ color: "var(--ink-faint)", width: 56 }}>{time}</span>
              <span style={{ color: "var(--ink-faint)" }}>›</span>
              <span style={{ color: index === shown - 1 ? "var(--ink)" : "var(--ink-subtle)" }}>{label}</span>
            </div>
          ))}
          {shown < rows.length && (
            <span style={{ display: "inline-block", width: 7, height: 14, background: "var(--ink-subtle)", verticalAlign: "middle", animation: "blink 1s steps(2) infinite" }} />
          )}
        </div>

        <div style={{ marginTop: 36, height: 44 }}>
          {ready && (
            <button
              type="button"
              onClick={onEnter}
              style={{
                appearance: "none",
                border: "1px solid var(--line)",
                background: "var(--bg-window)",
                color: "var(--ink)",
                padding: "12px 22px",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontFamily: "ui-monospace, Menlo, monospace",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                animation: "fade-in .4s ease-out",
                transition: "all .2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-deep)"; e.currentTarget.style.color = "var(--accent-deep)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--ink)"; }}
            >
              ▸ Tap to wake TA up
              <span style={{ width: 6, height: 6, background: "var(--accent-deep)", borderRadius: 0 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
