"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PRESETS, generateDataset } from "@/lib/tf/datasets";
import { buildExplainCards } from "@/lib/tf/explain";
import { buildExperimentExport, copyExperimentSummary, downloadExperimentJson, exportCanvasPng } from "@/lib/tf/export";
import { trainer } from "@/lib/tf/trainer";
import type { CustomDatasetInfo, DataPoint, Dataset, EpochSnapshot, PlaygroundState, PointInspection, PointPrediction, SavedRun, TrainingMetrics, TrainStepResult, ViewMode } from "@/lib/tf/types";
import type { PresetConfig } from "@/lib/tf/datasets";
import { CenterPanel } from "@/components/playground/CenterPanel";
import { LeftPanel } from "@/components/playground/LeftPanel";
import { ResizeHandle } from "@/components/playground/ResizeHandle";
import { RightPanel } from "@/components/playground/RightPanel";
import { clamp } from "@/components/playground/ui";

const emptyMetrics: TrainingMetrics = {
  accuracy: 0,
  trainAccuracy: 0,
  testAccuracy: 0,
  generalizationGap: 0,
  trainCount: 0,
  testCount: 0,
  meanConfidence: 0,
  positiveRatio: 0,
  updateNorm: 0,
  examplesPerSecond: 0,
  layerNorms: [],
  layerUpdateNorms: [],
  misclassifiedCount: 0,
};

const SAVED_RUNS_KEY = "axon:saved-runs:v2";
const WIDTH_KEY = "axon:panel-widths:v2";

