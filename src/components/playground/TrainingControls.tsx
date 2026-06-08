"use client";

import { buttonStyle } from "@/components/playground/ui";

export function TrainingControls({ isTraining, onReset, onStep, onToggleTraining }: { isTraining: boolean; onReset: () => void; onStep: () => void; onToggleTraining: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.055)" }}>
      <button onClick={onReset} style={buttonStyle(false)}>↺ Reset</button>
      <button onClick={onStep} style={buttonStyle(false)}>▸| Step</button>
      <button onClick={onToggleTraining} style={{ ...buttonStyle(!isTraining), minWidth: 112, color: "#f4f4f5", fontSize: 12 }}>{isTraining ? "Ⅱ Pause" : "▶ Run"}</button>
    </div>
  );
}
