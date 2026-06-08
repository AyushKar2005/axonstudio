import * as tf from "@tensorflow/tfjs";
import { generateDataset } from "@/lib/tf/datasets";
import type {
  Activation,
  DataPoint,
  Dataset,
  LayerActivation,
  LayerConfig,
  PointInspection,
  PointPrediction,
  TrainStepResult,
  TrainingMetrics,
} from "@/lib/tf/types";

function toTfActivation(a: Activation): string {
  return ({ relu: "relu", sigmoid: "sigmoid", tanh: "tanh", linear: "linear" })[a];
}

export function buildModel(layers: LayerConfig[], lr: number): tf.Sequential {
  const model = tf.sequential();
  const firstHidden = layers[1] ?? layers[0];

  model.add(tf.layers.dense({
    units: firstHidden.neurons,
    inputShape: [2],
    activation: toTfActivation(firstHidden.activation) as any,
    kernelInitializer: "glorotUniform",
  }));

  for (let i = 2; i < layers.length - 1; i++) {
    model.add(tf.layers.dense({
      units: layers[i].neurons,
      activation: toTfActivation(layers[i].activation) as any,
      kernelInitializer: "glorotUniform",
    }));
  }

  model.add(tf.layers.dense({ units: 1, activation: "sigmoid", kernelInitializer: "glorotUniform" }));
  model.compile({ optimizer: tf.train.adam(lr), loss: "binaryCrossentropy" });
  return model;
}

export function extractWeights(model: tf.Sequential): number[] {
  const all: number[] = [];
  for (const layer of model.layers) {
    const ws = layer.getWeights();
    if (ws.length > 0) (ws[0].arraySync() as number[][]).flat().forEach((w) => all.push(w));
  }
  return all;
}

export function extractLayerWeights(model: tf.Sequential): number[][] {
  return model.layers.map((layer) => {
    const ws = layer.getWeights();
    if (!ws.length) return [];
    return (ws[0].arraySync() as number[][]).flat();
  });
}

export function extractLayerNorms(model: tf.Sequential): number[] {
  return extractLayerWeights(model).map((raw) => {
    if (!raw.length) return 0;
    return Math.sqrt(raw.reduce((sum, w) => sum + w * w, 0) / raw.length);
  });
}

function computeLayerUpdateNorms(current: number[][], previous: number[][]): number[] {
  return current.map((layer, layerIndex) => {
    const prev = previous[layerIndex] ?? [];
    const paired = Math.min(layer.length, prev.length);
    if (!paired) return 0;
    let sum = 0;
    for (let i = 0; i < paired; i++) {
      const d = layer[i] - prev[i];
      sum += d * d;
    }
    return Math.sqrt(sum / paired);
  });
}

export function predictDataset(model: tf.Sequential, data: DataPoint[]): PointPrediction[] {
  if (!data.length) return [];
  const input = tf.tensor2d(data.map((p) => [p.x, p.y]));
  const pred = model.predict(input) as tf.Tensor;
  const probabilities = Array.from(pred.dataSync()) as number[];
  input.dispose();
  pred.dispose();

  return probabilities.map((probability, index) => {
    const point = data[index];
    const predicted = probability >= 0.5 ? 1 : 0;
    const confidence = Math.abs(probability - 0.5) * 2;
    return {
      index,
      x: point.x,
      y: point.y,
      label: point.label,
      probability,
      predicted,
      confidence,
      correct: predicted === point.label,
      split: point.split,
    };
  });
}

export function predictGrid(model: tf.Sequential, resolution = 60): number[] {
  const inputs: number[][] = [];
  const step = 2 / resolution;
  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) inputs.push([-1 + col * step, 1 - row * step]);
  }
  const t = tf.tensor2d(inputs);
  const pred = model.predict(t) as tf.Tensor;
  const out = Array.from(pred.dataSync()) as number[];
  t.dispose();
  pred.dispose();
  return out;
}

