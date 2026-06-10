import type { Dataset, LayerConfig, SavedRun, TrainingMetrics } from "@/lib/tf/types";
import { getOwnerKey } from "@/lib/client/ownerKey";

type CloudRunRow = {
  id: string;
  name: string;
  dataset: string;
  dataset_name?: string | null;
  config?: {
    layers?: LayerConfig[];
    learningRate?: number;
    noise?: number;
    epoch?: number;
    loss?: number | null;
  } | null;
  metrics?: TrainingMetrics | null;
  created_at?: string;
};

export function cloudRunToSavedRun(row: CloudRunRow): SavedRun {
  const config = row.config ?? {};

  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    dataset: row.dataset as Dataset,
    datasetName: row.dataset_name ?? row.dataset,
    layers: Array.isArray(config.layers) ? config.layers : [],
    learningRate: typeof config.learningRate === "number" ? config.learningRate : 0,
    noise: typeof config.noise === "number" ? config.noise : 0,
    epoch: typeof config.epoch === "number" ? config.epoch : 0,
    loss: typeof config.loss === "number" ? config.loss : null,
    metrics: row.metrics ?? null,
  };
}

export async function fetchCloudRuns() {
  const ownerKey = getOwnerKey();
  const res = await fetch(`/api/runs?ownerKey=${encodeURIComponent(ownerKey)}`);

  if (!res.ok) {
    throw new Error("Failed to fetch saved runs");
  }

  const data = await res.json();
  return ((data.runs ?? []) as CloudRunRow[]).map(cloudRunToSavedRun);
}

export async function saveCloudRun(payload: {
  name: string;
  dataset: string;
  datasetName?: string;
  config: unknown;
  metrics?: unknown;
  snapshots?: unknown;
  predictions?: unknown;
}) {
  const ownerKey = getOwnerKey();

  const res = await fetch("/api/runs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ownerKey,
      ...payload,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to save run");
  }

  const data = await res.json();
  return cloudRunToSavedRun(data.run as CloudRunRow);
}

export async function deleteCloudRun(id: string) {
  const ownerKey = getOwnerKey();

  const res = await fetch(
    `/api/runs/${id}?ownerKey=${encodeURIComponent(ownerKey)}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    throw new Error("Failed to delete run");
  }

  return true;
}
