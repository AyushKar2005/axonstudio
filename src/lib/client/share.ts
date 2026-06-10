export async function createShareLink(payload: {
  name: string;
  dataset: string;
  datasetName?: string;
  payload: unknown;
}) {
  const res = await fetch("/api/share", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to create share link");
  }

  return res.json() as Promise<{
    shareId: string;
    url: string;
    run: unknown;
  }>;
}

export async function fetchSharedRun(shareId: string) {
  const res = await fetch(`/api/share/${shareId}`);

  if (!res.ok) {
    throw new Error("Shared run not found");
  }

  const data = await res.json();
  return data.run as { payload?: unknown };
}
