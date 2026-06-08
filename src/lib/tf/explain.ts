import type { CustomDatasetInfo, Dataset, EpochSnapshot, PointPrediction, SavedRun, TrainingMetrics, ViewMode } from "@/lib/tf/types";

export interface ExplainCard {
  title: string;
  detail: string;
  tone: "neutral" | "good" | "warn";
}

export function buildExplainCards(args: {
  dataset: Dataset;
  customDataset: CustomDatasetInfo | null;
  metrics: TrainingMetrics | null;
  predictions: PointPrediction[];
  snapshots: EpochSnapshot[];
  savedRuns: SavedRun[];
  loss: number | null;
  epoch: number;
  viewMode: ViewMode;
}): ExplainCard[] {
  const { dataset, customDataset, metrics, predictions, snapshots, savedRuns, loss, epoch, viewMode } = args;
  const cards: ExplainCard[] = [];

  if (dataset === "custom" && customDataset) {
    cards.push({ title: "Custom CSV active", detail: `${customDataset.rows} rows imported. ${customDataset.invalidRows} invalid rows skipped. Train/test split is active.`, tone: "neutral" });
  }

  if (!metrics || epoch === 0) {
    cards.push({ title: "Ready to inspect", detail: "Run the model, then switch to Errors or Gradients to debug the network.", tone: "neutral" });
    return cards.slice(0, 3);
  }

  if (metrics.testAccuracy >= 0.9) cards.push({ title: "Generalizes well", detail: `Test accuracy is ${(metrics.testAccuracy * 100).toFixed(1)}%. The boundary works on held-out points too.`, tone: "good" });
  if (metrics.generalizationGap > 0.14 && metrics.trainAccuracy > metrics.testAccuracy) cards.push({ title: "Possible overfitting", detail: `Train/test gap is ${(metrics.generalizationGap * 100).toFixed(1)}%. Try fewer neurons or more noise-robust settings.`, tone: "warn" });
  if (metrics.accuracy < 0.7 && epoch > 20) cards.push({ title: "Likely underfitting", detail: "Accuracy is still low after several epochs. Try more hidden neurons, tanh for spirals, or a lower noise level.", tone: "warn" });
  if (metrics.meanConfidence < 0.25 && epoch > 15) cards.push({ title: "Low confidence predictions", detail: "The model is often close to 0.5. It has not separated the classes strongly yet.", tone: "warn" });
  if (metrics.updateNorm > 0.08 && epoch > 8) cards.push({ title: "Updates look aggressive", detail: "Weight updates are large. If the loss jumps around, reduce the learning rate.", tone: "warn" });

  if (metrics.layerUpdateNorms.length) {
    const maxUpdate = Math.max(...metrics.layerUpdateNorms);
    const minUpdate = Math.min(...metrics.layerUpdateNorms);
    if (maxUpdate > 0 && minUpdate / maxUpdate < 0.08 && epoch > 12) cards.push({ title: "Uneven gradient flow", detail: "One layer is changing much less than the others. Try tanh or fewer layers if training stalls.", tone: "warn" });
  }

  const recent = snapshots.slice(-8);
  if (recent.length >= 5) {
    const first = recent[0].loss;
    const last = recent[recent.length - 1].loss;
    if (last < first * 0.75) cards.push({ title: "Loss is converging", detail: "Recent snapshots show a clear downward trend. Save this run for comparison.", tone: "good" });
    else if (last > first * 1.08 && epoch > 20) cards.push({ title: "Loss is drifting upward", detail: "Recent loss is unstable. Lower the learning rate or reset with a cleaner preset.", tone: "warn" });
  }

  const errors = predictions.filter((p) => !p.correct).length;
  if (viewMode === "errors" && errors > 0) cards.push({ title: "Errors are highlighted", detail: `${errors} points are misclassified. Click one to inspect the forward pass.`, tone: "neutral" });
  if (savedRuns.length >= 2) cards.push({ title: "Comparison ready", detail: "You have multiple saved runs. Compare loss, test accuracy, and generalization gap before choosing a model.", tone: "neutral" });

  if (cards.length === 0) cards.push({ title: "Training in progress", detail: loss === null ? "Waiting for the first loss value." : `Loss is ${loss.toFixed(4)}. Use the timeline to inspect earlier snapshots.`, tone: "neutral" });
  return cards.slice(0, 3);
}
