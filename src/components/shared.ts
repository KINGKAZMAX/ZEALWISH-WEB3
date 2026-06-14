import type { ReactNode } from "react";
import type { ChatHistoryEntry, PendingChatMessage } from "../types";

export type ViewId = "create" | "oc" | "chat" | "rewind" | "memory" | "world" | "settings" | "home" | "files";
export type SessionId = "live" | "new" | `entry:${number}`;
export type MessageItem = { key: string; role: "user" | "oc"; text: string };

export interface SessionItem {
  id: SessionId;
  title: string;
  preview: string;
  timestamp: number;
}

export interface QuickAction {
  id: string;
  title: string;
  body: string;
  prompt: string;
  icon: ReactNode;
}

export const stageLabels: Record<string, string> = {
  stranger: "陌生",
  acquaintance: "熟人",
  friend: "朋友",
  close_friend: "亲近朋友",
  soulmate: "灵魂伙伴",
};

export function stageLabel(stage?: string): string {
  return stage ? stageLabels[stage] ?? stage : "未知";
}

export function compactText(text: string, limit: number): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized;
}

export function sessionTitle(entry: ChatHistoryEntry): string {
  return compactText(entry.userMessage, 24) || "未命名对话";
}

export function sessionPreview(entry: ChatHistoryEntry): string {
  return compactText(entry.ocResponse, 34) || new Date(entry.timestamp).toLocaleString();
}

export function toSessionItems(history: ChatHistoryEntry[]): SessionItem[] {
  return history
    .slice(-16)
    .reverse()
    .map((entry) => ({
      id: `entry:${entry.timestamp}` as const,
      title: sessionTitle(entry),
      preview: sessionPreview(entry),
      timestamp: entry.timestamp,
    }));
}

export function historyToMessages(entries: ChatHistoryEntry[]): MessageItem[] {
  return entries.flatMap((entry) => [
    { key: `${entry.timestamp}-user`, role: "user" as const, text: entry.userMessage },
    { key: `${entry.timestamp}-oc`, role: "oc" as const, text: entry.ocResponse },
  ]);
}

/**
 * Detects and collapses cumulative history entries caused by the
 * pending-messages interrupt mechanism. When a user sends "hello", then quickly
 * appends "what are you doing" before the LLM responds, the interrupt cancels
 * the in-flight request but the earlier combined message may already be persisted.
 * This leaves entries like:
 *   [{ userMessage: "hello" }, { userMessage: "hello\nwhat are you doing" }]
 * We keep only the last (most complete) entry from each cumulative chain.
 */
function collapseCumulativeHistory(entries: ChatHistoryEntry[]): ChatHistoryEntry[] {
  if (entries.length === 0) {
    return entries;
  }

  const collapsed: ChatHistoryEntry[] = [];
  for (const entry of entries) {
    const prev = collapsed[collapsed.length - 1];
    if (prev && entry.userMessage.startsWith(prev.userMessage) && entry.userMessage !== prev.userMessage) {
      // Current entry is a cumulative superset of the previous one — replace
      collapsed[collapsed.length - 1] = entry;
    } else {
      collapsed.push(entry);
    }
  }
  return collapsed;
}

export function visibleMessages(
  history: ChatHistoryEntry[],
  pending: PendingChatMessage[],
  isSending: boolean,
  selectedSession: SessionId,
): MessageItem[] {
  const selectedEntry = selectedSession.startsWith("entry:")
    ? history.find((entry) => selectedSession === `entry:${entry.timestamp}`)
    : null;
  // Apply deduplication to base history before rendering
  const rawBase =
    selectedSession === "new" ? [] : selectedEntry ? [selectedEntry] : history;
  const dedupedBase = selectedEntry ? rawBase : collapseCumulativeHistory(rawBase);
  const baseMessages = historyToMessages(dedupedBase);
  const pendingItems = pending.map((message) => ({
    key: message.id,
    role: "user" as const,
    text: message.content,
  }));
  const thinking = isSending ? [{ key: "oc-thinking", role: "oc" as const, text: "……" }] : [];
  return [...baseMessages, ...pendingItems, ...thinking];
}

export function bootRows(
  character: { name?: string } | null,
  relationship: { intimacy?: number; stage?: string } | null,
  hermesState: string,
): readonly (readonly [string, string])[] {
  return [
    ["00.00s", "OCWORLD kernel · v0.4.2"],
    ["00.04s", "mounting / oc / memory"],
    ["00.11s", `restoring relationship state`],
    ["00.18s", `  affinity ${relationship?.intimacy ?? 0} · ${stageLabel(relationship?.stage)}`],
    ["00.24s", `loading recent context`],
    ["00.31s", `${character?.name ?? "OC"} is waking up…`],
    ["00.42s", hermesState === "healthy" ? "ready" : `ready · ${hermesState}`],
  ];
}

export function resolveInitialView(character: { name?: string } | null): ViewId {
  return character?.name?.trim() ? "chat" : "create";
}

export const iconBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  display: "grid",
  placeItems: "center",
  background: "transparent",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

export const iconBtnQuiet: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "none",
  borderRadius: 8,
  background: "transparent",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  color: "var(--ink-muted)",
};

export const navItems = [
  { id: "create" as const, label: "生成我的OC", icon: () => null },
  { id: "oc" as const, label: "我的OC", icon: () => null },
  { id: "chat" as const, label: "聊天", icon: () => null },
  { id: "world" as const, label: "世界", icon: () => null },
  { id: "rewind" as const, label: "回溯", icon: () => null },
  { id: "memory" as const, label: "记忆", icon: () => null },
];
