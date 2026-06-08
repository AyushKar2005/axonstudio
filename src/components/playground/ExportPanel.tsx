"use client";

import { buttonStyle, rightPanelTitleStyle } from "@/components/playground/ui";

export function ExportPanel({ onExportJson, onExportScreenshot, onCopySummary }: { onExportJson: () => void; onExportScreenshot: () => void; onCopySummary: () => void }) {
  return <div><p style={{ ...rightPanelTitleStyle, marginBottom: 10 }}>Export</p><div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 7 }}><button onClick={onExportJson} style={buttonStyle(false)}>Export run as JSON</button><button onClick={onExportScreenshot} style={buttonStyle(false)}>Export boundary PNG</button><button onClick={onCopySummary} style={buttonStyle(false)}>Copy experiment summary</button></div></div>;
}
