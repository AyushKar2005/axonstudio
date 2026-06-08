"use client";

import type { EpochSnapshot } from "@/lib/tf/types";
import { buttonStyle, eyebrowStyle, monoValueStyle, mutedLineStyle } from "@/components/playground/ui";

export function EpochTimeline({ snapshots, inspectIndex, onInspect, onGoLive }: { snapshots: EpochSnapshot[]; inspectIndex: number | null; onInspect: (index: number) => void; onGoLive: () => void }) {
  const selected = inspectIndex !== null ? snapshots[inspectIndex] : null;
  return (
    <div style={{ marginTop: 14, padding: "12px 12px 10px", borderRadius: 10, border: "1px solid #1a1a1e", background: "rgba(255,255,255,0.014)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div><p style={{ ...eyebrowStyle, fontSize: 9 }}>Epoch timeline</p><p style={{ ...mutedLineStyle, marginTop: 3 }}>{selected ? `Inspecting saved epoch ${selected.epoch}` : snapshots.length ? `${snapshots.length} saved snapshots · pause and scrub to inspect` : "Snapshots appear while training"}</p></div>
        {inspectIndex !== null && <button onClick={onGoLive} style={buttonStyle(false)}>Live view</button>}
      </div>
      <input type="range" min={0} max={Math.max(0, snapshots.length - 1)} step={1} value={inspectIndex ?? Math.max(0, snapshots.length - 1)} disabled={snapshots.length < 2} onChange={(e) => onInspect(Number(e.target.value))} style={{ width: "100%", marginTop: 12, opacity: snapshots.length < 2 ? 0.35 : 1 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}><span style={{ ...monoValueStyle, color: "#52525b" }}>{snapshots[0]?.epoch ?? 0}</span><span style={{ ...monoValueStyle, color: "#52525b" }}>{snapshots[snapshots.length - 1]?.epoch ?? 0}</span></div>
    </div>
  );
}
