"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PRESETS, generateDataset } from "@/lib/tf/datasets";
import { buildExplainCards } from "@/lib/tf/explain";
import {
  buildExperimentExport,
  copyExperimentSummary,
  downloadExperimentJson,
  exportCanvasPng,
} from "@/lib/tf/export";
import { trainer } from "@/lib/tf/trainer";
import { deleteCloudRun, fetchCloudRuns, saveCloudRun } from "@/lib/client/runs";
import { createShareLink, fetchSharedRun } from "@/lib/client/share";
import type {
  CustomDatasetInfo,
  DataPoint,
  Dataset,
  EpochSnapshot,
  LayerConfig,
  PlaygroundState,
  PointInspection,
  PointPrediction,
  SavedRun,
  TrainingMetrics,
  TrainStepResult,
  ViewMode,
} from "@/lib/tf/types";
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

const WIDTH_KEY = "axon:panel-widths:v2";

function isDataset(value: unknown): value is Dataset {
  return value === "xor" || value === "spiral" || value === "circles" || value === "blobs" || value === "custom";
}

function normalizeLayers(input: unknown): LayerConfig[] {
  if (!Array.isArray(input) || input.length === 0) return PRESETS[1].layers;

  if (typeof input[0] === "number") {
    const nums = input.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
    if (!nums.length) return PRESETS[1].layers;

    return nums.map((neurons, index) => ({
      id: Date.now() + index,
      neurons,
      activation: index === 0 ? "linear" : index === nums.length - 1 ? "sigmoid" : "relu",
    }));
  }

  return input
    .filter((layer): layer is Partial<LayerConfig> => typeof layer === "object" && layer !== null)
    .map((layer, index) => ({
      id: typeof layer.id === "number" ? layer.id : Date.now() + index,
      neurons: typeof layer.neurons === "number" ? layer.neurons : index === 0 ? 2 : 4,
      activation:
        layer.activation === "relu" ||
        layer.activation === "sigmoid" ||
        layer.activation === "tanh" ||
        layer.activation === "linear"
          ? layer.activation
          : index === 0
            ? "linear"
            : "relu",
    }));
}

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
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const needsSetupRef = useRef(true);
  const searchParams = useSearchParams();
  const exampleAppliedRef = useRef<string | null>(null);
  const sharedLoadedRef = useRef<string | null>(null);

  const patch = useCallback((p: Partial<PlaygroundState>) => {
    setState((prev) => ({ ...prev, ...p }));
  }, []);

  useEffect(() => {
    document.body.dataset.axonPlayground = "true";

    try {
      const widths = JSON.parse(localStorage.getItem(WIDTH_KEY) ?? "null");
      if (widths?.left) setLeftWidth(widths.left);
      if (widths?.right) setRightWidth(widths.right);
    } catch {}

    fetchCloudRuns()
      .then((runs) => setSavedRuns(Array.isArray(runs) ? runs : []))
      .catch(() => setSavedRuns([]));

    return () => {
      delete document.body.dataset.axonPlayground;
      trainer.stop();
      trainer.dispose();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(WIDTH_KEY, JSON.stringify({ left: leftWidth, right: rightWidth }));
  }, [leftWidth, rightWidth]);

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
  useEffect(() => {
  const sharedRun = searchParams.get("run");
  if (sharedRun) return;

  const exampleId = searchParams.get("example");
  if (!exampleId) return;
  if (exampleAppliedRef.current === exampleId) return;

  const preset = PRESETS.find((p) => p.id === exampleId);

  if (!preset) return;

  exampleAppliedRef.current = exampleId;
  applyPreset(preset);
}, [applyPreset, searchParams]);

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
            ? { point: fallback, activations: [], output: fallback.probability, source: "snapshot" }
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

  const applySharedPayload = useCallback((payload: any) => {
    const incoming = payload?.state ?? payload?.config ?? payload;
    const dataset = isDataset(incoming?.dataset) ? incoming.dataset : "circles";
    const layers = normalizeLayers(incoming?.layers);
    const incomingSnapshots = Array.isArray(payload?.snapshots) ? payload.snapshots : [];
    const latest = incomingSnapshots[incomingSnapshots.length - 1] as EpochSnapshot | undefined;
    const customPoints = Array.isArray(payload?.customData) ? (payload.customData as DataPoint[]) : [];
    const nextNoise = typeof incoming?.noise === "number" ? incoming.noise : 0.1;

    trainer.stop();
    trainer.dispose();
    needsSetupRef.current = true;
    setInspectIndex(null);
    setSelectedPointIndex(null);
    setPointInspection(null);

    if (dataset === "custom" && customPoints.length) {
      setCustomData(customPoints);
      setCustomDataset(payload?.customDataset ?? null);
      setData(customPoints);
    } else {
      setCustomData([]);
      setCustomDataset(null);
      setData(generateDataset(dataset, 200, nextNoise));
    }

    setState({
      layers,
      learningRate: typeof incoming?.learningRate === "number" ? incoming.learningRate : PRESETS[1].learningRate,
      dataset,
      noise: nextNoise,
      isTraining: false,
      epoch: typeof incoming?.epoch === "number" ? incoming.epoch : latest?.epoch ?? 0,
      loss: typeof incoming?.loss === "number" ? incoming.loss : latest?.loss ?? null,
    });

    setSnapshots(incomingSnapshots);
    setGrid(latest?.grid ?? []);
    setWeights(latest?.weights ?? []);
    setMetrics(payload?.metrics ?? payload?.latestMetrics ?? latest?.metrics ?? null);
    setPredictions(payload?.predictions ?? payload?.latestPredictions ?? latest?.predictions ?? []);
    setLossHistory(incomingSnapshots.map((s: EpochSnapshot) => s.loss));
    setShareStatus("Shared run loaded.");
  }, []);

  useEffect(() => {
    const shareId = new URLSearchParams(window.location.search).get("run");
    if (!shareId || sharedLoadedRef.current === shareId) return;

    sharedLoadedRef.current = shareId;
    setShareStatus("Loading shared run…");

    fetchSharedRun(shareId)
      .then((run) => applySharedPayload((run as any).payload ?? run))
      .catch(() => setShareStatus("Could not load shared run."));
  }, [applySharedPayload]);

  const handleSaveRun = useCallback(async () => {
    const name = `${datasetName} · epoch ${displayEpoch}`;
    const fallback: SavedRun = {
      id: `${Date.now()}`,
      name,
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

    setShareStatus("Saving run…");

    try {
      const cloudRun = await saveCloudRun({
        name,
        dataset: state.dataset,
        datasetName,
        config: {
          layers: state.layers,
          learningRate: state.learningRate,
          noise: state.noise,
          epoch: displayEpoch,
          loss: displayLoss,
        },
        metrics: visibleMetrics,
        snapshots,
        predictions: visiblePredictions,
      });
      setSavedRuns((prev) => [cloudRun, ...prev.filter((run) => run.id !== cloudRun.id)].slice(0, 8));
      setShareStatus("Saved to cloud.");
    } catch {
      setSavedRuns((prev) => [fallback, ...prev].slice(0, 8));
      setShareStatus("Cloud save failed. Kept in current session.");
    }
  }, [
    datasetName,
    displayEpoch,
    displayLoss,
    snapshots,
    state.dataset,
    state.layers,
    state.learningRate,
    state.noise,
    visibleMetrics,
    visiblePredictions,
  ]);

  const handleShareRun = useCallback(async () => {
    const name = `${datasetName} · epoch ${displayEpoch}`;
    setShareStatus("Creating share link…");

    try {
      const result = await createShareLink({
        name,
        dataset: state.dataset,
        datasetName,
        payload: {
          version: 1,
          state: {
            ...state,
            isTraining: false,
            epoch: displayEpoch,
            loss: displayLoss,
          },
          customDataset,
          customData: state.dataset === "custom" ? customData : [],
          metrics: visibleMetrics,
          predictions: visiblePredictions,
          snapshots,
        },
      });

      const url = new URL(result.url, window.location.origin).toString();
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("Share link copied.");
      } catch {
        setShareStatus(url);
      }
    } catch {
      setShareStatus("Could not create share link.");
    }
  }, [
    customData,
    customDataset,
    datasetName,
    displayEpoch,
    displayLoss,
    snapshots,
    state,
    visibleMetrics,
    visiblePredictions,
  ]);

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
    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSaveRun();
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        toggleTraining();
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "r") resetVisuals();
      if (k === "s") void handleStep();
      if (k === "e") setViewMode("errors");
      if (k === "g") setViewMode("gradients");
      if (k === "b") setViewMode("boundary");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSaveRun, handleStep, resetVisuals, toggleTraining]);

  return (
    <div
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
        input[type=range] { -webkit-appearance: none; height: 2px; background: #1e1e26; border-radius: 2px; outline: none; width: 100%; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 11px; height: 11px; border-radius: 50%; background: #a78bfa; cursor: pointer; box-shadow: 0 0 0 3px rgba(167,139,250,0.12); transition: box-shadow 0.15s; }
        input[type=range]:hover::-webkit-slider-thumb { box-shadow: 0 0 0 5px rgba(167,139,250,0.18); }
        input[type=range]:disabled::-webkit-slider-thumb { background: #3a3a48; box-shadow: none; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1e28; border-radius: 2px; }
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
        onRemoveRun={async (id) => {
          setSavedRuns((prev) => prev.filter((r) => r.id !== id));
          try {
            await deleteCloudRun(id);
          } catch {}
        }}
        onClearInspection={() => {
          setSelectedPointIndex(null);
          setPointInspection(null);
        }}
        onExportJson={handleExportJson}
        onExportScreenshot={() => exportCanvasPng()}
        onCopySummary={handleCopySummary}
        onShareRun={handleShareRun}
        shareStatus={shareStatus}
      />
    </div>
  );
}
