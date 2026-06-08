export type Activation = "relu" | "sigmoid" | "tanh" | "linear";
export type Dataset = "xor" | "spiral" | "circles" | "blobs" | "custom";
export type ViewMode = "boundary" | "errors" | "gradients";
export type DataSplit = "train" | "test";

export interface DataPoint {
  x: number;
  y: number;
  label: number;
  raw?: Record<string, string | number>;
  split?: DataSplit;
}

export interface LayerConfig {
  id: number;
  neurons: number;
  activation: Activation;
}

export interface CustomDatasetInfo {
  name: string;
  rows: number;
  invalidRows: number;
  xColumn: string;
  yColumn: string;
  labelColumn: string;
  labelMap: Record<string, number>;
  xRange: [number, number];
  yRange: [number, number];
}

export interface PlaygroundState {
  layers: LayerConfig[];
  learningRate: number;
  dataset: Dataset;
  noise: number;
  isTraining: boolean;
  epoch: number;
  loss: number | null;
}

export interface PointPrediction {
  index: number;
  x: number;
  y: number;
  label: number;
  probability: number;
  predicted: number;
  confidence: number;
  correct: boolean;
  split?: DataSplit;
}

export interface LayerActivation {
  layerIndex: number;
  name: string;
  activation: Activation | "sigmoid";
  values: number[];
}

export interface PointInspection {
  point: PointPrediction;
  activations: LayerActivation[];
  output: number;
  source: "live" | "snapshot";
}

export interface TrainingMetrics {
  accuracy: number;
  trainAccuracy: number;
  testAccuracy: number;
  generalizationGap: number;
  trainCount: number;
  testCount: number;
  meanConfidence: number;
  positiveRatio: number;
  updateNorm: number;
  examplesPerSecond: number;
  layerNorms: number[];
  layerUpdateNorms: number[];
  misclassifiedCount: number;
}

export interface TrainStepResult {
  epoch: number;
  loss: number;
  weights: number[];
  grid: number[];
  metrics: TrainingMetrics;
  predictions: PointPrediction[];
}

export interface EpochSnapshot {
  epoch: number;
  loss: number;
  weights: number[];
  grid: number[];
  metrics: TrainingMetrics;
  predictions: PointPrediction[];
}

export interface SavedRun {
  id: string;
  name: string;
  createdAt: number;
  dataset: Dataset;
  datasetName: string;
  layers: LayerConfig[];
  learningRate: number;
  noise: number;
  epoch: number;
  loss: number | null;
  metrics: TrainingMetrics | null;
}

export interface ExperimentExport {
  version: 1;
  exportedAt: string;
  state: Omit<PlaygroundState, "isTraining">;
  customDataset: CustomDatasetInfo | null;
  latestMetrics: TrainingMetrics | null;
  latestPredictions: PointPrediction[];
  snapshots: EpochSnapshot[];
  savedRuns: SavedRun[];
}
