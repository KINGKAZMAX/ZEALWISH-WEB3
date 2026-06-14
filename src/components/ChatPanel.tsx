import { useMemo, useState } from "react";
import type { ChatHistoryEntry, PendingChatMessage } from "../types";

export function ChatPanel({
  greeting,
  history,
  pendingMessages,
  isSending,
  ttsEnabled,
  onCancelSpeech,
  onInterrupt,
  onSend,
  onTtsEnabledChange,
}: {
  greeting: string;
  history: ChatHistoryEntry[];
  pendingMessages: PendingChatMessage[];
  isSending: boolean;
  ttsEnabled: boolean;
  onCancelSpeech: () => void;
  onInterrupt: () => void;
  onSend: (message: string) => Promise<void>;
  onTtsEnabledChange: (enabled: boolean) => void;
}) {
  const [draft, setDraft] = useState("");

  const messages = useMemo(
    () => [
      ...history.flatMap((entry) => [
        { role: "user", content: entry.userMessage, timestamp: entry.timestamp, key: `${entry.timestamp}-user` },
        {
          role: "assistant",
          content: entry.ocResponse,
          timestamp: entry.timestamp + 1,
          key: `${entry.timestamp}-assistant`,
        },
      ]),
      ...pendingMessages.map((message) => ({
        role: "user",
        content: message.content,
        timestamp: message.timestamp,
        key: message.id,
      })),
      ...(isSending
        ? [
            {
              role: "assistant",
              content: "……",
              timestamp: Date.now(),
              key: "assistant-thinking",
            },
          ]
        : []),
    ],
    [history, isSending, pendingMessages],
  );

  return (
    <section
      style={{
        borderRadius: 24,
        background: "rgba(15, 23, 42, 0.72)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        padding: 20,
        display: "grid",
        gap: 16,
        minHeight: 420,
      }}
    >
      <div>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>欢迎语</div>
        <div style={{ marginTop: 8, fontSize: 18 }}>{greeting || "……"}</div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          alignContent: "start",
          maxHeight: 420,
          overflowY: "auto",
          paddingRight: 6,
        }}
      >
        {messages.map((message) => (
          <div
            key={message.key}
            style={{
              justifySelf: message.role === "user" ? "end" : "start",
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
              padding: "12px 14px",
              borderRadius: 16,
              background: message.role === "user" ? "#2563eb" : "rgba(30, 41, 59, 0.96)",
            }}
          >
            {message.content}
          </div>
        ))}
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          if (!draft.trim()) {
            return;
          }

          const nextDraft = draft;
          setDraft("");
          await onSend(nextDraft);
        }}
        style={{ display: "grid", gap: 10 }}
      >
        <input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            onCancelSpeech();
          }}
          placeholder="输入消息..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 14,
            border: "1px solid rgba(148, 163, 184, 0.24)",
            background: "rgba(15, 23, 42, 0.92)",
            color: "#f8fafc",
            padding: "14px 16px",
          }}
        />
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#cbd5e1", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(event) => onTtsEnabledChange(event.target.checked)}
            />
            语音
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onInterrupt}
              disabled={!isSending && !ttsEnabled}
              style={{
                border: "1px solid rgba(148, 163, 184, 0.28)",
                borderRadius: 14,
                padding: "12px 16px",
                background: isSending || ttsEnabled ? "rgba(15, 23, 42, 0.92)" : "rgba(148, 163, 184, 0.12)",
                color: isSending || ttsEnabled ? "#e2e8f0" : "#64748b",
                fontWeight: 700,
              }}
            >
              停止
            </button>
            <button
              type="submit"
              disabled={!draft.trim()}
              style={{
                border: 0,
                borderRadius: 14,
                padding: "12px 20px",
                background: draft.trim() ? "#f97316" : "rgba(148, 163, 184, 0.2)",
                color: draft.trim() ? "#0f172a" : "#94a3b8",
                fontWeight: 700,
              }}
            >
              {isSending ? "追发" : "发送"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
