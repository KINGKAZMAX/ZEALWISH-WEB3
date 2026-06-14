import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";

const MIN_WIDTH = 160;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 240;

export function ResizablePanel({
  left,
  right,
  initialWidth = DEFAULT_WIDTH,
}: {
  left: ReactNode;
  right: ReactNode;
  initialWidth?: number;
}) {
  const [leftWidth, setLeftWidth] = useState(initialWidth);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = leftWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = ev.clientX - startX.current;
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth.current + delta));
      setLeftWidth(next);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [leftWidth]);

  return (
    <>
      <div style={{ width: leftWidth, flexShrink: 0, overflow: "hidden" }}>{left}</div>
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 4,
          cursor: "col-resize",
          background: "transparent",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
          transition: "background .15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "oklch(0.78 0.08 220 / 0.3)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      />
      <div style={{ flex: 1, overflow: "hidden" }}>{right}</div>
    </>
  );
}
