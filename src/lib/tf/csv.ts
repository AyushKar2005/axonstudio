import type { CustomDatasetInfo, DataPoint } from "@/lib/tf/types";

export interface CsvTable {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface CsvValidation {
  validRows: number;
  invalidRows: number;
  error: string | null;
  labelValues: string[];
}

export interface CsvBuildResult {
  data: DataPoint[];
  info: CustomDatasetInfo;
}

export const SAMPLE_2D_CSV = `x,y,label
0.100,0.060,0
-0.118,-0.012,1
0.146,0.089,0
-0.158,-0.044,1
0.128,0.176,0
-0.141,-0.171,1
0.055,0.270,0
-0.021,-0.285,1
-0.093,0.315,0
0.164,-0.304,1
-0.271,0.248,0
0.347,-0.170,1
-0.395,0.050,0
0.418,0.089,1
-0.380,-0.233,0
0.323,0.348,1
-0.207,-0.472,0
0.060,0.535,1
-0.106,-0.576,0
-0.285,0.551,1
0.455,-0.450,0
-0.606,0.274,1
0.689,-0.066,0
-0.698,-0.174,1
0.605,0.438,0
-0.416,-0.652,1
0.148,0.792,0
0.176,-0.812,1
-0.506,0.690,0
0.759,-0.440,1
-0.895,0.092,0
0.886,0.280,1
-0.708,-0.640,0
0.405,0.887,1
-0.005,-0.990,0
-0.443,0.905,1
0.800,-0.640,0
-1.000,0.170,1`;

const splitCsvLine = (line: string) => {
  const out: string[] = [];
  let cur = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cur += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }

  out.push(cur.trim());
  return out.map((v) => v.replace(/^"|"$/g, ""));
};

export function parseCsvText(text: string, fileName = "custom.csv"): CsvTable {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) throw new Error("CSV file is empty.");

  const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV needs a header row and at least one data row.");

  const headers = splitCsvLine(lines[0]).map((h, i) => h || `column_${i + 1}`);
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });

  return { fileName, headers, rows };
}

export async function readCsvFile(file: File): Promise<CsvTable> {
  const text = await file.text();
  return parseCsvText(text, file.name);
}

export function numericColumns(table: CsvTable): string[] {
  return table.headers.filter((header) => {
    const sample = table.rows.slice(0, 80).map((row) => Number(row[header])).filter(Number.isFinite);
    return sample.length >= Math.min(5, table.rows.length);
  });
}

export function inferColumns(table: CsvTable) {
  const nums = numericColumns(table);
  const lowered = table.headers.map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const find = (names: string[], fallback: string | undefined) => {
    const idx = lowered.findIndex((h) => names.some((n) => h === n || h.includes(n)));
    return idx >= 0 ? table.headers[idx] : fallback;
  };

  const xColumn = find(["x", "x1", "feature1", "feature_1", "axisx"], nums[0] ?? table.headers[0]);
  const yColumn = find(["y", "x2", "feature2", "feature_2", "axisy"], nums.find((n) => n !== xColumn) ?? nums[1] ?? table.headers[1]);
  const labelColumn = find(["label", "class", "target", "ytrue", "category"], table.headers.find((h) => h !== xColumn && h !== yColumn) ?? table.headers[2]);

  return { xColumn, yColumn, labelColumn };
}

export function validateCsvMapping(table: CsvTable | null, xColumn: string, yColumn: string, labelColumn: string): CsvValidation {
  if (!table) return { validRows: 0, invalidRows: 0, error: "Upload a CSV file first.", labelValues: [] };
  if (!xColumn || !yColumn || !labelColumn) return { validRows: 0, invalidRows: table.rows.length, error: "Choose x, y and label columns.", labelValues: [] };
  if (xColumn === yColumn) return { validRows: 0, invalidRows: table.rows.length, error: "X and Y columns must be different.", labelValues: [] };
  if (labelColumn === xColumn || labelColumn === yColumn) return { validRows: 0, invalidRows: table.rows.length, error: "Label column must be separate from x/y.", labelValues: [] };

  let validRows = 0;
  const labels = new Set<string>();
  table.rows.forEach((row) => {
    const x = Number(row[xColumn]);
    const y = Number(row[yColumn]);
    const label = String(row[labelColumn]).trim();
    if (Number.isFinite(x) && Number.isFinite(y) && label.length > 0) {
      validRows++;
      labels.add(label);
    }
  });

  const labelValues = Array.from(labels);
  const invalidRows = table.rows.length - validRows;
  let error: string | null = null;
  if (validRows < 12) error = "Need at least 12 valid numeric rows.";
  else if (labelValues.length !== 2) error = `CSV v1 supports exactly 2 label classes. Found ${labelValues.length}.`;

  return { validRows, invalidRows, error, labelValues };
}

const normalize = (value: number, min: number, max: number) => {
  if (Math.abs(max - min) < 1e-12) return 0;
  return ((value - min) / (max - min)) * 2 - 1;
};

export function buildDatasetFromCsv(table: CsvTable, xColumn: string, yColumn: string, labelColumn: string): CsvBuildResult {
  const validation = validateCsvMapping(table, xColumn, yColumn, labelColumn);
  if (validation.error) throw new Error(validation.error);

  const parsed = table.rows
    .map((row) => ({
      xRaw: Number(row[xColumn]),
      yRaw: Number(row[yColumn]),
      labelRaw: String(row[labelColumn]).trim(),
      raw: row,
    }))
    .filter((row) => Number.isFinite(row.xRaw) && Number.isFinite(row.yRaw) && row.labelRaw.length > 0);

  const labels = Array.from(new Set(parsed.map((row) => row.labelRaw)));
  const xs = parsed.map((row) => row.xRaw);
  const ys = parsed.map((row) => row.yRaw);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const labelMap: Record<string, number> = { [labels[0]]: 0, [labels[1]]: 1 };

  const data = parsed.slice(0, 2000).map((row) => ({
    x: normalize(row.xRaw, xMin, xMax),
    y: normalize(row.yRaw, yMin, yMax),
    label: labelMap[row.labelRaw],
    raw: row.raw,
  }));

  return {
    data,
    info: {
      name: table.fileName,
      rows: data.length,
      invalidRows: validation.invalidRows,
      xColumn,
      yColumn,
      labelColumn,
      labelMap,
      xRange: [xMin, xMax],
      yRange: [yMin, yMax],
    },
  };
}
