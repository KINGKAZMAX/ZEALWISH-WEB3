import { useState } from "react";
import type { ReactNode } from "react";
import type { CharacterConfig, Relationship } from "../types";
import { IconBook, IconCamera, IconChart, IconCompass, IconRefresh, IconReport, IconUnblock } from "./OcWorldIcons";
import { OcAvatarLarge } from "./OcAvatar";
import { type QuickAction, stageLabel } from "./shared";
import { Composer } from "./Composer";
import { SectionLabel, StatusChip, ViewHeader } from "./ViewHeader";

const quickActions: QuickAction[] = [
  { id: "read-me", title: "Read Me", body: "把最近的对话和兴趣，整理成一段 TA 眼中的你。", prompt: "把我最近的对话和兴趣，整理成你眼中的我。", icon: <IconBook size={14} /> },
  { id: "insights", title: "Insights", body: "看看这周的注意力都流向了哪里。", prompt: "这周我的注意力都流向了哪里？", icon: <IconChart size={14} /> },
  { id: "plan", title: "Plan", body: "基于你当前的状态，决定先处理哪件事。", prompt: "基于我现在的状态，先处理哪件事比较好？", icon: <IconCompass size={14} /> },
  { id: "unblock", title: "Unblock Me", body: "找出最可能卡住你的那一步，并给出下一步。", prompt: "现在卡住我的那一步，是什么？下一步呢？", icon: <IconUnblock size={14} /> },
  { id: "report", title: "Daily Report", body: "给今天写一段简短而真诚的总结。", prompt: "替我给今天写一段简短真诚的总结。", icon: <IconReport size={14} /> },
  { id: "snapshot", title: "Snapshot", body: "此刻 TA 看见的你，是什么样子。", prompt: "此刻你看见的我，是什么样子？", icon: <IconCamera size={14} /> },
];

export function HomeView({
  character,
  relationship,
  greeting,
  hermesState,
  onSend,
}: {
  character: CharacterConfig | null;
  relationship: Relationship | null;
  greeting: string;
  hermesState: string;
  onSend: (text: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const text = draft;
    setDraft("");
    void onSend(text);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <ViewHeader title="首页 · Today" right={<StatusChip label={`Hermes ${hermesState}`} />} />

      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "48px 56px 40px", maxWidth: 880, width: "100%", margin: "0 auto",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40, marginBottom: 28 }}>
          <OcAvatarLarge size={120} name={character?.name} />
          <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 12 }}>
            <span className="serif" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em" }}>
              {character?.name ?? "OC"}
            </span>
            <span style={{
              fontSize: 12, color: "var(--ink-faint)", letterSpacing: "0.16em",
              textTransform: "uppercase", fontFamily: "ui-monospace, Menlo, monospace",
            }}>
              {stageLabel(relationship?.stage)} · {relationship?.intimacy ?? 0}
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--ink-muted)" }}>
            "{greeting || "我在。你可以把一件小事交给我。"}"
          </div>
        </div>

        <Composer draft={draft} setDraft={setDraft} placeholder="说点什么，或交给 TA 一件小事…" onSubmit={submit} />

        <SectionLabel title="Quick Start" right={
          <button type="button" style={{ width: 24, height: 24, display: "grid", placeItems: "center", background: "transparent", border: "none", borderRadius: 6, cursor: "pointer" }}>
            <IconRefresh size={13} color="var(--ink-muted)" />
          </button>
        } />
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
          {quickActions.map((action) => (
            <QuickCard key={action.id} icon={action.icon} title={action.title} body={action.body} onClick={() => void onSend(action.prompt)} />
          ))}
        </div>

        <div style={{
          marginTop: 28, width: "100%",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 14px", border: "0.5px solid var(--line)", borderRadius: 10,
          background: "var(--bg-card)", color: "var(--ink-muted)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "oklch(0.78 0.13 175)" }} />
            <span style={{ fontSize: 12.5 }}>TA 现在很安静 · 不会打扰你</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: ".06em", fontFamily: "ui-monospace, Menlo, monospace" }}>
            affinity {relationship?.intimacy ?? 0} · {stageLabel(relationship?.stage)}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, body, onClick }: { icon: ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left", padding: 14, borderRadius: 12,
        background: "var(--bg-card)", border: "0.5px solid var(--line)",
        cursor: "pointer", transition: "transform .15s, box-shadow .15s, border-color .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "oklch(0.78 0.10 220 / 0.6)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--line)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: "var(--accent-deep)" }}>{icon}</span>
        {title}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.5 }}>{body}</div>
    </button>
  );
}
