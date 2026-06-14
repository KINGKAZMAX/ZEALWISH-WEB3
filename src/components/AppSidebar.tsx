import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CharacterConfig, Relationship } from "../types";
import {
  IconAgent,
  IconChevron,
  IconCompass,
  IconFolder,
  IconGift,
  IconHome,
  IconPlus,
  IconRewind,
  IconSearch,
  IconSidebar,
  IconSparkle,
  IconTasks,
} from "./OcWorldIcons";
import { OCMark, OCWordmark } from "./OcWorldMark";
import { OcAvatar } from "./OcAvatar";
import { type SessionId, type SessionItem, type ViewId, iconBtn, iconBtnQuiet, stageLabel } from "./shared";

const navItems: Array<{ id: ViewId; label: string; icon: typeof IconHome }> = [
  { id: "home", label: "首页", icon: IconHome },
  { id: "chat", label: "与TA对话", icon: IconAgent },
  { id: "rewind", label: "回溯", icon: IconRewind },
  { id: "memory", label: "记忆", icon: IconTasks },
  { id: "create", label: "创建 OC", icon: IconGift },
];

export function AppSidebar({
  collapsed,
  currentView,
  character,
  relationship,
  sessions,
  selectedSession,
  hermesState,
  ttsEnabled,
  onCollapseChange,
  onViewChange,
  onSessionSelect,
  onNewChat,
  onTtsToggle,
}: {
  collapsed: boolean;
  currentView: ViewId;
  character: CharacterConfig | null;
  relationship: Relationship | null;
  sessions: SessionItem[];
  selectedSession: SessionId;
  hermesState: string;
  ttsEnabled: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  onViewChange: (view: ViewId) => void;
  onSessionSelect: (id: SessionId) => void;
  onNewChat: () => void;
  onTtsToggle: () => void;
}) {
  const [tab, setTab] = useState<"chats" | "people">("chats");
  const [query, setQuery] = useState("");
  const [groupOpen, setGroupOpen] = useState(true);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q) || s.preview.toLowerCase().includes(q));
  }, [query, sessions]);

  if (collapsed) {
    return (
      <aside style={{ width: 56, flexShrink: 0, background: "var(--bg-sidebar)", borderRight: "0.5px solid var(--line)", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", gap: 6 }}>
        <button type="button" onClick={() => onCollapseChange(false)} title="展开" style={collapsedIconBtn}>
          <IconSidebar size={16} color="var(--ink-muted)" />
        </button>
        <div style={{ height: 8 }} />
        <div style={{ padding: "4px 0" }}><OcAvatar size={28} name={character?.name} /></div>
        <div style={{ height: 4 }} />
        {navItems.map((n) => (
          <button
            key={n.id}
            type="button"
            title={n.label}
            onClick={() => onViewChange(n.id)}
            style={{
              ...collapsedIconBtn,
              color: currentView === n.id ? "var(--ink)" : "var(--ink-muted)",
              background: currentView === n.id ? "var(--bg-active)" : "transparent",
            }}
          >
            <n.icon size={16} />
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside style={{ width: 248, flexShrink: 0, background: "var(--bg-sidebar)", borderRight: "0.5px solid var(--line)", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 52, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid transparent" }}>
        <OCWordmark markSize={24} fontSize={14} />
        <button type="button" onClick={() => onCollapseChange(true)} title="收起侧栏" style={iconBtn}>
          <IconSidebar size={15} color="var(--ink-muted)" />
        </button>
      </div>

      <div style={{ padding: "4px 8px" }}>
        {navItems.map((n) => {
          const on = currentView === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => onViewChange(n.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 8, border: "none",
                background: on ? "var(--bg-active)" : "transparent",
                color: on ? "var(--ink)" : "var(--ink-muted)",
                fontSize: 13, fontWeight: on ? 600 : 500,
                cursor: "pointer", textAlign: "left", whiteSpace: "nowrap",
                transition: "background .12s ease",
              }}
              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
            >
              <n.icon size={15} color={on ? "var(--ink)" : "var(--ink-muted)"} />
              <span>{n.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: "12px 12px 0" }}>
        <div style={{ display: "inline-flex", padding: 3, borderRadius: 8, background: "var(--bg-soft)", border: "0.5px solid var(--line)" }}>
          {([["chats", "对话"], ["people", "关系"]] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              style={{
                padding: "5px 14px", fontSize: 12, fontWeight: 600, border: "none",
                borderRadius: 6, cursor: "pointer",
                background: tab === k ? "var(--bg-window)" : "transparent",
                color: tab === k ? "var(--ink)" : "var(--ink-muted)",
                boxShadow: tab === k ? "0 1px 2px rgba(15,30,55,.06)" : "none",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-faint)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
          {tab === "chats" ? "SESSIONS" : "OC ROSTER"}
        </span>
        {tab === "chats" && (
          <div style={{ display: "flex", gap: 2 }}>
            <button type="button" style={iconBtn} title="搜索"><IconSearch size={13} color="var(--ink-muted)" /></button>
            <button type="button" style={iconBtn} title="收藏夹"><IconFolder size={13} color="var(--ink-muted)" /></button>
            <button type="button" style={iconBtn} title="新会话" onClick={onNewChat}><IconPlus size={13} color="var(--ink-muted)" /></button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
        {tab === "chats" ? (
          <>
            <ExpandableSession
              title="当前对话"
              count={filteredSessions.length}
              icon={<IconSparkle size={12} color="oklch(0.62 0.14 320)" />}
              expanded={groupOpen}
              onToggle={() => setGroupOpen((o) => !o)}
            >
              {filteredSessions.map((s) => (
                <SessionRow
                  key={s.id}
                  name={s.title}
                  small
                  active={selectedSession === s.id}
                  onClick={() => { onSessionSelect(s.id); onViewChange("chat"); }}
                />
              ))}
              <SessionRow name="新的对话" small active={selectedSession === "new"} onClick={onNewChat} />
            </ExpandableSession>
          </>
        ) : (
          <RosterPanel character={character} relationship={relationship} onOpenMemory={() => onViewChange("memory")} />
        )}
      </div>

      <div style={{ padding: "8px 10px 10px", borderTop: "0.5px solid var(--line)", background: "var(--bg-sidebar)" }}>
        <FooterPill icon="H" label={`Hermes · ${hermesState}`} tone="sky" onClick={() => onViewChange("home")} />
        <FooterPill icon="V" label={`语音 · ${ttsEnabled ? "开启" : "关闭"}`} tone={ttsEnabled ? "mint" : "sky"} onClick={onTtsToggle} />
        <div style={{ marginTop: 10, padding: "6px 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, oklch(0.78 0.13 175), oklch(0.55 0.15 175))",
            display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "#fff",
          }}>{(relationship?.userName ?? "你").slice(0, 1)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{relationship?.userName ?? "你"}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: ".06em" }}>
              {stageLabel(relationship?.stage)} · {relationship?.intimacy ?? 0}
            </div>
          </div>
          <button type="button" style={iconBtn} title="设置"><IconCompass size={13} color="var(--ink-muted)" /></button>
        </div>
      </div>
    </aside>
  );
}

const collapsedIconBtn: React.CSSProperties = {
  width: 36, height: 36, display: "grid", placeItems: "center",
  background: "transparent", border: "none", borderRadius: 8, cursor: "pointer",
};

function ExpandableSession({
  title,
  count,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  icon: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 6,
          padding: "6px 8px", border: "none", background: "transparent",
          color: "var(--ink)", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
          borderRadius: 6, textAlign: "left",
        }}
      >
        <IconChevron size={11} color="var(--ink-muted)" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s" }} />
        {icon}
        <span style={{ flex: 1 }}>{title}</span>
        <span style={{ fontSize: 10.5, color: "var(--ink-faint)" }}>{count}</span>
      </button>
      {expanded && children}
    </div>
  );
}

function SessionRow({ name, small, active, onClick }: { name: string; small?: boolean; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: small ? "5px 10px 5px 28px" : "6px 10px",
        border: "none", borderRadius: 6, cursor: "pointer",
        background: active ? "var(--bg-active)" : "transparent",
        color: active ? "var(--ink)" : "var(--ink-muted)",
        fontSize: 12.5, fontWeight: active ? 600 : 400,
        textAlign: "left", transition: "background .12s",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: active ? "var(--accent-deep)" : "oklch(0.82 0.005 240)" }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
    </button>
  );
}

function RosterPanel({
  character,
  relationship,
  onOpenMemory,
}: {
  character: CharacterConfig | null;
  relationship: Relationship | null;
  onOpenMemory: () => void;
}) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <button
        type="button"
        onClick={onOpenMemory}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "7px 10px", border: "none", borderRadius: 6, cursor: "pointer",
          background: "var(--bg-active)", textAlign: "left",
        }}
      >
        <div style={{ width: 24, height: 24, borderRadius: 6, background: "oklch(0.93 0.07 175)", display: "grid", placeItems: "center", fontSize: 14, color: "oklch(0.40 0.10 175)", fontWeight: 700 }}>
          {(character?.name ?? "O").slice(0, 1)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{character?.name ?? "OC"}</div>
          <div style={{ fontSize: 10.5, color: "oklch(0.40 0.10 175)", letterSpacing: ".04em" }}>
            {stageLabel(relationship?.stage)} · {relationship?.intimacy ?? 0}
          </div>
        </div>
      </button>
      <div style={{ padding: "10px 12px", color: "var(--ink-muted)", fontSize: 12, lineHeight: 1.55 }}>
        {character?.personality ?? "角色资料加载中"}
      </div>
    </div>
  );
}

function FooterPill({ icon, label, tone, onClick }: { icon: string; label: string; tone: "mint" | "sky"; onClick: () => void }) {
  const tones = {
    mint: { bg: "oklch(0.95 0.06 165)", fg: "oklch(0.45 0.10 165)" },
    sky: { bg: "oklch(0.95 0.04 220)", fg: "oklch(0.50 0.10 220)" },
  };
  const t = tones[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: "7px 10px", marginBottom: 4, borderRadius: 8, border: "none",
        background: t.bg, color: t.fg, fontSize: 12, fontWeight: 600,
        cursor: "pointer", textAlign: "left",
      }}
    >
      <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 700 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  );
}
