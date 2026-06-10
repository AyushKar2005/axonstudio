"use client";

import Link from "next/link";
import type { DataPoint, EpochSnapshot, PlaygroundState, PointPrediction, TrainingMetrics, ViewMode } from "@/lib/tf/types";
import { BoundaryCanvas } from "@/components/playground/BoundaryCanvas";
import { EpochTimeline } from "@/components/playground/EpochTimeline";
import { NetworkDiagram } from "@/components/playground/NetworkDiagram";
import { TrainingControls } from "@/components/playground/TrainingControls";
import { cardStyle, eyebrowStyle, metricLabelStyle, mutedLineStyle, smallButtonStyle } from "@/components/playground/ui";

export function CenterPanel({
  state, displayEpoch, displayLoss, grid, data, predictions,
  selectedPointIndex, snapshots, inspectIndex, viewMode, metrics,
  onViewModeChange, onInspect, onGoLive, onSelectPoint,
  onReset, onStep, onToggleTraining,
}: {
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
  const isInspecting = inspectIndex !== null;
  const statusLabel  = isInspecting ? "Inspecting" : state.isTraining ? "Running" : state.epoch > 0 ? "Paused" : "Ready";
  const hasGrid      = grid.length > 0;

  const statusDotColor = state.isTraining ? "#ec4899"
    : state.epoch > 0 ? "#facc15"
    : "#4ade80";

  return (
    <main style={{
      flex: 1,
      minWidth: 0,           // allow flex shrink below content width
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#0c0c0f",
      overflow: "hidden",
      color: "#e5e7eb",
    }}>

      {/* ══ HEADER — two rows, never overflows ══ */}
      <header style={{
        flexShrink: 0,
        borderBottom: "1px solid #1e1e26",
        background: "rgba(12,12,15,0.98)",
        padding: "0 20px",
      }}>

        {/* Row 1 — title + nav */}
        <div style={{
          height: 42,
          display: "flex",
          alignItems: "center",
          gap: 0,
          borderBottom: "1px solid #18181f",
        }}>
          {/* Title */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.04em", color: "#f0f0f2" }}>
              Playground
            </span>
            <span style={{ fontSize: 9, color: "#2a2a38", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>
              Binary classification
            </span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {([["/", "Home"], ["/docs", "Docs"], ["/examples", "Examples"], ["/experiments", "Experiments"]] as const).map(([href, label]) => (
              <Link
                key={href}
                href={href}
                style={{
                  color: "#32323e",
                  textDecoration: "none",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 9px",
                  borderRadius: 5,
                  transition: "color 0.15s, background 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = "#8a8a94";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = "#32323e";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Row 2 — status badge + epoch + loss */}
        <div style={{
          height: 38,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}>

          {/* Status badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px 3px 8px",
            borderRadius: 6,
            background: "rgba(255,255,255,0.028)",
            border: "1px solid rgba(255,255,255,0.055)",
            flexShrink: 0,
          }}>
            <span style={{
              width: 6, height: 6,
              borderRadius: "50%",
              background: statusDotColor,
              boxShadow: state.isTraining ? `0 0 6px ${statusDotColor}88` : "none",
              animation: state.isTraining ? "axon-pulse 0.9s ease-in-out infinite" : "none",
              flexShrink: 0,
              display: "inline-block",
            }} />
            <span style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#4a4a58",
              letterSpacing: "0.08em",
            }}>
              {statusLabel}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 14, background: "#1e1e28", flexShrink: 0 }} />

          {/* Epoch */}
          <div style={{ flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: "#2a2a38", letterSpacing: "0.14em", textTransform: "uppercase", marginRight: 7 }}>Epoch</span>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#888898", fontWeight: 500, letterSpacing: "0.06em" }}>
              {String(displayEpoch).padStart(4, "0")}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 14, background: "#1e1e28", flexShrink: 0 }} />

          {/* Loss */}
          <div style={{ flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: "#2a2a38", letterSpacing: "0.14em", textTransform: "uppercase", marginRight: 7 }}>Loss</span>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: displayLoss !== null ? "#a78bfa" : "#3a3a48", fontWeight: 500, letterSpacing: "0.06em" }}>
              {displayLoss === null ? "—" : displayLoss.toFixed(4)}
            </span>
          </div>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "14px 20px 24px",
        background: [
          "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.04), transparent 30%)",
          "linear-gradient(rgba(255,255,255,0.006) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.006) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "auto, 72px 72px, 72px 72px",
        scrollbarWidth: "thin",
        scrollbarColor: "#1e1e28 transparent",
      }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Network diagram */}
          <NetworkDiagram layers={state.layers} />

          {/* Decision boundary card */}
          <section style={{ ...cardStyle, padding: "14px 14px 12px" }}>

            {/* Card header row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <p style={eyebrowStyle}>Decision boundary</p>
                <p style={mutedLineStyle}>x₁ / x₂ input space · train/test split · threshold 0.5</p>
              </div>

              {/* View mode toggles */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                {(["boundary", "errors", "gradients"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onViewModeChange(mode)}
                    style={smallButtonStyle(viewMode === mode)}
                    onMouseEnter={e => {
                      if (viewMode !== mode) {
                        (e.currentTarget as HTMLElement).style.color = "#a1a1aa";
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (viewMode !== mode) {
                        (e.currentTarget as HTMLElement).style.color = "#4a4a58";
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.022)";
                      }
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 8,
              fontSize: 10,
              color: "#3a3a48",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.04em",
            }}>
              <span><i style={{ ...dot, background: "#8b5cf6" }} />class 0</span>
              <span><i style={{ ...dot, background: "#d9468f" }} />class 1</span>
              <span><i style={{ ...dot, background: "transparent", border: "1px solid rgba(255,255,255,0.28)" }} />test</span>
            </div>

            {/* Canvas container — fills width, max square */}
            <div style={{
              position: "relative",
              width: "min(44vh, 100%)",
              maxWidth: 480,
              minWidth: 260,
              aspectRatio: "1 / 1",
              margin: "10px auto 0",
              borderRadius: 10,
              border: "1px solid #1e1e26",
              background: "#08080b",
              boxShadow: "0 8px 32px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.018) inset",
              overflow: "hidden",
            }}>
              <BoundaryCanvas
                grid={grid}
                data={data}
                predictions={predictions}
                selectedPointIndex={selectedPointIndex}
                viewMode={viewMode}
                metrics={metrics}
                onSelectPoint={onSelectPoint}
                resolution={60}
              />
              {!hasGrid && (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "grid", placeItems: "center",
                  background: "rgba(8,8,11,0.75)",
                  textAlign: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#d4d4d8", fontWeight: 700, letterSpacing: "-0.02em" }}>
                      Ready to train
                    </div>
                    <div style={{ fontSize: 11, color: "#3a3a48", marginTop: 5, lineHeight: 1.5 }}>
                      Run or step once to render the decision field.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <EpochTimeline
              snapshots={snapshots}
              inspectIndex={inspectIndex}
              onInspect={onInspect}
              onGoLive={onGoLive}
            />
            <TrainingControls
              isTraining={state.isTraining}
              onReset={onReset}
              onStep={onStep}
              onToggleTraining={onToggleTraining}
            />
          </section>
        </div>
      </div>

      <style>{`
        @keyframes axon-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.6); }
        }
      `}</style>
    </main>
  );
}

const dot: React.CSSProperties = {
  width: 6, height: 6,
  borderRadius: 99,
  display: "inline-block",
  marginRight: 5,
  verticalAlign: "middle",
};