function emptyMetrics(): TrainingMetrics {
  return {
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
}

function splitData(data: DataPoint[], trainRatio = 0.8) {
  const shuffled = data.map((point, index) => ({ point, index, key: Math.sin(index * 999.91) }));
  shuffled.sort((a, b) => a.key - b.key);
  const trainCut = Math.max(1, Math.min(data.length - 1, Math.round(data.length * trainRatio)));
  const marked = shuffled.map((item, i) => ({ index: item.index, point: { ...item.point, split: i < trainCut ? "train" as const : "test" as const } }));
  marked.sort((a, b) => a.index - b.index);
  return marked.map((item) => item.point);
}

export class Trainer {
  private model: tf.Sequential | null = null;
  private xs: tf.Tensor2D | null = null;
  private ys: tf.Tensor2D | null = null;
  private stopped = false;
  private data: DataPoint[] = [];
  private trainData: DataPoint[] = [];
  private testData: DataPoint[] = [];
  private epoch = 0;
  private lastWeights: number[] = [];
  private lastLayerWeights: number[][] = [];
  private layerConfigs: LayerConfig[] = [];

  setup(layers: LayerConfig[], dataset: Dataset, noise: number, lr: number, customData?: DataPoint[]) {
    this.dispose();
    this.layerConfigs = layers.map((layer) => ({ ...layer }));
    const source = dataset === "custom" && customData?.length ? customData.map((point) => ({ ...point })) : generateDataset(dataset, 200, noise);
    this.data = splitData(source, 0.8);
    this.trainData = this.data.filter((p) => p.split === "train");
    this.testData = this.data.filter((p) => p.split === "test");
    this.model = buildModel(layers, lr);
    this.xs = tf.tensor2d(this.trainData.map((p) => [p.x, p.y]));
    this.ys = tf.tensor2d(this.trainData.map((p) => [p.label]));
    this.stopped = false;
    this.epoch = 0;
    this.lastWeights = extractWeights(this.model);
    this.lastLayerWeights = extractLayerWeights(this.model);
  }

  stop() {
    this.stopped = true;
  }

  async trainOneEpoch(gridResolution = 60, forceGrid = true): Promise<TrainStepResult | null> {
    if (!this.model || !this.xs || !this.ys) return null;
    this.stopped = false;
    const started = performance.now();

    const h = await this.model.fit(this.xs, this.ys, { epochs: 1, batchSize: 32, shuffle: true, verbose: 0 });
    if (!this.model) return null;

    const loss = h.history.loss[0] as number;
    const weights = extractWeights(this.model);
    const currentLayerWeights = extractLayerWeights(this.model);
    const layerNorms = extractLayerNorms(this.model);
    const layerUpdateNorms = computeLayerUpdateNorms(currentLayerWeights, this.lastLayerWeights);
    const grid = forceGrid || this.epoch % 3 === 0 ? predictGrid(this.model, gridResolution) : [];
    const predictions = predictDataset(this.model, this.data);
    const metrics = this.computeMetrics(weights, layerNorms, layerUpdateNorms, predictions, started);

    this.lastWeights = weights;
    this.lastLayerWeights = currentLayerWeights;
    this.epoch += 1;

    return { epoch: this.epoch, loss, weights, grid, metrics, predictions };
  }

  async train(onEpochEnd: (result: TrainStepResult) => void) {
    if (!this.model || !this.xs || !this.ys) return;
    this.stopped = false;
    const step = async () => {
      if (this.stopped) return;
      try {
        const result = await this.trainOneEpoch(60, true);
        if (this.stopped || !result) return;
        onEpochEnd(result);
        if (!this.stopped) setTimeout(step, 50);
      } catch {
        this.stopped = true;
      }
    };
    step();
  }

  private computeMetrics(weights: number[], layerNorms: number[], layerUpdateNorms: number[], predictions: PointPrediction[], started: number): TrainingMetrics {
    if (!this.model || !this.data.length || !predictions.length) return emptyMetrics();
    const correct = predictions.filter((p) => p.correct).length;
    const positives = predictions.filter((p) => p.predicted === 1).length;
    const confidenceSum = predictions.reduce((sum, p) => sum + p.confidence, 0);
    const train = predictions.filter((p) => p.split === "train");
    const test = predictions.filter((p) => p.split === "test");
    const trainAcc = train.length ? train.filter((p) => p.correct).length / train.length : 0;
    const testAcc = test.length ? test.filter((p) => p.correct).length / test.length : trainAcc;

    const paired = Math.min(weights.length, this.lastWeights.length);
    let updateNorm = 0;
    if (paired > 0) {
      for (let i = 0; i < paired; i++) {
        const d = weights[i] - this.lastWeights[i];
        updateNorm += d * d;
      }
      updateNorm = Math.sqrt(updateNorm / paired);
    }

    const elapsed = Math.max((performance.now() - started) / 1000, 0.001);
    return {
      accuracy: correct / predictions.length,
      trainAccuracy: trainAcc,
      testAccuracy: testAcc,
      generalizationGap: Math.abs(trainAcc - testAcc),
      trainCount: train.length,
      testCount: test.length,
      meanConfidence: confidenceSum / predictions.length,
      positiveRatio: positives / predictions.length,
      updateNorm,
      examplesPerSecond: this.trainData.length / elapsed,
      layerNorms,
      layerUpdateNorms,
      misclassifiedCount: predictions.length - correct,
    };
  }

  inspectPoint(index: number, fallback?: PointPrediction): PointInspection | null {
    if (!this.model || !this.data[index]) {
      if (!fallback) return null;
      return { point: fallback, activations: [], output: fallback.probability, source: "snapshot" };
    }

    const point = fallback ?? predictDataset(this.model, [this.data[index]])[0];
    const activations: LayerActivation[] = [];
    let current: tf.Tensor = tf.tensor2d([[this.data[index].x, this.data[index].y]]);

    this.model.layers.forEach((layer, layerIndex) => {
      const next = layer.apply(current) as tf.Tensor;
      const values = Array.from(next.dataSync()) as number[];
      const isOutput = layerIndex === this.model!.layers.length - 1;
      const config = this.layerConfigs[layerIndex + 1];
      activations.push({
        layerIndex,
        name: isOutput ? "output" : `hidden ${layerIndex + 1}`,
        activation: isOutput ? "sigmoid" : config?.activation ?? "linear",
        values,
      });
      current.dispose();
      current = next;
    });

    const output = activations.at(-1)?.values[0] ?? point.probability;
    current.dispose();
    return { point: { ...point, probability: output }, activations, output, source: "live" };
  }

  getData() {
    return this.data;
  }

  getEpoch() {
    return this.epoch;
  }

  getModel() {
    return this.model;
  }

  dispose() {
    this.xs?.dispose();
    this.ys?.dispose();
    this.model?.dispose();
    this.xs = null;
    this.ys = null;
    this.model = null;
    this.data = [];
    this.trainData = [];
    this.testData = [];
    this.epoch = 0;
    this.lastWeights = [];
    this.lastLayerWeights = [];
    this.layerConfigs = [];
  }
}

export const trainer = new Trainer();
