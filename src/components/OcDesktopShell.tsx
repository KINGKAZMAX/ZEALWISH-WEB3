import type { ReactNode } from "react";

export function OcDesktopShell({ left, header, children }: { left: ReactNode; header: ReactNode; children: ReactNode }) {
  return (
    <div className="oc-shell-page">
      <div className="oc-shell-backdrop" />
      <div className="oc-shell-grain" />
      <div className="oc-shell-window">
        <div className="oc-shell-titlebar">
          <div className="oc-shell-traffic">
            <span className="oc-shell-dot oc-shell-dot-red" />
            <span className="oc-shell-dot oc-shell-dot-amber" />
            <span className="oc-shell-dot oc-shell-dot-green" />
          </div>
          <span className="oc-shell-title mono">OCWORLD Desktop</span>
        </div>
        <div className="oc-shell-body">
          <aside className="oc-shell-left">{left}</aside>
          <section className="oc-shell-right">
            {header}
            <div className="oc-shell-content">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
