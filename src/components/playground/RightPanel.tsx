"use client";

import type { ReactNode } from "react";
import type { CustomDatasetInfo, PlaygroundState, PointInspection, PointPrediction, SavedRun, TrainingMetrics } from "@/lib/tf/types";
import type { ExplainCard } from "@/lib/tf/explain";
import { CompareExperiments } from "@/components/playground/CompareExperiments";
import { ExplainPanel } from "@/components/playground/ExplainPanel";
import { ExportPanel } from "@/components/playground/ExportPanel";
import { LossChart } from "@/components/playground/LossChart";
import { PointInspector } from "@/components/playground/PointInspector";
import { panelBg, pct, rightPanelTitleStyle, rightPanelValueStyle } from "@/components/playground/ui";

const emptyMetrics: TrainingMetrics = { accuracy: 0, trainAccuracy: 0, testAccuracy: 0, generalizationGap: 0, trainCount: 0, testCount: 0, meanConfidence: 0, positiveRatio: 0, updateNorm: 0, examplesPerSecond: 0, layerNorms: [], layerUpdateNorms: [], misclassifiedCount: 0 };

export function RightPanel({ state, width, displayLoss, displayEpoch, lossHistory, weights, metrics, predictions, inspection, explainCards, savedRuns, customDataset, onSaveRun, onRemoveRun, onClearInspection, onExportJson, onExportScreenshot, onCopySummary }: {
  state: PlaygroundState;
  width: number;
  displayLoss: number | null;
  displayEpoch: number;
  lossHistory: number[];
  weights: number[];
  metrics: TrainingMetrics | null;
  predictions: PointPrediction[];
  inspection: PointInspection | null;
  explainCards: ExplainCard[];
  savedRuns: SavedRun[];
  customDataset: CustomDatasetInfo | null;
  onSaveRun: () => void;
  onRemoveRun: (id: string) => void;
  onClearInspection: () => void;
  onExportJson: () => void;
  onExportScreenshot: () => void;
  onCopySummary: () => void;
}) {
  const m = metrics ?? emptyMetrics;
  const maxW = weights.length > 0 ? Math.max(...weights.map(Math.abs), 0.01) : 1;
  const maxLayer = Math.max(...m.layerUpdateNorms, ...m.layerNorms, 0.001);
  return <aside style={{ width, flexShrink: 0, height: "100vh", overflowY: "auto", background: panelBg, borderLeft: "1px solid #1a1a1e", padding: "18px 14px", display: "flex", flexDirection: "column", gap: 20 }}>
    <ExplainPanel cards={explainCards} />
    <CompareExperiments savedRuns={savedRuns} onSaveRun={onSaveRun} onRemoveRun={onRemoveRun} />
    <ExportPanel onExportJson={onExportJson} onExportScreenshot={onExportScreenshot} onCopySummary={onCopySummary} />
    <Section title="Loss curve" value={displayLoss === null ? undefined : displayLoss.toFixed(4)}><div style={miniCard}><LossChart lossHistory={lossHistory} /></div></Section>
    <Section title="Model metrics"><MetricRows rows={[["Accuracy", pct(m.accuracy)], ["Train accuracy", `${pct(m.trainAccuracy)} · ${m.trainCount}`], ["Test accuracy", `${pct(m.testAccuracy)} · ${m.testCount}`], ["Generalization gap", pct(m.generalizationGap)], ["Misclassified", `${m.misclassifiedCount} / ${predictions.length || 0}`], ["Confidence", pct(m.meanConfidence)], ["Prediction split", `${Math.round((1 - m.positiveRatio) * 100)} / ${Math.round(m.positiveRatio * 100)}`], ["Update norm", m.updateNorm.toFixed(5)], ["Speed", `${Math.round(m.examplesPerSecond)}/s`]]} /></Section>
    <Section title="Point inspector"><PointInspector inspection={inspection} predictions={predictions} onClear={onClearInspection} /></Section>
    <Section title="Weight heatmap"><div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 3 }}>{(weights.length ? weights.slice(0, 40) : Array(40).fill(0)).map((w, i) => { const norm = w / maxW; const bg = norm > 0 ? `rgba(168,85,247,${Math.abs(norm) * 0.72 + 0.05})` : `rgba(34,211,238,${Math.abs(norm) * 0.72 + 0.05})`; return <div key={i} title={weights.length ? w.toFixed(4) : "0.0000"} style={{ aspectRatio: "1", borderRadius: 3, background: weights.length ? bg : "rgba(255,255,255,0.03)" }} />; })}</div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}><span style={{ fontSize: 9, color: "#22d3ee", opacity: 0.6 }}>negative</span><span style={{ fontSize: 9, color: "#c084fc", opacity: 0.6 }}>positive</span></div></Section>
    <Section title="Layer flow"><div style={{ display: "grid", gap: 8 }}>{(m.layerUpdateNorms.length ? m.layerUpdateNorms : Array(Math.max(1, state.layers.length - 1)).fill(0)).map((n, i) => <div key={i}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 10, color: "#4b4b55" }}>layer {i + 1}</span><span style={{ fontSize: 10, color: "#686873", fontFamily: "'JetBrains Mono', monospace" }}>{n.toFixed(4)}</span></div><div style={{ height: 4, borderRadius: 999, background: "#17171b", overflow: "hidden" }}><div style={{ width: `${Math.min(100, (n / maxLayer) * 100)}%`, height: "100%", background: "linear-gradient(90deg,#3b82f6,#a855f7)", opacity: n ? 0.75 : 0.18 }} /></div></div>)}</div></Section>
    <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #1a1a1e" }}><Section title="Summary"><MetricRows rows={[["Layers", String(state.layers.length)], ["Params", String(state.layers.reduce((acc, l, i) => i === 0 ? acc : acc + l.neurons * (state.layers[i - 1]?.neurons ?? 2) + l.neurons, 0))], ["Dataset", state.dataset === "custom" ? customDataset?.name ?? "custom" : state.dataset], ["LR", state.learningRate.toFixed(3)], ["Epochs", String(displayEpoch)]]} /></Section></div>
  </aside>;
}

function Section({ title, value, children }: { title: string; value?: string; children: ReactNode }) { return <div><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><p style={rightPanelTitleStyle}>{title}</p>{value && <span style={rightPanelValueStyle}>{value}</span>}</div>{children}</div>; }
function MetricRows({ rows }: { rows: [string, string][] }) { return <div style={{ display: "grid", gap: 8 }}>{rows.map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}><span style={{ fontSize: 11, color: "#50505a" }}>{k}</span><span style={{ fontSize: 11, color: "#a1a1aa", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>{v}</span></div>)}</div>; }
const miniCard = { height: 82, borderRadius: 7, border: "1px solid #1a1a1e", overflow: "hidden", background: "rgba(255,255,255,0.008)" };
