"use client";

import type { Activation, LayerConfig } from "@/lib/tf/types";
import { ActivationPicker } from "@/components/playground/Controls";

export function LayerCard({ layer, index, total, onNeuronsChange, onActivationChange, onRemove }: { layer: LayerConfig; index: number; total: number; onNeuronsChange: (id: number, n: number) => void; onActivationChange: (id: number, a: Activation) => void; onRemove: (id: number) => void }) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const dotColor = isFirst ? "#34d399" : isLast ? "#ec4899" : "#c084fc";
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1e1e22", borderRadius: 10, padding: "11px 13px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, boxShadow: `0 0 5px ${dotColor}` }} />
          <span style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase" }}>{isFirst ? "Input" : isLast ? "Output" : `Hidden ${index}`}</span>
        </div>
        {!isFirst && !isLast && <button onClick={() => onRemove(layer.id)} style={{ background: "none", border: "none", color: "#3f3f46", cursor: "pointer", fontSize: 15 }}>×</button>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
        <span style={{ fontSize: 10, color: "#444", flex: 1 }}>Neurons</span>
        <button onClick={() => onNeuronsChange(layer.id, Math.max(1, layer.neurons - 1))} disabled={layer.neurons <= 1} style={smallSquare(layer.neurons <= 1)}>−</button>
        <button onClick={() => onNeuronsChange(layer.id, Math.min(12, layer.neurons + 1))} disabled={layer.neurons >= 12} style={smallSquare(layer.neurons >= 12)}>+</button>
        <span style={{ width: 22, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#e2e2e2", fontFamily: "monospace" }}>{layer.neurons}</span>
      </div>
      <ActivationPicker value={layer.activation} onChange={(a) => onActivationChange(layer.id, a)} />
    </div>
  );
}

const smallSquare = (disabled: boolean) => ({
  width: 21,
  height: 21,
  borderRadius: 4,
  border: "1px solid #2a2a2e",
  background: "rgba(255,255,255,0.03)",
  color: "#777",
  cursor: "pointer",
  opacity: disabled ? 0.3 : 1,
});
