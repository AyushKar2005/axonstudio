import type { CustomDatasetInfo, DataPoint, DataSplit } from "@/lib/tf/types";

export interface CsvTable {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
  delimiter: string;
  rawRowCount: number;
}

export interface CsvInvalidSample {
  rowNumber: number;
  reason: string;
}

export interface CsvValidation {
  validRows: number;
  invalidRows: number;
  error: string | null;
  labelValues: string[];
  numericColumns: string[];
  invalidSamples: CsvInvalidSample[];
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

const CANDIDATE_DELIMITERS = [",", ";", "\t", "|"] as const;
const MAX_ROWS = 2000;

function countDelimiterOutsideQuotes(line: string, delimiter: string) {
  let quoted = false;
  let count = 0;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && quoted && next === '"') {
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      count++;
    }
  }

  return count;
}

function detectDelimiter(lines: string[]) {
  const sample = lines.slice(0, Math.min(lines.length, 20));
  let best = ",";
  let bestScore = -1;

  for (const delimiter of CANDIDATE_DELIMITERS) {
    const counts = sample.map((line) => countDelimiterOutsideQuotes(line, delimiter));
    const positive = counts.filter((n) => n > 0);
    if (!positive.length) continue;

    const avg = positive.reduce((a, b) => a + b, 0) / positive.length;
    const consistency = positive.filter((n) => n === positive[0]).length / positive.length;
    const score = avg * 2 + consistency;

    if (score > bestScore) {
      bestScore = score;
      best = delimiter;
    }
  }

  return best;
}

const splitCsvLine = (line: string, delimiter: string) => {
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
    } else if (ch === delimiter && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }

  out.push(cur.trim());
  return out.map((v) => v.replace(/^"|"$/g, "").trim());
};

function uniqueHeaders(rawHeaders: string[]) {
  const used = new Map<string, number>();

  return rawHeaders.map((raw, i) => {
    const base = raw.replace(/^\uFEFF/, "").trim() || `column_${i + 1}`;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

function parseNumber(value: unknown): number | null {
  let s = String(value ?? "").trim();
  if (!s) return null;

  s = s.replace(/^"|"$/g, "").trim();
  s = s.replace(/[$₹€£]/g, "");
  s = s.replace(/%$/g, "");
  s = s.replace(/\s+/g, "");

  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, "");
  } else if (/^-?\d+,\d+$/.test(s) && !s.includes(".")) {
    s = s.replace(",", ".");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function cleanLabel(value: unknown) {
  return String(value ?? "").replace(/^"|"$/g, "").trim();
}

function niceDelimiter(delimiter: string) {
  return delimiter === "\t" ? "tab" : delimiter;
}

export function parseCsvText(text: string, fileName = "custom.csv"): CsvTable {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) throw new Error("CSV file is empty.");

  const lines = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV needs a header row and at least one data row.");

  const delimiter = detectDelimiter(lines);
  const headers = uniqueHeaders(splitCsvLine(lines[0], delimiter));

  if (headers.length < 3) {
    throw new Error("CSV needs at least 3 columns: two numeric feature columns and one label column.");
  }

  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });

  return { fileName, headers, rows, delimiter: niceDelimiter(delimiter), rawRowCount: rows.length };
}

export async function readCsvFile(file: File): Promise<CsvTable> {
  const text = await file.text();
  return parseCsvText(text, file.name);
}

export function numericColumns(table: CsvTable): string[] {
  return table.headers.filter((header) => {
    const sample = table.rows.slice(0, 150);
    const nonEmpty = sample.filter((row) => String(row[header] ?? "").trim().length > 0);
    if (!nonEmpty.length) return false;

    const numeric = nonEmpty.filter((row) => parseNumber(row[header]) !== null);
    const required = Math.min(5, nonEmpty.length);
    return numeric.length >= required && numeric.length / nonEmpty.length >= 0.8;
  });
}

function binaryLabelColumns(table: CsvTable, exclude: string[] = []) {
  return table.headers.filter((header) => {
    if (exclude.includes(header)) return false;
    const labels = new Set<string>();

    for (const row of table.rows.slice(0, 300)) {
      const label = cleanLabel(row[header]);
      if (label) labels.add(label);
      if (labels.size > 2) return false;
    }

    return labels.size === 2;
  });
}

export function inferColumns(table: CsvTable) {
  const nums = numericColumns(table);
  const lowered = table.headers.map((h) => h.toLowerCase().replace(/[\s_\-]/g, ""));
  const find = (names: string[], fallback: string | undefined, mustBeNumeric = false) => {
    const idx = lowered.findIndex((h, i) => {
      if (mustBeNumeric && !nums.includes(table.headers[i])) return false;
      return names.some((n) => h === n || h.includes(n));
    });
    return idx >= 0 ? table.headers[idx] : fallback;
  };

  const xColumn = find(["x", "x1", "feature1", "feature01", "axisx", "longitude", "lng"], nums[0], true) ?? nums[0] ?? table.headers[0];
  const yColumn = find(["y", "x2", "feature2", "feature02", "axisy", "latitude", "lat"], nums.find((n) => n !== xColumn) ?? nums[1], true) ?? nums.find((n) => n !== xColumn) ?? table.headers[1];

  const binaryCandidates = binaryLabelColumns(table, [xColumn, yColumn]);
  const labelColumn = find(["label", "class", "target", "ytrue", "category", "output", "result"], binaryCandidates[0] ?? table.headers.find((h) => h !== xColumn && h !== yColumn)) ?? binaryCandidates[0] ?? table.headers[2];

  return { xColumn, yColumn, labelColumn };
}

