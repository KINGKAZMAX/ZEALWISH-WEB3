import { useEffect, useMemo, useState } from "react";
import { useChat } from "../hooks/useChat";
import { ChatView } from "./ChatView";
import { CreateView } from "./CreateView";
import { MemoryView } from "./MemoryView";
import { MyOcView } from "./MyOcView";
import { OcDesktopShell } from "./OcDesktopShell";
import { OcProfileCard } from "./OcProfileCard";
import { OcWorkspaceHeader } from "./OcWorkspaceHeader";
import { RewindView } from "./RewindView";
import { SettingsView } from "./SettingsView";
import { WorldView } from "./WorldView";
import { SplashScreen } from "./SplashScreen";
import { type SessionId, bootRows, type ViewId, resolveInitialView, visibleMessages } from "./shared";

export function OcWorldApp() {
  const chat = useChat();
  const [view, setView] = useState<ViewId>("oc");
  const [selectedSession, setSelectedSession] = useState<SessionId>("live");
  const [splash, setSplash] = useState<"visible" | "leaving" | "hidden">("visible");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [initialViewResolved, setInitialViewResolved] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);

  const messages = useMemo(
    () => visibleMessages(chat.history, chat.pendingMessages, chat.isSending, selectedSession),
    [chat.history, chat.isSending, chat.pendingMessages, selectedSession],
  );

  useEffect(() => {
    if (initialViewResolved || !chat.relationship) {
      return;
    }

    setView(resolveInitialView(chat.character));
    setInitialViewResolved(true);
  }, [chat.character, chat.relationship, initialViewResolved]);

  useEffect(() => {
    if (memoryOpen) {
      setView("memory");
    }
  }, [memoryOpen]);

  const handleViewChange = (nextView: ViewId) => {
    setSettingsOpen(false);
    if (nextView === "memory") {
      setMemoryOpen(true);
      return;
    }
    setMemoryOpen(false);
    setView(nextView);
  };

  const sendPrompt = async (text: string) => {
    if (!text.trim()) return;
    setSelectedSession("live");
    setView("chat");
    await chat.sendMessage(text);
  };

  const startBlankChat = () => {
    setSelectedSession("new");
    setView("chat");
  };

  const dismissSplash = () => {
    setSplash("leaving");
    window.setTimeout(() => setSplash("hidden"), 500);
  };

  const handleCreateSave = async (data: { name: string; personality: string; catchphrase: string; relationshipSetup: string; avatarPath?: string }) => {
    if (!window.ocWorld) {
      throw new Error("IPC not available");
    }

    await window.ocWorld.character.saveCurrent({
      characterId: "char-001",
      character: {
        id: "char-001",
        name: data.name,
        personality: data.personality,
        catchphrase: data.catchphrase,
        relationshipSetup: data.relationshipSetup,
        avatarLabel: data.name,
        avatarPath: data.avatarPath,
      },
    });

    await chat.refreshState();
    setInitialViewResolved(true);
    setSelectedSession("live");
    setView("oc");
  };

  const handleUserNameChange = async (name: string) => {
    if (!window.ocWorld || !chat.relationship) {
      throw new Error("Relationship not available");
    }

    await window.ocWorld.relationship.save({
      userId: chat.relationship.userId,
      relationship: { ...chat.relationship, userName: name },
    });

    await chat.refreshState();
  };

  const leftPanel = (
    <OcProfileCard
      character={chat.character}
      relationship={chat.relationship}
      greeting={chat.greeting}
      ttsEnabled={chat.ttsEnabled}
      growthInsights={chat.growthInsights}
      growthProfile={chat.growthProfile}
      revealHint={chat.activeReveal}
      onTtsToggle={() => chat.setTtsEnabled(!chat.ttsEnabled)}
      onOpenChat={() => {
        setView("chat");
        setMemoryOpen(false);
      }}
      onOpenMemory={() => setMemoryOpen(true)}
    />
  );

  const header = <OcWorkspaceHeader current={memoryOpen ? "memory" : view} onChange={handleViewChange} onOpenSettings={() => setSettingsOpen(true)} />;

  const content = !initialViewResolved ? (
    <WorkspaceLoading />
  ) : settingsOpen ? (
    <SettingsView
      character={chat.character}
      relationship={chat.relationship}
      onUserNameChange={handleUserNameChange}
      onRecreateOC={() => {
        setSettingsOpen(false);
        setView("create");
      }}
      onBack={() => setSettingsOpen(false)}
    />
  ) : renderView({
    view: memoryOpen ? "chat" : view,
    messages,
    selectedSession,
    chat,
    onSend: sendPrompt,
    onCreateSave: handleCreateSave,
    onCancelCreate: () => setView("oc"),
    canCancelCreate: Boolean(chat.character?.name?.trim()),
    onOpenChat: () => {
      setView("chat");
      setMemoryOpen(false);
    },
    onOpenCreate: () => setView("create"),
    onOpenRewind: () => setView("rewind"),
    onOpenWorld: () => setView("world"),
    onOpenMemory: () => setMemoryOpen(true),
    onCloseMemory: () => setMemoryOpen(false),
    memoryOpen,
    onNewChat: startBlankChat,
  });

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "var(--bg-page)" }}>
      {splash !== "hidden" && (
        <SplashScreen
          rows={bootRows(chat.character, chat.relationship, chat.hermesStatus.state)}
          leaving={splash === "leaving"}
          onEnter={dismissSplash}
        />
      )}

      <OcDesktopShell left={leftPanel} header={header}>
        {content}
      </OcDesktopShell>
    </div>
  );
}