export default function PlaygroundLayout() {
  const [state, setState] = useState<PlaygroundState>({
    layers: PRESETS[1].layers,
    learningRate: PRESETS[1].learningRate,
    dataset: PRESETS[1].dataset,
    noise: PRESETS[1].noise,
    isTraining: false,
    epoch: 0,
    loss: null,
  });

  const [leftWidth, setLeftWidth] = useState(258);
  const [rightWidth, setRightWidth] = useState(288);
  const [grid, setGrid] = useState<number[]>([]);
  const [data, setData] = useState<DataPoint[]>(() => generateDataset("circles", 200, 0.1));
  const [customData, setCustomData] = useState<DataPoint[]>([]);
  const [customDataset, setCustomDataset] = useState<CustomDatasetInfo | null>(null);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [weights, setWeights] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null);
  const [predictions, setPredictions] = useState<PointPrediction[]>([]);
  const [snapshots, setSnapshots] = useState<EpochSnapshot[]>([]);
  const [inspectIndex, setInspectIndex] = useState<number | null>(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [pointInspection, setPointInspection] = useState<PointInspection | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("boundary");
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const needsSetupRef = useRef(true);

  const patch = useCallback(
    (p: Partial<PlaygroundState>) => setState((prev) => ({ ...prev, ...p })),
    [],
  );

  useEffect(() => {
    document.body.dataset.axonPlayground = "true";

    try {
      const widths = JSON.parse(localStorage.getItem(WIDTH_KEY) ?? "null");
      if (widths?.left) setLeftWidth(widths.left);
      if (widths?.right) setRightWidth(widths.right);

      const saved = JSON.parse(localStorage.getItem(SAVED_RUNS_KEY) ?? "[]") as SavedRun[];
      setSavedRuns(Array.isArray(saved) ? saved : []);
    } catch {}

    return () => {
      delete document.body.dataset.axonPlayground;
      trainer.stop();
      trainer.dispose();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(WIDTH_KEY, JSON.stringify({ left: leftWidth, right: rightWidth }));
  }, [leftWidth, rightWidth]);

  useEffect(() => {
    localStorage.setItem(SAVED_RUNS_KEY, JSON.stringify(savedRuns));
  }, [savedRuns]);

  const resetVisuals = useCallback(
    (next?: Partial<PlaygroundState>, customOverride?: DataPoint[]) => {
      trainer.stop();
      trainer.dispose();
      needsSetupRef.current = true;

      setGrid([]);
      setLossHistory([]);
      setWeights([]);
      setMetrics(null);
      setPredictions([]);
      setSnapshots([]);
      setInspectIndex(null);
      setSelectedPointIndex(null);
      setPointInspection(null);

      setState((prev) => {
        const merged = { ...prev, ...next, isTraining: false, epoch: 0, loss: null };
        const nextData =
          merged.dataset === "custom"
            ? customOverride ?? customData
            : generateDataset(merged.dataset, 200, merged.noise);
        setData(nextData);
        return merged;
      });
    },
    [customData],
  );

  const setupTrainer = useCallback(() => {
    trainer.setup(
      state.layers,
      state.dataset,
      state.noise,
      state.learningRate,
      state.dataset === "custom" ? customData : undefined,
    );
    setData(trainer.getData());
    needsSetupRef.current = false;
  }, [customData, state.dataset, state.layers, state.learningRate, state.noise]);

  const applyResult = useCallback(
    (result: TrainStepResult) => {
      if (result.grid.length) setGrid(result.grid);
      setWeights(result.weights);
      setMetrics(result.metrics);
      setPredictions(result.predictions);
      setLossHistory((prev) => [...prev.slice(-239), result.loss]);
      setState((prev) => ({ ...prev, epoch: result.epoch, loss: result.loss }));

      setSnapshots((prev) => {
        if (result.epoch % 5 !== 0 && prev.length > 0) return prev;
        const snap: EpochSnapshot = {
          epoch: result.epoch,
          loss: result.loss,
          weights: result.weights,
          grid: result.grid,
          metrics: result.metrics,
          predictions: result.predictions,
        };
        return [...prev.slice(-99), snap];
      });

      if (selectedPointIndex !== null) {
        setPointInspection(trainer.inspectPoint(selectedPointIndex, result.predictions[selectedPointIndex]));
      }
    },
    [selectedPointIndex],
  );

  const handleStep = useCallback(async () => {
    setInspectIndex(null);
    if (needsSetupRef.current || !trainer.getModel()) setupTrainer();
    const result = await trainer.trainOneEpoch(60, true);
    if (result) applyResult(result);
  }, [applyResult, setupTrainer]);

  const toggleTraining = useCallback(() => {
    setInspectIndex(null);
    setState((prev) => ({ ...prev, isTraining: !prev.isTraining }));
  }, []);

  useEffect(() => {
    if (!state.isTraining) {
      trainer.stop();
      return;
    }

    if (needsSetupRef.current || !trainer.getModel()) setupTrainer();
    trainer.train(applyResult);
    return () => trainer.stop();
  }, [applyResult, setupTrainer, state.isTraining]);

  const handleDatasetSelect = useCallback(
    (dataset: Dataset) => {
      if (dataset === "custom" && !customData.length) return;
      resetVisuals({ dataset }, dataset === "custom" ? customData : undefined);
    },
    [customData, resetVisuals],
  );

  const applyPreset = useCallback(
    (preset: PresetConfig) => {
      resetVisuals({
        dataset: preset.dataset,
        noise: preset.noise,
        learningRate: preset.learningRate,
        layers: preset.layers.map((l) => ({ ...l, id: Date.now() + l.id })),
      });
    },
    [resetVisuals],
  );

  const handleCustomDatasetReady = useCallback(
    (incoming: DataPoint[], info: CustomDatasetInfo) => {
      setCustomData(incoming);
      setCustomDataset(info);
      resetVisuals({ dataset: "custom", noise: 0.02 }, incoming);
    },
    [resetVisuals],
  );

  const inspected = inspectIndex !== null ? snapshots[inspectIndex] : null;
  const visibleGrid = inspected?.grid ?? grid;
  const visibleWeights = inspected?.weights ?? weights;
  const visibleMetrics = inspected?.metrics ?? metrics;
  const visiblePredictions = inspected?.predictions ?? predictions;
  const displayEpoch = inspected?.epoch ?? state.epoch;
  const displayLoss = inspected?.loss ?? state.loss;
  const visibleInspection = pointInspection;

  const handleInspect = useCallback((index: number) => {
    setState((prev) => ({ ...prev, isTraining: false }));
    trainer.stop();
    setInspectIndex(index);
    setPointInspection(null);
    setSelectedPointIndex(null);
  }, []);

  const handleGoLive = useCallback(() => setInspectIndex(null), []);

  const handleSelectPoint = useCallback(
    (index: number) => {
      setSelectedPointIndex(index);
      const fallback = visiblePredictions[index];

      if (inspectIndex !== null && fallback) {
        setPointInspection({
          point: fallback,
          activations: [],
          output: fallback.probability,
          source: "snapshot",
        });
        return;
      }

      setPointInspection(
        trainer.inspectPoint(index, fallback) ??
          (fallback
            ? {
                point: fallback,
                activations: [],
                output: fallback.probability,
                source: "snapshot",
              }
            : null),
      );
    },
    [inspectIndex, visiblePredictions],
  );

  const displayLossHistory = useMemo(() => {
    if (inspectIndex === null) return lossHistory;
    const cut = snapshots.slice(0, inspectIndex + 1).map((s) => s.loss);
    return cut.length > 1 ? cut : lossHistory;
  }, [inspectIndex, lossHistory, snapshots]);

  const explainCards = useMemo(
    () =>
      buildExplainCards({
        dataset: state.dataset,
        customDataset,
        metrics: visibleMetrics,
        predictions: visiblePredictions,
        snapshots,
        savedRuns,
        loss: displayLoss,
        epoch: displayEpoch,
        viewMode,
      }),
    [
      state.dataset,
      customDataset,
      visibleMetrics,
      visiblePredictions,
      snapshots,
      savedRuns,
      displayLoss,
      displayEpoch,
      viewMode,
    ],
  );

  const datasetName = state.dataset === "custom" ? customDataset?.name ?? "custom csv" : state.dataset;

  const handleSaveRun = useCallback(() => {
    const run: SavedRun = {
      id: `${Date.now()}`,
      name: `${datasetName} · epoch ${displayEpoch}`,
      createdAt: Date.now(),
      dataset: state.dataset,
      datasetName,
      layers: state.layers,
      learningRate: state.learningRate,
      noise: state.noise,
      epoch: displayEpoch,
      loss: displayLoss,
      metrics: visibleMetrics,
    };
    setSavedRuns((prev) => [run, ...prev].slice(0, 8));
  }, [datasetName, displayEpoch, displayLoss, state.dataset, state.layers, state.learningRate, state.noise, visibleMetrics]);

  const handleExportJson = useCallback(
    () =>
      downloadExperimentJson(
        buildExperimentExport({
          state,
          customDataset,
          metrics: visibleMetrics,
          predictions: visiblePredictions,
          snapshots,
          savedRuns,
        }),
      ),
    [state, customDataset, visibleMetrics, visiblePredictions, snapshots, savedRuns],
  );

  const handleCopySummary = useCallback(() => {
    void copyExperimentSummary({ datasetName, epoch: displayEpoch, loss: displayLoss, metrics: visibleMetrics });
  }, [datasetName, displayEpoch, displayLoss, visibleMetrics]);

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSaveRun();
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        toggleTraining();
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "r") resetVisuals();
      if (key === "s") void handleStep();
      if (key === "e") setViewMode("errors");
      if (key === "g") setViewMode("gradients");
      if (key === "b") setViewMode("boundary");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSaveRun, handleStep, resetVisuals, toggleTraining]);

  return (
    <div
      className="axon-playground-shell"
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#0c0c0f",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Cursor resets ── */
        body[data-axon-playground="true"] #cursor,
        body[data-axon-playground="true"] #cursor-ring,
        body[data-axon-playground="true"] .custom-cursor,
        body[data-axon-playground="true"] .cursor-dot,
        body[data-axon-playground="true"] .cursor-ring,
        body[data-axon-playground="true"] [data-cursor],
        body[data-axon-playground="true"] nextjs-portal { display: none !important; }

        body[data-axon-playground="true"],
        body[data-axon-playground="true"] * { cursor: auto !important; }

        body[data-axon-playground="true"] button,
        body[data-axon-playground="true"] a,
        body[data-axon-playground="true"] input[type=range],
        body[data-axon-playground="true"] canvas { cursor: pointer !important; }

        body[data-axon-playground="true"] [role="separator"],
        body[data-axon-playground="true"] [role="separator"] * { cursor: col-resize !important; }

        body[data-axon-resizing="true"],
        body[data-axon-resizing="true"] * { user-select: none !important; cursor: col-resize !important; }

        /* ── Range inputs ── */
        input[type=range] {
          -webkit-appearance: none;
          height: 2px;
          background: #1e1e26;
          border-radius: 2px;
          outline: none;
          width: 100%;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 11px; height: 11px;
          border-radius: 50%;
          background: #a78bfa;
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(167,139,250,0.12);
          transition: box-shadow 0.15s;
        }
        input[type=range]:hover::-webkit-slider-thumb {
          box-shadow: 0 0 0 5px rgba(167,139,250,0.18);
        }
        input[type=range]:disabled::-webkit-slider-thumb {
          background: #3a3a48;
          box-shadow: none;
        }

        /* ── Scrollbars ── */
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1e28; border-radius: 2px; }

        /* ── Panel surfaces ── */
        .axon-panel {
          background: #0e0e12;
          border-right: 1px solid rgba(255,255,255,0.055);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .axon-panel-right {
          background: #0e0e12;
          border-left: 1px solid rgba(255,255,255,0.055);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ── Panel section headers ── */
        .axon-section-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #3a3a4a;
          padding: 14px 16px 6px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .axon-section-label:first-child { border-top: none; }

        /* ── Preset cards ── */
        .axon-preset-card {
          margin: 4px 10px;
          padding: 10px 13px;
          border-radius: 10px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, border-color 0.15s;
          color: #f4f4f5;
        }
        .axon-preset-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.06);
        }
        .axon-preset-card.active {
          background: rgba(124,58,237,0.12);
          border-color: rgba(167,139,250,0.22);
        }

        /* ── Dataset chips ── */
        .axon-dataset-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.022);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.12s;
          font-size: 12px;
          color: #8a8a94;
        }
        .axon-dataset-chip:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.10);
          color: #d4d4d8;
          transform: translateY(-1px);
        }
        .axon-dataset-chip.active {
          background: rgba(124,58,237,0.12);
          border-color: rgba(167,139,250,0.25);
          color: #c4b5fd;
        }

        /* ── View mode buttons ── */
        .axon-view-btn {
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.07);
          background: transparent;
          color: #5a5a68;
          font-size: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }
        .axon-view-btn:hover {
          background: rgba(255,255,255,0.05);
          color: #a1a1aa;
          border-color: rgba(255,255,255,0.12);
        }
        .axon-view-btn.active {
          background: rgba(124,58,237,0.18);
          border-color: rgba(167,139,250,0.35);
          color: #c4b5fd;
        }

        /* ── Run / control buttons ── */
        .axon-run-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 9px;
          border: 1px solid rgba(236,72,153,0.35);
          background: rgba(236,72,153,0.12);
          color: #f4f4f5;
          font-size: 13px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s, box-shadow 0.15s;
          letter-spacing: 0.01em;
        }
        .axon-run-btn:hover {
          background: rgba(236,72,153,0.20);
          border-color: rgba(236,72,153,0.55);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(236,72,153,0.15);
        }
        .axon-run-btn:active { transform: translateY(0); }
        .axon-run-btn.running {
          background: rgba(236,72,153,0.18);
          border-color: rgba(236,72,153,0.5);
          box-shadow: 0 0 20px rgba(236,72,153,0.12);
        }

        .axon-ctrl-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          color: #6a6a78;
          font-size: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .axon-ctrl-btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
          color: #a1a1aa;
          transform: translateY(-1px);
        }
        .axon-ctrl-btn:active { transform: translateY(0); }

        /* ── Save run button ── */
        .axon-save-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(167,139,250,0.28);
          background: rgba(124,58,237,0.12);
          color: #c4b5fd;
          font-size: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.02em;
        }
        .axon-save-btn:hover {
          background: rgba(124,58,237,0.20);
          border-color: rgba(167,139,250,0.45);
          box-shadow: 0 4px 14px rgba(124,58,237,0.18);
          transform: translateY(-1px);
        }

        /* ── Export buttons ── */
        .axon-export-btn {
          width: 100%;
          padding: 10px 14px;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.025);
          color: #8a8a94;
          font-size: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .axon-export-btn:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
          color: #d4d4d8;
          transform: translateX(2px);
        }

        /* ── Metric rows ── */
        .axon-metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .axon-metric-row:last-child { border-bottom: none; }
        .axon-metric-label {
          font-size: 11px;
          color: #42424e;
          letter-spacing: 0.03em;
        }
        .axon-metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #c4c4cc;
          font-weight: 500;
        }
        .axon-metric-value.highlight {
          color: #a78bfa;
        }

        /* ── Header bar ── */
        .axon-playground-shell main > header {
          height: 64px !important;
          min-height: 64px !important;
          padding: 0 20px !important;
          gap: 16px !important;
          position: relative !important;
          z-index: 40 !important;
          overflow: visible !important;
          display: grid !important;
          grid-template-columns: minmax(340px, 1fr) auto !important;
          align-items: center !important;
          background: #0c0c0f !important;
          border-bottom: 1px solid rgba(255,255,255,0.055) !important;
        }

        .axon-playground-shell main > header > div:first-child {
          min-width: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 20px !important;
          overflow: visible !important;
        }

        /* "Playground" wordmark */
        .axon-playground-shell main > header > div:first-child > div:first-child {
          font-size: 17px !important;
          line-height: 1 !important;
          white-space: nowrap !important;
          flex-shrink: 0 !important;
          font-weight: 800 !important;
          letter-spacing: -0.04em !important;
          color: #f4f4f5 !important;
        }

        /* subtitle / breadcrumb */
        .axon-playground-shell main > header > div:first-child > div:nth-child(2) {
          margin-top: 0 !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          line-height: 1.1 !important;
          max-width: 300px !important;
          flex-shrink: 1 !important;
          min-width: 120px !important;
          font-size: 11px !important;
          color: #42424e !important;
          letter-spacing: 0.04em !important;
          text-transform: uppercase !important;
          font-weight: 600 !important;
        }

        /* Nav + controls on the right */
        .axon-playground-shell main > header a,
        .axon-playground-shell main > header nav,
        .axon-playground-shell main > header button {
          position: relative !important;
          z-index: 999 !important;
          pointer-events: auto !important;
        }

        .axon-playground-shell main > header > div:last-child {
          display: flex !important;
          align-items: center !important;
          gap: 14px !important;
          flex-shrink: 0 !important;
          position: relative !important;
          z-index: 60 !important;
        }

        /* Status badge */
        .axon-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: #6a6a78;
          letter-spacing: 0.04em;
        }
        .axon-status-badge .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #3a3a4a;
          transition: background 0.3s;
        }
        .axon-status-badge.ready .dot { background: #4ade80; box-shadow: 0 0 6px rgba(74,222,128,0.5); }
        .axon-status-badge.training .dot {
          background: #ec4899;
          box-shadow: 0 0 6px rgba(236,72,153,0.6);
          animation: axon-pulse-dot 0.9s ease-in-out infinite;
        }

        @keyframes axon-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.7); }
        }

        /* Epoch counter */
        .axon-epoch-display {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          color: #5a5a68;
          letter-spacing: 0.08em;
          min-width: 52px;
          text-align: right;
        }

        /* Divider between header sections */
        .axon-header-divider {
          width: 1px;
          height: 18px;
          background: rgba(255,255,255,0.07);
          flex-shrink: 0;
        }

        /* Nav links in header */
        .axon-playground-shell main > header nav a {
          font-size: 12px !important;
          color: #42424e !important;
          text-decoration: none !important;
          transition: color 0.15s !important;
          font-weight: 500 !important;
          letter-spacing: 0.01em !important;
        }
        .axon-playground-shell main > header nav a:hover { color: #8a8a94 !important; }

        /* CSV dropzone polish */
        .axon-csv-zone {
          margin: 8px 10px;
          border: 1.5px dashed rgba(124,58,237,0.28);
          border-radius: 12px;
          padding: 18px 14px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          background: rgba(124,58,237,0.04);
        }
        .axon-csv-zone:hover {
          border-color: rgba(124,58,237,0.5);
          background: rgba(124,58,237,0.08);
        }

        /* Panel section inner padding */
        .axon-panel-body { padding: 0 14px 10px; }

        /* Explain card */
        .axon-explain-card {
          padding: 12px 14px;
          margin: 0 10px 6px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: border-color 0.2s, background 0.2s;
        }
        .axon-explain-card:hover {
          border-color: rgba(167,139,250,0.18);
          background: rgba(124,58,237,0.05);
        }
        .axon-explain-card-title {
          font-size: 11px;
          font-weight: 700;
          color: #a78bfa;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .axon-explain-card-body {
          font-size: 12px;
          color: #6a6a78;
          line-height: 1.55;
        }

        /* Saved run cards */
        .axon-run-card {
          padding: 10px 12px;
          margin: 0 10px 5px;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.018);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          transition: border-color 0.15s, background 0.15s;
        }
        .axon-run-card:hover {
          border-color: rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.03);
        }

        /* Always show playground layout */
        .axon-desktop-fallback { display: none !important; }
        .axon-playground-shell { display: flex !important; }

        @media (max-width: 1280px) {
          .axon-playground-shell main > header {
            grid-template-columns: minmax(280px, 1fr) auto !important;
            padding: 0 16px !important;
          }
          .axon-playground-shell main > header > div:first-child { gap: 14px !important; }
          .axon-playground-shell main > header > div:first-child > div:nth-child(2) { max-width: 200px !important; }
          .axon-playground-shell main > header > div:last-child { gap: 10px !important; }
        }
      `}</style>

      <LeftPanel
        state={state}
        width={leftWidth}
        customDataset={customDataset}
        onPatch={patch}
        onDatasetSelect={handleDatasetSelect}
        onReset={() => resetVisuals()}
        onApplyPreset={applyPreset}
        onCustomDatasetReady={handleCustomDatasetReady}
      />

      <ResizeHandle
        onDrag={(dx) => setLeftWidth((w) => clamp(w + dx, 220, 420))}
        onReset={() => setLeftWidth(258)}
      />

      <CenterPanel
        state={state}
        displayEpoch={displayEpoch}
        displayLoss={displayLoss}
        grid={visibleGrid}
        data={data}
        predictions={visiblePredictions}
        selectedPointIndex={selectedPointIndex}
        snapshots={snapshots}
        inspectIndex={inspectIndex}
        viewMode={viewMode}
        metrics={visibleMetrics ?? emptyMetrics}
        onViewModeChange={setViewMode}
        onInspect={handleInspect}
        onGoLive={handleGoLive}
        onSelectPoint={handleSelectPoint}
        onReset={() => resetVisuals()}
        onStep={handleStep}
        onToggleTraining={toggleTraining}
      />

      <ResizeHandle
        onDrag={(dx) => setRightWidth((w) => clamp(w - dx, 240, 420))}
        onReset={() => setRightWidth(288)}
      />

      <RightPanel
        state={state}
        width={rightWidth}
        displayLoss={displayLoss}
        displayEpoch={displayEpoch}
        lossHistory={displayLossHistory}
        weights={visibleWeights}
        metrics={visibleMetrics}
        predictions={visiblePredictions}
        inspection={visibleInspection}
        explainCards={explainCards}
        savedRuns={savedRuns}
        customDataset={customDataset}
        onSaveRun={handleSaveRun}
        onRemoveRun={(id) => setSavedRuns((prev) => prev.filter((run) => run.id !== id))}
        onClearInspection={() => {
          setSelectedPointIndex(null);
          setPointInspection(null);
        }}
        onExportJson={handleExportJson}
        onExportScreenshot={() => exportCanvasPng()}
        onCopySummary={handleCopySummary}
      />
    </div>
  );
}
