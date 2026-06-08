"use client";

import type { Activation, Dataset } from "@/lib/tf/types";

const ACT_CURVES: Record<Activation, string> = {
  relu: "M2,14 L7,14 L14,2",
  sigmoid: "M2,14 Q4,14 8,8 Q12,2 14,2",
  tanh: "M2,13 Q5,13 8,8 Q11,3 14,3",
  linear: "M2,14 L14,2",
};

export function ActivationPicker({ value, onChange }: { value: Activation; onChange: (a: Activation) => void }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {(["relu", "sigmoid", "tanh", "linear"] as Activation[]).map((a) => (
        <button key={a} onClick={() => onChange(a)} title={a} style={{ flex: 1, padding: "5px 0", borderRadius: 6, border: `1px solid ${value === a ? "rgba(192,132,252,0.6)" : "#1e1e22"}`, background: value === a ? "rgba(192,132,252,0.1)" : "rgba(255,255,255,0.02)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d={ACT_CURVES[a]} stroke={value === a ? "#c084fc" : "#444"} strokeWidth="1.5" strokeLinecap="round" fill="none" /></svg>
          <span style={{ fontSize: 8, color: value === a ? "#c084fc" : "#444", letterSpacing: "0.06em", textTransform: "uppercase" }}>{a}</span>
        </button>
      ))}
    </div>
  );
}

export function DatasetThumb({ type, active }: { type: Exclude<Dataset, "custom"> | "custom"; active: boolean }) {
  const pts: Record<string, { x: number; y: number; c: number }[]> = {
    xor: [{ x: 6, y: 6, c: 0 }, { x: 22, y: 22, c: 0 }, { x: 6, y: 22, c: 1 }, { x: 22, y: 6, c: 1 }, { x: 9, y: 9, c: 0 }, { x: 19, y: 19, c: 0 }, { x: 9, y: 19, c: 1 }, { x: 19, y: 9, c: 1 }],
    spiral: Array.from({ length: 16 }, (_, i) => { const t = (i / 8) * Math.PI, r = 3 + i * 0.8; return i % 2 === 0 ? { x: 14 + r * Math.cos(t), y: 14 + r * Math.sin(t), c: 0 } : { x: 14 + r * Math.cos(t + Math.PI), y: 14 + r * Math.sin(t + Math.PI), c: 1 }; }),
    circles: Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return i < 8 ? { x: 14 + 4 * Math.cos(a), y: 14 + 4 * Math.sin(a), c: 0 } : { x: 14 + 10 * Math.cos(a), y: 14 + 10 * Math.sin(a), c: 1 }; }),
    blobs: [{ x: 8, y: 8, c: 0 }, { x: 10, y: 6, c: 0 }, { x: 7, y: 10, c: 0 }, { x: 11, y: 9, c: 0 }, { x: 18, y: 18, c: 1 }, { x: 20, y: 16, c: 1 }, { x: 17, y: 20, c: 1 }, { x: 19, y: 19, c: 1 }],
    custom: [{ x: 6, y: 6, c: 0 }, { x: 11, y: 9, c: 1 }, { x: 15, y: 18, c: 0 }, { x: 20, y: 12, c: 1 }, { x: 7, y: 20, c: 1 }],
  };
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <rect width="28" height="28" rx="4" fill={active ? "rgba(192,132,252,0.08)" : "rgba(255,255,255,0.03)"} />
      {pts[type].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.8" fill={p.c === 0 ? "#a78bfa" : "#22d3ee"} opacity={active ? 1 : 0.5} />)}
    </svg>
  );
}

export function Slider({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: 11, color: "#c084fc", fontFamily: "monospace" }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#c084fc", cursor: "pointer" }} />
    </div>
  );
}