function renderView({
  view,
  messages,
  selectedSession,
  chat,
  onSend,
  onCreateSave,
  onCancelCreate,
  canCancelCreate,
  onOpenChat,
  onOpenCreate,
  onOpenRewind,
  onOpenWorld,
  onOpenMemory,
  onCloseMemory,
  memoryOpen,
  onNewChat,
}: {
  view: ViewId;
  messages: ReturnType<typeof visibleMessages>;
  selectedSession: SessionId;
  chat: ReturnType<typeof useChat>;
  onSend: (text: string) => Promise<void>;
  onCreateSave: (data: { name: string; personality: string; catchphrase: string; relationshipSetup: string; avatarPath?: string }) => Promise<void>;
  onCancelCreate: () => void;
  canCancelCreate: boolean;
  onOpenChat: () => void;
  onOpenCreate: () => void;
  onOpenRewind: () => void;
  onOpenWorld: () => void;
  onOpenMemory: () => void;
  onCloseMemory: () => void;
  memoryOpen: boolean;
  onNewChat: () => void;
}) {
  if (view === "create") {
    return <CreateView onSave={onCreateSave} onCancel={onCancelCreate} canCancel={canCancelCreate} />;
  }

  if (view === "oc") {
    return (
      <MyOcView
        character={chat.character}
        relationship={chat.relationship}
        greeting={chat.greeting}
        onOpenChat={onOpenChat}
        onOpenCreate={onOpenCreate}
        onOpenRewind={onOpenRewind}
        onOpenMemory={onOpenMemory}
      />
    );
  }

  if (view === "chat") {
    return (
      <>
        <ChatView
          character={chat.character}
          messages={messages}
          isSending={chat.isSending}
          selectedSession={selectedSession}
          ttsEnabled={chat.ttsEnabled}
          voiceInputState={chat.voiceInputState}
          voiceTranscript={chat.voiceTranscript}
          relationship={chat.relationship}
          ocAvatarPath={chat.character?.avatarPath}
          revealHint={chat.activeReveal}
          revealBusy={chat.revealBusy}
          recallHint={chat.activeRecallHint}
          onSend={onSend}
          onInterrupt={chat.interruptActiveTurn}
          onTtsToggle={() => chat.setTtsEnabled(!chat.ttsEnabled)}
          onVoiceToggle={chat.toggleVoiceInput}
          onConfirmReveal={chat.confirmReveal}
          onDismissReveal={chat.dismissReveal}
          onRejectReveal={chat.rejectReveal}
          onDismissRecallHint={chat.dismissRecallHint}
          onOpenMemory={onOpenMemory}
          onNewChat={onNewChat}
        />
        <MemoryView
          relationship={chat.relationship}
          timeline={chat.timeline}
          growthProfile={chat.growthProfile}
          growthInsights={chat.growthInsights}
          open={memoryOpen}
          onClose={onCloseMemory}
        />
      </>
    );
  }

  if (view === "world") {
    return (
      <WorldView
        character={chat.character}
        relationship={chat.relationship}
      />
    );
  }

  if (view === "rewind") {
    return <RewindView timeline={chat.timeline} relationship={chat.relationship} />;
  }

  return (
    <MemoryView
      relationship={chat.relationship}
      timeline={chat.timeline}
      growthProfile={chat.growthProfile}
      growthInsights={chat.growthInsights}
      open={true}
      onClose={onCloseMemory}
    />
  );
}

function WorkspaceLoading() {
  return (
    <div className="oc-page oc-loading-page">
      <section className="oc-hero-card">
        <div>
          <p className="oc-kicker mono">RESTORING</p>
          <h2 className="oc-page-title serif">正在恢复你的 OC 世界</h2>
          <p className="oc-page-copy">角色、关系和最近上下文正在接回当前会话。</p>
        </div>
      </section>
    </div>
  );
}
