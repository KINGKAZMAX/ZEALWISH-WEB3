import { IconArrowUp, IconAttach, IconBars, IconBolt, IconCloud, IconMic } from "./OcWorldIcons";
import { iconBtnQuiet } from "./shared";
import type { VoiceInputState } from "../lib/voice-input";

export function Composer({
  draft,
  setDraft,
  placeholder,
  onSubmit,
  compact,
  isSending,
  ttsEnabled,
  onInterrupt,
  onTtsToggle,
  voiceInputState,
  voiceTranscript,
  onVoiceToggle,
}: {
  draft: string;
  setDraft: (value: string) => void;
  placeholder: string;
  onSubmit: () => void;
  compact?: boolean;
  isSending?: boolean;
  ttsEnabled?: boolean;
  onInterrupt?: () => void;
  onTtsToggle?: () => void;
  voiceInputState?: VoiceInputState;
  voiceTranscript?: string;
  onVoiceToggle?: () => void;
}) {
  const isListening = voiceInputState === "listening";
  const voiceTitle = isListening ? "停止语音输入" : voiceInputState === "unsupported" ? "语音输入不可用" : "语音输入";

  return (
    <div style={{ width: "100%", background: "var(--bg-input)", border: "0.5px solid var(--line)", borderRadius: 14, boxShadow: "0 1px 2px rgba(15,30,55,.04)", padding: "14px 16px 10px" }}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={compact ? 1 : 2}
        placeholder={placeholder}
        style={{ width: "100%", border: "none", outline: "none", resize: "none", background: "transparent", color: "var(--ink)", fontSize: 14, lineHeight: 1.55, fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <button type="button" style={iconBtnQuiet} title="附件"><IconAttach size={14} /></button>
        <button type="button" style={iconBtnQuiet} title="上下文"><IconCloud size={14} /></button>
        <button type="button" style={iconBtnQuiet} title="模板"><IconBars size={14} /></button>
        {onVoiceToggle && (
          <button
            type="button"
            style={{
              ...iconBtnQuiet,
              background: isListening ? "oklch(0.94 0.06 25)" : "transparent",
              color: isListening ? "oklch(0.52 0.16 25)" : "var(--ink-muted)",
            }}
            onClick={onVoiceToggle}
            disabled={voiceInputState === "unsupported"}
            title={voiceTitle}
          >
            <IconMic size={14} />
          </button>
        )}
        {voiceTranscript && (
          <div style={{ minWidth: 0, maxWidth: 220, color: "var(--ink-muted)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {voiceTranscript}
          </div>
        )}
        <div style={{ flex: 1 }} />
        {onTtsToggle && (
          <button
            type="button"
            style={{ ...iconBtnQuiet, background: ttsEnabled ? "var(--accent-soft)" : "transparent", color: ttsEnabled ? "var(--accent-deep)" : "var(--ink-muted)" }}
            onClick={onTtsToggle}
            title="语音"
          >
            <IconBolt size={14} />
          </button>
        )}
        {onInterrupt && (
          <button
            type="button"
            style={{ ...iconBtnQuiet, color: isSending || ttsEnabled ? "var(--ink)" : "var(--ink-faint)" }}
            onClick={onInterrupt}
            disabled={!isSending && !ttsEnabled}
            title="停止"
          >
            ■
          </button>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!draft.trim()}
          title={isSending ? "追发" : "发送"}
          style={{
            width: 30, height: 30, border: "none", borderRadius: "50%", display: "grid", placeItems: "center",
            cursor: draft.trim() ? "pointer" : "not-allowed",
            background: draft.trim() ? "oklch(0.78 0.10 220)" : "oklch(0.92 0.01 240)",
            color: draft.trim() ? "#fff" : "var(--ink-faint)",
            transition: "background .15s",
          }}
        >
          <IconArrowUp size={14} color={draft.trim() ? "#fff" : "var(--ink-faint)"} />
        </button>
      </div>
    </div>
  );
}
