"use client";

import type { PointInspection, PointPrediction } from "@/lib/tf/types";
import { pct } from "@/components/playground/ui";

export function PointInspector({ inspection, predictions, onClear }: { inspection: PointInspection | null; predictions: PointPrediction[]; onClear: () => void }) {
  const errors = predictions.filter((p) => !p.correct).length;
  if (!inspection) return <div style={box}><p style={empty}>Click a point on the boundary to inspect its prediction path.</p><p style={accent}>errors visible: {errors}</p></div>;
  const p = inspection.point;
  return <div style={box}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><b style={{ color: "#e4e4e7", fontSize: 12 }}>Selected point #{p.index}</b><button onClick={onClear} style={{ background: "none", border: 0, color: "#52525b", cursor: "pointer" }}>×</button></div><div style={grid}><span>actual</span><b>class {p.label}</b><span>predicted</span><b>class {p.predicted}</b><span>probability</span><b>{p.probability.toFixed(3)}</b><span>confidence</span><b>{pct(p.confidence)}</b><span>split</span><b>{p.split ?? "—"}</b></div>{inspection.activations.length > 0 && <div style={{ marginTop: 12, display: "grid", gap: 8 }}>{inspection.activations.map((layer) => <div key={layer.layerIndex}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={label}>{layer.name}</span><span style={label}>{layer.activation}</span></div><div style={{ display: "flex", gap: 3 }}>{layer.values.slice(0, 10).map((v, i) => <div key={i} title={v.toFixed(3)} style={{ height: 18, flex: 1, borderRadius: 3, background: `rgba(168,85,247,${Math.min(0.85, Math.abs(v) * 0.75 + 0.08)})` }} />)}</div></div>)}</div>}</div>;
}
const box = { border: "1px solid #1e1e22", borderRadius: 10, background: "rgba(255,255,255,0.018)", padding: 12 };
const empty = { color: "#71717a", fontSize: 11, lineHeight: 1.5 };
const accent = { color: "#fb923c", fontSize: 10, marginTop: 10, fontFamily: "'JetBrains Mono', monospace" };
const grid = { marginTop: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 10px", color: "#71717a", fontSize: 11 };
const label = { fontSize: 9, color: "#52525b", textTransform: "uppercase" as const, letterSpacing: "0.08em" };
