"use client";

import type { SavedRun } from "@/lib/tf/types";
import { pct, rightPanelTitleStyle } from "@/components/playground/ui";

export function CompareExperiments({ savedRuns, onSaveRun, onRemoveRun }: {
  savedRuns: SavedRun[];
  onSaveRun: () => void;
  onRemoveRun: (id: string) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p style={rightPanelTitleStyle}>Compare experiments</p>
        <button
          onClick={onSaveRun}
          style={{
            height: 28,
            padding: "0 11px",
            borderRadius: 7,
            border: "1px solid rgba(167,139,250,0.3)",
            background: "rgba(124,58,237,0.12)",
            color: "#c4b5fd",
            cursor: "pointer",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.02em",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.20)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.5)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.12)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(167,139,250,0.3)";
          }}
        >
          save run
        </button>
      </div>

      <div style={{ display: "grid", gap: 7 }}>
        {savedRuns.length === 0 && (
          <p style={{ color: "#2e2e3a", fontSize: 11, lineHeight: 1.55 }}>
            Save two runs to compare architectures and generalization.
          </p>
        )}
        {savedRuns.map((run) => (
          <div
            key={run.id}
            style={{
              border: "1px solid #1e1e26",
              borderRadius: 9,
              background: "rgba(255,255,255,0.016)",
              padding: "10px 11px",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a34"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e26"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <b style={{ fontSize: 11, color: "#c8c8d0", fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {run.name}
              </b>
              <button
                onClick={() => onRemoveRun(run.id)}
                style={{
                  background: "none", border: 0,
                  color: "#2e2e3a", cursor: "pointer",
                  fontSize: 14, lineHeight: 1, flexShrink: 0,
                  padding: "0 2px",
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#2e2e3a"; }}
              >
                ×
              </button>
            </div>

            <p style={{ marginTop: 4, fontSize: 9, color: "#2e2e3a", letterSpacing: "0.04em" }}>
              {run.datasetName} · {run.layers.map((l) => l.neurons).join(" → ")}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 9 }}>
              <Metric k="test" v={pct(run.metrics?.testAccuracy ?? 0)} />
              <Metric k="gap"  v={pct(run.metrics?.generalizationGap ?? 0)} />
              <Metric k="loss" v={run.loss === null ? "—" : run.loss.toFixed(3)} />
            </div>

            <div style={{ marginTop: 8, height: 3, borderRadius: 999, background: "#141418", overflow: "hidden" }}>
              <div style={{
                width: `${Math.round((run.metrics?.testAccuracy ?? 0) * 100)}%`,
                height: "100%",
                background: "linear-gradient(90deg,#7c3aed,#ec4899)",
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div style={{ fontSize: 8, color: "#2e2e3a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>
        {k}
      </div>
      <div style={{ fontSize: 11, color: "#6a6a78", fontFamily: "'JetBrains Mono', monospace" }}>
        {v}
      </div>
    </div>
  );
}
