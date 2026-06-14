import type { ReactNode } from "react";
import { IconBolt } from "./OcWorldIcons";

export function ViewHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header style={{ height: 52, flex: "0 0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid transparent" }}>
      <div style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>{title}</div>
      <div>{right}</div>
    </header>
  );
}

export function TokenChip({ n }: { n: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--ink-muted)", fontFamily: "ui-monospace, Menlo, monospace" }}>
      <IconBolt size={12} color="var(--ink-muted)" />
      {n.toLocaleString()}
    </div>
  );
}

export function StatusChip({ label }: { label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-muted)", fontSize: 11.5, fontFamily: "ui-monospace, Menlo, monospace" }}>
      <IconBolt size={12} />
      {label}
    </span>
  );
}

export function SectionLabel({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div style={{ width: "100%", marginTop: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{title}</span>
      {right}
    </div>
  );
}
