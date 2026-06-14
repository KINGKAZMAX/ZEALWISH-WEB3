import { ChatPanel } from "../components/ChatPanel";
import { CharacterView } from "../components/CharacterView";
import { EmotionBadge } from "../components/EmotionBadge";
import { IntimacySlider } from "../components/IntimacySlider";
import { useChat } from "../hooks/useChat";

export function ChatPage() {
  const {
    character,
    relationship,
    history,
    emotion,
    greeting,
    isSending,
    pendingMessages,
    ttsEnabled,
    cancelSpeech,
    interruptActiveTurn,
    sendMessage,
    setTtsEnabled,
    setDemoIntimacy,
  } = useChat();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 20 }}>
      <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <CharacterView character={character} emotion={emotion} />
        <IntimacySlider value={relationship?.intimacy ?? 0} onChange={setDemoIntimacy} />
      </div>

      <section style={{ display: "grid", gap: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 20px",
            borderRadius: 20,
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
          }}
        >
          <div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{character?.name ?? "OC"}</div>
            <div style={{ color: "#94a3b8", marginTop: 6 }}>
              亲密度 {relationship?.intimacy ?? 0} / 100 · 阶段 {relationship?.stage ?? "..."}
            </div>
          </div>
          <EmotionBadge emotion={emotion} />
        </div>

        <ChatPanel
          greeting={greeting}
          history={history}
          pendingMessages={pendingMessages}
          isSending={isSending}
          ttsEnabled={ttsEnabled}
          onCancelSpeech={cancelSpeech}
          onInterrupt={interruptActiveTurn}
          onSend={async (message) => {
            await sendMessage(message);
          }}
          onTtsEnabledChange={setTtsEnabled}
        />
      </section>
    </div>
  );
}
