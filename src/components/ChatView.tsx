import { useEffect, useRef, useState } from "react";
import type { CharacterConfig, RecallHintEvent, Relationship, RevealCandidate } from "../types";
import type { VoiceInputState } from "../lib/voice-input";
import type { MessageItem, SessionId } from "./shared";
import { OcAvatar, OcAvatarLarge } from "./OcAvatar";
import { Composer } from "./Composer";

type RevealHint = (RevealCandidate & { text?: string; title?: string }) | null;

export function ChatView({
  character,
  messages,
  selectedSession,
  isSending,
  ttsEnabled,
  voiceInputState,
  voiceTranscript,
  relationship,
  ocAvatarPath,
  revealHint,
  revealBusy,
  recallHint,
  onSend,
  onInterrupt,
  onTtsToggle,
  onVoiceToggle,
  onConfirmReveal,
  onDismissReveal,
  onRejectReveal,
  onDismissRecallHint,
  onOpenMemory,
  onNewChat,
}: {
  character: CharacterConfig | null;
  messages: MessageItem[];
  selectedSession: SessionId;
  isSending: boolean;
  ttsEnabled: boolean;
  voiceInputState: VoiceInputState;
  voiceTranscript: string;
  relationship: Relationship | null;
  ocAvatarPath?: string;
  revealHint: RevealHint;
  revealBusy: boolean;
  recallHint: RecallHintEvent | null;
  onSend: (text: string) => Promise<void>;
  onInterrupt: () => void;
  onTtsToggle: () => void;
  onVoiceToggle: () => void;
  onConfirmReveal: (insightId: string) => Promise<void> | void;
  onDismissReveal: (candidateId: string) => Promise<void> | void;
  onRejectReveal: (insightId: string) => Promise<void> | void;
  onDismissRecallHint: () => void;
  onOpenMemory: () => void;
  onNewChat?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, recallHint?.id, revealHint?.id]);

  const submit = () => {
    const text = draft;
    setDraft("");
    void onSend(text);
  };

  return (
    <div className="oc-page oc-chat-page oc-invisible-chat-page">
      <section className="oc-chat-shell oc-invisible-chat-shell">
        <div className="oc-invisible-chat-head">
          <div className="oc-invisible-chat-head__copy">
            <div className="oc-kicker mono">live chat</div>
            <h2 className="serif">{character?.name?.trim() || "Luma"}</h2>
            <p>你只要说真实发生了什么，系统会在背后慢慢长出来。</p>
          </div>
          <div className="oc-invisible-chat-head__actions">
            {selectedSession !== "new" && onNewChat && (
              <button type="button" className="oc-pill-button oc-pill-button--quiet" onClick={onNewChat}>
                新对话
              </button>
            )}
            <button type="button" className="oc-pill-button" onClick={onOpenMemory}>
              探索
            </button>
          </div>
        </div>

        {messages.length === 0 ? (
          <EmptyAgent
            character={character}
            onSend={onSend}
            voiceInputState={voiceInputState}
            voiceTranscript={voiceTranscript}
            onVoiceToggle={onVoiceToggle}
          />
        ) : (
          <div ref={scrollRef} className="oc-chat-scroll oc-invisible-chat-scroll">
            <div className="oc-invisible-time-chip">今天 23:08</div>
            {messages.map((message) => (
              <Bubble
                key={message.key}
                role={message.role}
                text={message.text}
                userName={relationship?.userName}
                ocAvatarPath={ocAvatarPath}
                ocName={character?.name}
              />
            ))}
            {revealHint && (
              <div className="oc-invisible-discovery">
                <p>{revealHint.text ?? "我好像开始看见一个线索。"}</p>
                <div className="oc-invisible-discovery__actions">
                  <button
                    type="button"
                    className="oc-pill-button is-primary"
                    disabled={revealBusy}
                    onClick={() => {
                      void onConfirmReveal(revealHint.insightId);
                      onOpenMemory();
                    }}
                  >
                    看看你发现了什么
                  </button>
                  <button
                    type="button"
                    className="oc-pill-button oc-pill-button--quiet"
                    disabled={revealBusy}
                    onClick={() => void onDismissReveal(revealHint.id)}
                  >
                    先不用展开
                  </button>
                  <button
                    type="button"
                    className="oc-pill-button oc-pill-button--quiet"
                    disabled={revealBusy}
                    onClick={() => void onRejectReveal(revealHint.insightId)}
                  >
                    这个理解不对
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {recallHint && (
          <div className="oc-recall-hint">
            <div className="oc-recall-hint__copy">
              <span className="oc-recall-hint__label mono">recall</span>
              <p>{recallHint.text}</p>
            </div>
            <button type="button" className="oc-pill-button oc-pill-button--quiet" onClick={onDismissRecallHint}>
              知道了
            </button>
          </div>
        )}

        <div className="oc-chat-composer-wrap oc-invisible-composer-wrap">
          <Composer
            draft={draft}
            setDraft={setDraft}
            placeholder={isSending ? "继续追发，TA 会继续接上。" : "我感觉第一版不应该把成长系统都展示出来。"}
            onSubmit={submit}
            compact
            isSending={isSending}
            ttsEnabled={ttsEnabled}
            onInterrupt={onInterrupt}
            onTtsToggle={onTtsToggle}
            voiceInputState={voiceInputState}
            voiceTranscript={voiceTranscript}
            onVoiceToggle={onVoiceToggle}
          />
        </div>
      </section>
    </div>
  );
}

function EmptyAgent({
  character,
  onSend,
  voiceInputState,
  voiceTranscript,
  onVoiceToggle,
}: {
  character: CharacterConfig | null;
  onSend: (text: string) => Promise<void>;
  voiceInputState: VoiceInputState;
  voiceTranscript: string;
  onVoiceToggle: () => void;
}) {
  const [text, setText] = useState("");

  return (
    <div className="oc-chat-empty">
      <OcAvatarLarge size={92} name={character?.name} avatarPath={character?.avatarPath} />
      <div className="oc-chat-empty__copy">
        <div className="serif oc-chat-empty__title">先对话，系统在背后长出来</div>
        <div className="oc-chat-empty__body">你只需要说话，Luma 会在背后慢慢学会你。</div>
      </div>
      <div className="oc-chat-empty__composer">
        <Composer
          draft={text}
          setDraft={setText}
          placeholder="比如：我感觉第一版不应该把成长系统都展示出来。"
          onSubmit={() => {
            if (text.trim()) {
              void onSend(text);
              setText("");
            }
          }}
          voiceInputState={voiceInputState}
          voiceTranscript={voiceTranscript}
          onVoiceToggle={onVoiceToggle}
        />
      </div>
    </div>
  );
}

function Bubble({
  role,
  text,
  userName,
  ocAvatarPath,
  ocName,
}: {
  role: "user" | "oc";
  text: string;
  userName?: string;
  ocAvatarPath?: string;
  ocName?: string;
}) {
  const isOC = role === "oc";

  return (
    <article className={isOC ? "oc-bubble-row" : "oc-bubble-row is-user"}>
      <div className="oc-bubble-avatar">
        {isOC ? (
          <OcAvatar size={34} animated={false} avatarPath={ocAvatarPath} name={ocName} />
        ) : (
          <div className="oc-user-avatar">{(userName ?? "你").slice(0, 1)}</div>
        )}
      </div>
      <div className={isOC ? "oc-bubble" : "oc-bubble is-user"}>
        <div className="oc-bubble__name mono">{isOC ? `${ocName || "Luma"} · 慢慢理解你` : userName || "你"}</div>
        <div className="oc-bubble__text">{text}</div>
      </div>
    </article>
  );
}
