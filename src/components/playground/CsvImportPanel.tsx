"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { buildDatasetFromCsv, inferColumns, readCsvFile, SAMPLE_2D_CSV, validateCsvMapping } from "@/lib/tf/csv";
import type { CsvTable } from "@/lib/tf/csv";
import type { CustomDatasetInfo, DataPoint } from "@/lib/tf/types";
import { downloadTextFile } from "@/lib/tf/export";

export function CsvImportPanel({ onReady }: { onReady: (data: DataPoint[], info: CustomDatasetInfo) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [table, setTable] = useState<CsvTable | null>(null);
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [labelColumn, setLabelColumn] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);

  const validation = useMemo(() => validateCsvMapping(table, xColumn, yColumn, labelColumn), [table, xColumn, yColumn, labelColumn]);
  const preview = table?.rows.slice(0, 5) ?? [];
  const ready = !!table && !validation.error;

  const loadFile = async (file: File) => {
    setLoading(true);
    setActive(false);
    try {
      const parsed = await readCsvFile(file);
      const inferred = inferColumns(parsed);
      setTable(parsed);
      setXColumn(inferred.xColumn ?? "");
      setYColumn(inferred.yColumn ?? "");
      setLabelColumn(inferred.labelColumn ?? "");
      setMessage(`Loaded ${parsed.rows.length} rows from ${file.name}. Columns were auto-detected.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not read CSV.");
      setTable(null);
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!table) return;
    try {
      const built = buildDatasetFromCsv(table, xColumn, yColumn, labelColumn);
      onReady(built.data, built.info);
      setActive(true);
      setMessage(`Custom dataset active · ${built.info.rows} valid rows · ${built.info.invalidRows} skipped.`);
    } catch (err) {
      setActive(false);
      setMessage(err instanceof Error ? err.message : "Could not build dataset.");
    }
  };

  const select = (value: string, setter: (v: string) => void) => (
    <select value={value} onChange={(e) => { setter(e.target.value); setActive(false); }} style={selectStyle}>
      <option value="">Choose column</option>
      {table?.headers.map((h) => <option key={h} value={h}>{h}</option>)}
    </select>
  );

  return (
    <div style={{ border: "1px solid #1e1e22", background: "rgba(255,255,255,0.018)", borderRadius: 10, padding: 10 }}>
      <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) loadFile(file); }}
        style={{
          border: dragging ? "1px solid rgba(196,181,253,0.85)" : "1px dashed rgba(196,181,253,0.35)",
          borderRadius: 9,
          padding: "16px 10px",
          textAlign: "center",
          color: "#d8b4fe",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 750,
          background: dragging ? "rgba(124,58,237,0.12)" : "rgba(10,10,12,0.22)",
        }}
      >
        {loading ? "Reading CSV…" : "Drag CSV here or click to upload"}
        <div style={{ color: "#54545f", fontSize: 9, marginTop: 7, fontWeight: 500 }}>
          2 numeric columns + 1 binary label column
        </div>
      </div>

      <button onClick={() => downloadTextFile(SAMPLE_2D_CSV, "axon_sample_2d_binary.csv", "text/csv")} style={ghostButtonStyle}>Download sample CSV</button>

      {table && (
        <div style={{ marginTop: 10, display: "grid", gap: 9 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <StatusPill label="File" value={table.fileName} />
            <StatusPill label="Rows" value={String(table.rows.length)} />
            <StatusPill label="Valid" value={String(validation.validRows)} good={!validation.error} />
            <StatusPill label="Skipped" value={String(validation.invalidRows)} warn={validation.invalidRows > 0} />
          </div>

          <label style={labelStyle}>X column{select(xColumn, setXColumn)}</label>
          <label style={labelStyle}>Y column{select(yColumn, setYColumn)}</label>
          <label style={labelStyle}>Label column{select(labelColumn, setLabelColumn)}</label>

          <div style={{ fontSize: 10, color: validation.error ? "#fb923c" : active ? "#6ee7b7" : "#c4b5fd", lineHeight: 1.6 }}>
            {validation.error ?? (active ? "CSV dataset is active in the playground." : `${validation.validRows} valid rows · ${validation.invalidRows} invalid skipped · labels: ${validation.labelValues.join(" / ")}`)}
          </div>

          <div style={{ overflow: "auto", border: "1px solid #1e1e22", borderRadius: 8, maxHeight: 132 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, color: "#71717a" }}>
              <thead><tr>{table.headers.slice(0, 5).map((h) => <th key={h} style={cellStyle}>{h}</th>)}</tr></thead>
              <tbody>{preview.map((row, i) => <tr key={i}>{table.headers.slice(0, 5).map((h) => <td key={h} style={cellStyle}>{row[h]}</td>)}</tr>)}</tbody>
            </table>
          </div>

          <button onClick={apply} disabled={!ready} style={{ border: "1px solid rgba(192,132,252,0.42)", background: ready ? "rgba(192,132,252,0.11)" : "#111", color: ready ? "#d8b4fe" : "#555", borderRadius: 8, padding: "9px", cursor: ready ? "pointer" : "not-allowed", fontSize: 10, fontWeight: 800 }}>
            Train on imported data
          </button>
        </div>
      )}
      {message && <p style={{ marginTop: 8, fontSize: 9, color: active ? "#6ee7b7" : "#52525b", lineHeight: 1.5 }}>{message}</p>}
    </div>
  );
}

function StatusPill({ label, value, good, warn }: { label: string; value: string; good?: boolean; warn?: boolean }) {
  return (
    <div style={{ border: "1px solid #1f1f25", borderRadius: 8, padding: "7px 8px", background: "rgba(255,255,255,0.012)", minWidth: 0 }}>
      <div style={{ color: "#44444c", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: good ? "#6ee7b7" : warn ? "#fb923c" : "#9ca3af", fontSize: 10, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}

const selectStyle: CSSProperties = { width: "100%", background: "#101014", color: "#a1a1aa", border: "1px solid #24242a", borderRadius: 7, padding: "7px", fontSize: 10, marginTop: 4 };
const ghostButtonStyle: CSSProperties = { marginTop: 8, width: "100%", border: "1px solid #24242a", background: "#121214", color: "#a1a1aa", borderRadius: 8, padding: "8px", cursor: "pointer", fontSize: 10 };
const labelStyle: CSSProperties = { display: "grid", gap: 4, fontSize: 9, color: "#52525b", letterSpacing: "0.08em", textTransform: "uppercase" };
const cellStyle: CSSProperties = { padding: "5px", borderBottom: "1px solid #1a1a1e", whiteSpace: "nowrap" };
