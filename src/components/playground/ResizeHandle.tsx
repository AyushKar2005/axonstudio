"use client";

import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export function ResizeHandle({ onDrag, onReset }: { onDrag: (deltaX: number) => void; onReset: () => void }) {
  const [hovered, setHovered] = useState(false);

  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    let lastX = e.clientX;
    document.body.dataset.axonResizing = "true";
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - lastX;
      lastX = ev.clientX;
      onDrag(delta);
    };
    const onUp = () => {
      delete document.body.dataset.axonResizing;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onReset}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize · double-click to reset"
      style={{ width: 8, flexShrink: 0, height: "100vh", cursor: "col-resize", position: "relative", background: hovered ? "rgba(124,58,237,0.08)" : "#101012", borderLeft: "1px solid #151519", borderRight: "1px solid #151519" }}
    >
      <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: hovered ? 2 : 1, transform: "translateX(-50%)", background: hovered ? "rgba(196,181,253,0.5)" : "rgba(255,255,255,0.07)" }} />
    </div>
  );
}
