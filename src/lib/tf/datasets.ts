import type { Activation, DataPoint, Dataset, LayerConfig } from "@/lib/tf/types";

export interface PresetConfig {
  id: string;
  name: string;
  detail: string;
  dataset: Exclude<Dataset, "custom">;
  noise: number;
  learningRate: number;
  layers: LayerConfig[];
}

export const makeLayers = (neurons: number[], activation: Activation): LayerConfig[] => [
  { id: 1, neurons: 2, activation: "linear" },
  ...neurons.map((n, i) => ({ id: i + 2, neurons: n, activation })),
  { id: neurons.length + 2, neurons: 1, activation: "sigmoid" },
];

export const PRESETS: PresetConfig[] = [
  {
    id: "xor-small",
    name: "XOR compact",
    detail: "2 hidden layers · ReLU",
    dataset: "xor",
    noise: 0.08,
    learningRate: 0.035,
    layers: makeLayers([4, 4], "relu"),
  },
  {
    id: "circles-fast",
    name: "Circles clean",
    detail: "fast boundary demo",
    dataset: "circles",
    noise: 0.1,
    learningRate: 0.03,
    layers: makeLayers([4, 4], "relu"),
  },
  {
    id: "spiral-deep",
    name: "Spiral deep",
    detail: "4 hidden layers · tanh",
    dataset: "spiral",
    noise: 0.08,
    learningRate: 0.018,
    layers: makeLayers([8, 8, 8, 8], "tanh"),
  },
  {
    id: "linear-base",
    name: "Linear baseline",
    detail: "blobs · one boundary",
    dataset: "blobs",
    noise: 0.12,
    learningRate: 0.04,
    layers: makeLayers([2], "linear"),
  },
];

export function generateDataset(type: Dataset, n = 200, noise = 0.1): DataPoint[] {
  const points: DataPoint[] = [];
  const addNoise = () => (Math.random() - 0.5) * noise * 2;

  switch (type) {
    case "xor": {
      for (let i = 0; i < n; i++) {
        const x = Math.random() * 2 - 1;
        const y = Math.random() * 2 - 1;
        points.push({ x: x + addNoise(), y: y + addNoise(), label: x * y > 0 ? 1 : 0 });
      }
      break;
    }
    case "circles": {
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const inner = i < n / 2;
        const r = inner ? 0.3 + Math.random() * 0.15 : 0.65 + Math.random() * 0.2;
        points.push({ x: r * Math.cos(angle) + addNoise(), y: r * Math.sin(angle) + addNoise(), label: inner ? 0 : 1 });
      }
      break;
    }
    case "spiral": {
      const half = Math.floor(n / 2);
      for (let i = 0; i < half; i++) {
        const t = (i / half) * Math.PI * 3;
        const r = (i / half) * 0.9;
        points.push({ x: r * Math.cos(t) + addNoise(), y: r * Math.sin(t) + addNoise(), label: 0 });
        points.push({ x: r * Math.cos(t + Math.PI) + addNoise(), y: r * Math.sin(t + Math.PI) + addNoise(), label: 1 });
      }
      break;
    }
    case "blobs": {
      for (let i = 0; i < n; i++) {
        const label = i < n / 2 ? 0 : 1;
        const cx = label === 0 ? -0.4 : 0.4;
        const cy = label === 0 ? -0.4 : 0.4;
        points.push({ x: cx + (Math.random() - 0.5) * 0.6 + addNoise(), y: cy + (Math.random() - 0.5) * 0.6 + addNoise(), label });
      }
      break;
    }
    case "custom":
      break;
  }
  return points;
}
