"use client";

import type { ReactNode } from "react";
import type { CustomDatasetInfo, Dataset, DataPoint, PlaygroundState } from "@/lib/tf/types";
import type { PresetConfig } from "@/lib/tf/datasets";
import { PRESETS } from "@/lib/tf/datasets";
import { CsvImportPanel } from "@/components/playground/CsvImportPanel";
import { DatasetThumb, Slider } from "@/components/playground/Controls";
import { LayerCard } from "@/components/playground/LayerCard";
import { panelBg } from "@/components/playground/ui";

export function LeftPanel({ state, width, customDataset, onPatch, onDatasetSelect, onReset, onApplyPreset, onCustomDatasetReady }: {
  state: PlaygroundState;
  width: number;
  customDataset: CustomDatasetInfo | null;
  onPatch: (p: Partial<PlaygroundState>) => void;
  onDatasetSelect: (dataset: Dataset) => void;
  onReset: () => void;
  onApplyPreset: (preset: PresetConfig) => void;
  onCustomDatasetReady: (data: DataPoint[], info: CustomDatasetInfo) => void;
}) {
  const addLayer = () => {
    if (state.layers.length >= 7) return;
    const layers = [...state.layers];
    layers.splice(layers.length - 1, 0, { id: Date.now(), neurons: 4, activation: "relu" });
    onPatch({ layers });
    onReset();
  };

  return (
    <aside style={{ width, flexShrink: 0, height: "100vh", overflowY: "auto", background: panelBg, borderRight: "1px solid #1a1a1e", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #1a1a1e", position: "sticky", top: 0, background: panelBg, zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "grid", placeItems: "center" }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="7" r="2" fill="white" /><circle cx="11" cy="3" r="1.5" fill="white" opacity="0.7" /><circle cx="11" cy="11" r="1.5" fill="white" opacity="0.7" /><line x1="5" y1="6.5" x2="9.5" y2="3.5" stroke="white" strokeWidth="1.2" /><line x1="5" y1="7.5" x2="9.5" y2="10.5" stroke="white" strokeWidth="1.2" /></svg>
          </div>
          <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e2e2e2" }}>axon studio</div><div style={{ fontSize: 9, color: "#333", letterSpacing: "0.1em", textTransform: "uppercase" }}>Neural Network Lab</div></div>
        </div>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 22 }}>
        <Section title="Presets">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{PRESETS.map((preset) => <button key={preset.id} onClick={() => onApplyPreset(preset)} style={{ width: "100%", textAlign: "left", padding: "10px", borderRadius: 8, border: state.dataset === preset.dataset ? "1px solid rgba(192,132,252,0.38)" : "1px solid #1e1e22", background: state.dataset === preset.dataset ? "rgba(192,132,252,0.07)" : "rgba(255,255,255,0.018)", color: state.dataset === preset.dataset ? "#d8b4fe" : "#8b8b93", cursor: "pointer" }}><div style={{ fontSize: 11, fontWeight: 650 }}>{preset.name}</div><div style={{ marginTop: 3, fontSize: 9, color: "#4b4b55" }}>{preset.detail}</div></button>)}</div>
        </Section>

        <Section title="Custom CSV">
          <CsvImportPanel onReady={onCustomDatasetReady} />
          {customDataset && <p style={{ marginTop: 8, color: "#71717a", fontSize: 10 }}>{customDataset.name} · {customDataset.rows} rows</p>}
        </Section>

        <Section title="Dataset">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>{(["xor", "spiral", "circles", "blobs", "custom"] as Dataset[]).map((d) => <button key={d} disabled={d === "custom" && !customDataset} onClick={() => onDatasetSelect(d)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 7, border: `1px solid ${state.dataset === d ? "rgba(192,132,252,0.5)" : "#1e1e22"}`, background: state.dataset === d ? "rgba(192,132,252,0.08)" : "rgba(255,255,255,0.02)", cursor: d === "custom" && !customDataset ? "not-allowed" : "pointer", opacity: d === "custom" && !customDataset ? 0.45 : 1 }}><DatasetThumb type={d} active={state.dataset === d} /><span style={{ fontSize: 11, color: state.dataset === d ? "#c084fc" : "#555", fontWeight: 500, textTransform: "capitalize" }}>{d === "custom" ? "CSV" : d}</span></button>)}</div>
        </Section>

        <Section title="Hyperparameters">
          <div style={{ display: "grid", gap: 14 }}><Slider label="Learning Rate" value={state.learningRate} min={0.001} max={0.5} step={0.001} display={state.learningRate.toFixed(3)} onChange={(v) => { onPatch({ learningRate: v }); onReset(); }} /><Slider label="Noise" value={state.noise} min={0} max={0.5} step={0.01} display={`${Math.round(state.noise * 100)}%`} onChange={(v) => { onPatch({ noise: v }); onReset(); }} /></div>
        </Section>

        <Section title={`Network · ${state.layers.length} layers`} action={<button onClick={addLayer} disabled={state.layers.length >= 7} style={{ fontSize: 9, color: "#c084fc", background: "none", border: "1px solid rgba(192,132,252,0.25)", borderRadius: 4, padding: "2px 7px", cursor: "pointer", opacity: state.layers.length >= 7 ? 0.3 : 1 }}>+ layer</button>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{state.layers.map((l, i) => <LayerCard key={l.id} layer={l} index={i} total={state.layers.length} onNeuronsChange={(id, n) => { onPatch({ layers: state.layers.map((x) => x.id === id ? { ...x, neurons: n } : x) }); onReset(); }} onActivationChange={(id, a) => { onPatch({ layers: state.layers.map((x) => x.id === id ? { ...x, activation: a } : x) }); onReset(); }} onRemove={(id) => { onPatch({ layers: state.layers.filter((x) => x.id !== id) }); onReset(); }} />)}</div>
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}><p style={{ fontSize: 9, color: "#333", letterSpacing: "0.14em", textTransform: "uppercase" }}>{title}</p>{action}</div>{children}</div>;
}
