"use client";

import Link from "next/link";
import type { DataPoint, EpochSnapshot, PlaygroundState, PointPrediction, TrainingMetrics, ViewMode } from "@/lib/tf/types";
import { BoundaryCanvas } from "@/components/playground/BoundaryCanvas";
import { EpochTimeline } from "@/components/playground/EpochTimeline";
import { NetworkDiagram } from "@/components/playground/NetworkDiagram";
import { TrainingControls } from "@/components/playground/TrainingControls";
import { cardStyle, eyebrowStyle, metricLabelStyle, mutedLineStyle, smallButtonStyle } from "@/components/playground/ui";

export function CenterPanel({ state, displayEpoch, displayLoss, grid, data, predictions, selectedPointIndex, snapshots, inspectIndex, viewMode, metrics, onViewModeChange, onInspect, onGoLive, onSelectPoint, onReset, onStep, onToggleTraining }: {
  state: PlaygroundState;
  displayEpoch: number;
  displayLoss: number | null;
  grid: number[];
  data: DataPoint[];
  predictions: PointPrediction[];
  selectedPointIndex: number | null;
  snapshots: EpochSnapshot[];
  inspectIndex: number | null;
  viewMode: ViewMode;
  metrics: TrainingMetrics | null;
  onViewModeChange: (mode: ViewMode) => void;
  onInspect: (index: number) => void;
  onGoLive: () => void;
  onSelectPoint: (index: number) => void;
  onReset: () => void;
  onStep: () => void;
  onToggleTraining: () => void;
}) {
  const status = inspectIndex !== null ? "Inspecting" : state.isTraining ? "Running" : state.epoch > 0 ? "Paused" : "Ready";
  const hasGrid = grid.length > 0;
  return (
    <main style={{ flex: 1, minWidth: 560, height: "100vh", display: "flex", flexDirection: "column", background: "#0f0f11", overflow: "hidden", color: "#e5e7eb" }}>
      <header style={{ height: 64, flexShrink: 0, borderBottom: "1px solid #1a1a1e", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", background: "rgba(15,15,17,0.98)", gap: 18 }}>
        <div><div style={{ fontSize: 14, fontWeight: 750, letterSpacing: "-0.03em", color: "#f4f4f5" }}>Playground</div><div style={{ fontSize: 10, color: "#5b5b66", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>Binary classification · local TensorFlow.js runtime</div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginLeft: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingRight: 4 }}>
            {[["/", "Home"], ["/docs", "Docs"], ["/examples", "Examples"], ["/experiments", "Experiments"]].map(([href, label]) => (
              <Link key={href} href={href} style={{ color: "#5b5b66", textDecoration: "none", fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>{label}</Link>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>{[["status", status], ["epoch", String(displayEpoch).padStart(4, "0")], ["loss", displayLoss === null ? "—" : displayLoss.toFixed(4)]].map(([k, v]) => <div key={k} style={{ minWidth: 74 }}><div style={metricLabelStyle}>{k}</div><div style={{ marginTop: 4, fontSize: 13, color: k === "loss" && displayLoss !== null ? "#d9a6be" : "#e4e4e7", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{v}</div></div>)}</div>
        </div>
      </header>
      <div style={{ flex: 1, overflow: "auto", padding: "16px 28px 24px", background: "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.035), transparent 28%), linear-gradient(rgba(255,255,255,0.008) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.008) 1px, transparent 1px)", backgroundSize: "auto, 72px 72px, 72px 72px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <NetworkDiagram layers={state.layers} />
          <section style={{ ...cardStyle, padding: "16px 18px 14px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div><p style={eyebrowStyle}>Decision boundary</p><p style={mutedLineStyle}>x₁ / x₂ input space · train/test split active · threshold 0.5</p></div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {(["boundary", "errors", "gradients"] as ViewMode[]).map((mode) => <button key={mode} onClick={() => onViewModeChange(mode)} style={smallButtonStyle(viewMode === mode)}>{mode}</button>)}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14, fontSize: 10, color: "#8a8a94", fontFamily: "'JetBrains Mono', monospace", marginTop: 8 }}><span><i style={{ ...dot, background: "#8b5cf6" }} /> class 0</span><span><i style={{ ...dot, background: "#d9468f" }} /> class 1</span><span><i style={{ ...dot, background: "transparent", border: "1px solid #fff" }} /> test</span></div>
            <div style={{ position: "relative", width: "min(47vh, 100%)", maxWidth: 520, minWidth: 330, aspectRatio: "1 / 1", margin: "14px auto 0", borderRadius: 10, border: "1px solid #24242a", background: "#0a0a0c", boxShadow: "0 16px 48px rgba(0,0,0,0.26)", overflow: "hidden" }}>
              <BoundaryCanvas grid={grid} data={data} predictions={predictions} selectedPointIndex={selectedPointIndex} viewMode={viewMode} metrics={metrics} onSelectPoint={onSelectPoint} resolution={60} />
              {!hasGrid && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(10,10,12,0.72)", textAlign: "center" }}><div><div style={{ fontSize: 12, color: "#e4e4e7", fontWeight: 650 }}>Ready to train</div><div style={{ fontSize: 11, color: "#71717a", marginTop: 7 }}>Run or step once to render the learned decision field.</div></div></div>}
            </div>
            <EpochTimeline snapshots={snapshots} inspectIndex={inspectIndex} onInspect={onInspect} onGoLive={onGoLive} />
            <TrainingControls isTraining={state.isTraining} onReset={onReset} onStep={onStep} onToggleTraining={onToggleTraining} />
          </section>
        </div>
      </div>
    </main>
  );
}

const dot = { width: 7, height: 7, borderRadius: 99, display: "inline-block", marginRight: 6, verticalAlign: "middle" };
