import type { CustomDatasetInfo, EpochSnapshot, ExperimentExport, PlaygroundState, PointPrediction, SavedRun, TrainingMetrics } from "@/lib/tf/types";

export function downloadTextFile(content: string, fileName: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function buildExperimentExport(args: {
  state: PlaygroundState;
  customDataset: CustomDatasetInfo | null;
  metrics: TrainingMetrics | null;
  predictions: PointPrediction[];
  snapshots: EpochSnapshot[];
  savedRuns: SavedRun[];
}): ExperimentExport {
  const { state, customDataset, metrics, predictions, snapshots, savedRuns } = args;
  const { isTraining, ...stableState } = state;
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    state: stableState,
    customDataset,
    latestMetrics: metrics,
    latestPredictions: predictions,
    snapshots: snapshots.slice(-80),
    savedRuns,
  };
}

export function downloadExperimentJson(payload: ExperimentExport) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  downloadTextFile(JSON.stringify(payload, null, 2), `axon-experiment-${stamp}.json`, "application/json");
}

export async function copyExperimentSummary(args: {
  datasetName: string;
  epoch: number;
  loss: number | null;
  metrics: TrainingMetrics | null;
}) {
  const { datasetName, epoch, loss, metrics } = args;
  const text = [
    `Axon Studio experiment`,
    `Dataset: ${datasetName}`,
    `Epoch: ${epoch}`,
    `Loss: ${loss === null ? "n/a" : loss.toFixed(4)}`,
    `Train accuracy: ${metrics ? (metrics.trainAccuracy * 100).toFixed(1) + "%" : "n/a"}`,
    `Test accuracy: ${metrics ? (metrics.testAccuracy * 100).toFixed(1) + "%" : "n/a"}`,
    `Generalization gap: ${metrics ? (metrics.generalizationGap * 100).toFixed(1) + "%" : "n/a"}`,
  ].join("\n");
  await navigator.clipboard.writeText(text);
}

export function exportCanvasPng(canvasId = "axon-boundary-canvas") {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Decision boundary canvas was not found.");
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axon-boundary-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}
