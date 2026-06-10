"use client";

import type { EpochSnapshot } from "@/lib/tf/types";
import { buttonStyle, eyebrowStyle, monoValueStyle, mutedLineStyle } from "@/components/playground/ui";

export function EpochTimeline({ snapshots, inspectIndex, onInspect, onGoLive }: {
  snapshots: EpochSnapshot[];
  inspectIndex: number | null;
  onInspect: (index: number) => void;
  onGoLive: () => void;
}) {
  const selected = inspectIndex !== null ? snapshots[inspectIndex] : null;
  const hasSnapshots = snapshots.length >= 2;

  return (
    <div style={{
      marginTop: 14,
      padding: "12px 14px 10px",
      borderRadius: 10,
      border: "1px solid #1e1e26",
      background: "rgba(255,255,255,0.012)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ ...eyebrowStyle, fontSize: 9 }}>Epoch timeline</p>
          <p style={{ ...mutedLineStyle, marginTop: 4, fontSize: 10 }}>
            {selected
              ? `Inspecting epoch ${selected.epoch}`
              : hasSnapshots
              ? `${snapshots.length} snapshots · scrub to inspect`
              : "Snapshots appear while training"}
          </p>
        </div>
        {inspectIndex !== null && (
          <button
            onClick={onGoLive}
            style={{
              ...buttonStyle(false),
              height: 28,
              minWidth: 64,
              fontSize: 10,
              padding: "0 10px",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.color = "#a1a1aa";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.028)";
              (e.currentTarget as HTMLElement).style.color = "#5a5a68";
            }}
          >
            ↩ Live
          </button>
        )}
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, snapshots.length - 1)}
        step={1}
        value={inspectIndex ?? Math.max(0, snapshots.length - 1)}
        disabled={!hasSnapshots}
        onChange={(e) => onInspect(Number(e.target.value))}
        style={{
          width: "100%",
          marginTop: 12,
          opacity: hasSnapshots ? 1 : 0.25,
          accentColor: "#7c3aed",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ ...monoValueStyle, color: "#2e2e3a", fontSize: 9 }}>
          {snapshots[0]?.epoch ?? 0}
        </span>
        <span style={{ ...monoValueStyle, color: "#2e2e3a", fontSize: 9 }}>
          {snapshots[snapshots.length - 1]?.epoch ?? 0}
        </span>
      </div>
    </div>
  );
}
