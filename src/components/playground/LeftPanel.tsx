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
    <aside style={{
      width,
      flexShrink: 0,
      height: "100vh",
      overflowY: "auto",
      overflowX: "hidden",
      background: panelBg,
      borderRight: "1px solid #1e1e26",
      display: "flex",
      flexDirection: "column",
      scrollbarWidth: "none",
    }}>
      {/* ── Logo header ── */}
      <div style={{
        padding: "16px 14px 13px",
        borderBottom: "1px solid #1a1a22",
        position: "sticky",
        top: 0,
        background: panelBg,
        zIndex: 2,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: "linear-gradient(135deg,#7c3aed,#ec4899)",
            display: "grid", placeItems: "center",
            boxShadow: "0 4px 12px rgba(124,58,237,0.28)",
            flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <circle cx="3" cy="7" r="2" fill="white" />
              <circle cx="11" cy="3" r="1.5" fill="white" opacity="0.72" />
              <circle cx="11" cy="11" r="1.5" fill="white" opacity="0.72" />
              <line x1="5" y1="6.5" x2="9.5" y2="3.5" stroke="white" strokeWidth="1.2" />
              <line x1="5" y1="7.5" x2="9.5" y2="10.5" stroke="white" strokeWidth="1.2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 750, color: "#e8e8ea", letterSpacing: "-0.02em" }}>axon studio</div>
            <div style={{ fontSize: 8, color: "#2e2e3a", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>Neural Network Lab</div>
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>

        {/* Presets */}
        <Section title="Presets">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {PRESETS.map((preset) => {
              const active = state.dataset === preset.dataset;
              return (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(preset)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 11px",
                    borderRadius: 9,
                    border: active ? "1px solid rgba(167,139,250,0.28)" : "1px solid transparent",
                    background: active ? "rgba(124,58,237,0.10)" : "rgba(255,255,255,0.014)",
                    color: active ? "#c4b5fd" : "#6a6a78",
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.028)"; (e.currentTarget as HTMLElement).style.color = "#8a8a94"; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.014)"; (e.currentTarget as HTMLElement).style.color = "#6a6a78"; } }}
                >
                  <div style={{ fontSize: 12, fontWeight: 650 }}>{preset.name}</div>
                  <div style={{ marginTop: 2, fontSize: 9, color: active ? "rgba(196,181,253,0.5)" : "#2e2e3a", letterSpacing: "0.04em" }}>{preset.detail}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Custom CSV */}
        <Section title="Custom CSV">
          <CsvImportPanel onReady={onCustomDatasetReady} />
          {customDataset && (
            <p style={{ marginTop: 7, color: "#3e3e4e", fontSize: 10, letterSpacing: "0.04em" }}>
              {customDataset.name} · {customDataset.rows} rows
            </p>
          )}
        </Section>

        {/* Dataset */}
        <Section title="Dataset">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {(["xor", "spiral", "circles", "blobs", "custom"] as Dataset[]).map((d) => {
              const active = state.dataset === d;
              const disabled = d === "custom" && !customDataset;
              return (
                <button
                  key={d}
                  disabled={disabled}
                  onClick={() => onDatasetSelect(d)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "7px 9px",
                    borderRadius: 8,
                    border: active ? "1px solid rgba(167,139,250,0.32)" : "1px solid rgba(255,255,255,0.05)",
                    background: active ? "rgba(124,58,237,0.10)" : "rgba(255,255,255,0.018)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.35 : 1,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.032)"; }}
                  onMouseLeave={e => { if (!active && !disabled) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.018)"; }}
                >
                  <DatasetThumb type={d} active={active} />
                  <span style={{
                    fontSize: 11,
                    color: active ? "#c4b5fd" : "#4a4a58",
                    fontWeight: 550,
                    textTransform: "capitalize",
                    transition: "color 0.15s",
                  }}>
                    {d === "custom" ? "CSV" : d}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Hyperparameters */}
        <Section title="Hyperparameters">
          <div style={{ display: "grid", gap: 13 }}>
            <Slider
              label="Learning Rate"
              value={state.learningRate}
              min={0.001} max={0.5} step={0.001}
              display={state.learningRate.toFixed(3)}
              onChange={(v) => { onPatch({ learningRate: v }); onReset(); }}
            />
            <Slider
              label="Noise"
              value={state.noise}
              min={0} max={0.5} step={0.01}
              display={`${Math.round(state.noise * 100)}%`}
              onChange={(v) => { onPatch({ noise: v }); onReset(); }}
            />
          </div>
        </Section>

        {/* Network */}
        <Section
          title={`Network · ${state.layers.length} layers`}
          action={
            <button
              onClick={addLayer}
              disabled={state.layers.length >= 7}
              style={{
                fontSize: 9, color: "#a78bfa",
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: 5, padding: "3px 8px",
                cursor: "pointer",
                opacity: state.layers.length >= 7 ? 0.3 : 1,
                fontWeight: 650, letterSpacing: "0.04em",
                transition: "background 0.15s",
              }}
            >
              + layer
            </button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {state.layers.map((l, i) => (
              <LayerCard
                key={l.id}
                layer={l}
                index={i}
                total={state.layers.length}
                onNeuronsChange={(id, n) => { onPatch({ layers: state.layers.map((x) => x.id === id ? { ...x, neurons: n } : x) }); onReset(); }}
                onActivationChange={(id, a) => { onPatch({ layers: state.layers.map((x) => x.id === id ? { ...x, activation: a } : x) }); onReset(); }}
                onRemove={(id) => { onPatch({ layers: state.layers.filter((x) => x.id !== id) }); onReset(); }}
              />
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ fontSize: 9, color: "#2e2e3a", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}