function collectInvalidSample(samples: CsvInvalidSample[], rowNumber: number, reason: string) {
  if (samples.length < 5) samples.push({ rowNumber, reason });
}

export function validateCsvMapping(table: CsvTable | null, xColumn: string, yColumn: string, labelColumn: string): CsvValidation {
  if (!table) return { validRows: 0, invalidRows: 0, error: "Upload a CSV file first.", labelValues: [], numericColumns: [], invalidSamples: [] };

  const nums = numericColumns(table);
  if (!xColumn || !yColumn || !labelColumn) return { validRows: 0, invalidRows: table.rows.length, error: "Choose x, y and label columns.", labelValues: [], numericColumns: nums, invalidSamples: [] };
  if (xColumn === yColumn) return { validRows: 0, invalidRows: table.rows.length, error: "X and Y columns must be different.", labelValues: [], numericColumns: nums, invalidSamples: [] };
  if (labelColumn === xColumn || labelColumn === yColumn) return { validRows: 0, invalidRows: table.rows.length, error: "Label column must be separate from x/y.", labelValues: [], numericColumns: nums, invalidSamples: [] };

  let validRows = 0;
  const labels = new Set<string>();
  const invalidSamples: CsvInvalidSample[] = [];

  table.rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const x = parseNumber(row[xColumn]);
    const y = parseNumber(row[yColumn]);
    const label = cleanLabel(row[labelColumn]);

    if (x === null) {
      collectInvalidSample(invalidSamples, rowNumber, `Invalid X value: ${row[xColumn] || "empty"}`);
      return;
    }
    if (y === null) {
      collectInvalidSample(invalidSamples, rowNumber, `Invalid Y value: ${row[yColumn] || "empty"}`);
      return;
    }
    if (!label) {
      collectInvalidSample(invalidSamples, rowNumber, "Missing label");
      return;
    }

    validRows++;
    labels.add(label);
  });

  const labelValues = Array.from(labels);
  const invalidRows = table.rows.length - validRows;
  let error: string | null = null;

  if (!nums.includes(xColumn)) error = "Selected X column must be mostly numeric.";
  else if (!nums.includes(yColumn)) error = "Selected Y column must be mostly numeric.";
  else if (validRows < 12) error = "Need at least 12 valid numeric rows.";
  else if (labelValues.length !== 2) error = `CSV v1 supports exactly 2 label classes. Found ${labelValues.length}.`;

  return { validRows, invalidRows, error, labelValues, numericColumns: nums, invalidSamples };
}

const normalize = (value: number, min: number, max: number) => {
  if (Math.abs(max - min) < 1e-12) return 0;
  return ((value - min) / (max - min)) * 2 - 1;
};

function orderedLabels(labels: string[]) {
  const normalized = labels.map((label) => label.toLowerCase());
  const pairs: [string, string][] = [["0", "1"], ["false", "true"], ["no", "yes"], ["negative", "positive"], ["neg", "pos"]];

  for (const [a, b] of pairs) {
    const ia = normalized.indexOf(a);
    const ib = normalized.indexOf(b);
    if (ia >= 0 && ib >= 0) return [labels[ia], labels[ib]];
  }

  return labels;
}

export function buildDatasetFromCsv(table: CsvTable, xColumn: string, yColumn: string, labelColumn: string): CsvBuildResult {
  const validation = validateCsvMapping(table, xColumn, yColumn, labelColumn);
  if (validation.error) throw new Error(validation.error);

  const parsed = table.rows
    .map((row, i) => ({
      rowNumber: i + 2,
      xRaw: parseNumber(row[xColumn]),
      yRaw: parseNumber(row[yColumn]),
      labelRaw: cleanLabel(row[labelColumn]),
      raw: row,
    }))
    .filter((row) => row.xRaw !== null && row.yRaw !== null && row.labelRaw.length > 0) as Array<{
      rowNumber: number;
      xRaw: number;
      yRaw: number;
      labelRaw: string;
      raw: Record<string, string>;
    }>;

  const labels = orderedLabels(Array.from(new Set(parsed.map((row) => row.labelRaw))));
  const xs = parsed.map((row) => row.xRaw);
  const ys = parsed.map((row) => row.yRaw);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const labelMap: Record<string, number> = { [labels[0]]: 0, [labels[1]]: 1 };

  const data = parsed.slice(0, MAX_ROWS).map((row, i) => ({
    x: normalize(row.xRaw, xMin, xMax),
    y: normalize(row.yRaw, yMin, yMax),
    label: labelMap[row.labelRaw],
    raw: row.raw,
    split: (i % 5 === 0 ? "test" : "train") as DataSplit,
  }));

  return {
    data,
    info: {
      name: table.fileName,
      rows: data.length,
      totalRows: table.rawRowCount,
      invalidRows: validation.invalidRows,
      delimiter: table.delimiter,
      numericColumns: validation.numericColumns,
      labelValues: labels,
      invalidSamples: validation.invalidSamples,
      xColumn,
      yColumn,
      labelColumn,
      labelMap,
      xRange: [xMin, xMax],
      yRange: [yMin, yMax],
    },
  };
}
