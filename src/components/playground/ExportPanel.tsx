"use client";

import { rightPanelTitleStyle } from "@/components/playground/ui";

const exportButtons: {
  label: string;
  icon: string;
  action: "json" | "png" | "copy" | "share";
}[] = [
  { label: "Export run as JSON", icon: "↓", action: "json" },
  { label: "Export boundary PNG", icon: "↓", action: "png" },
  { label: "Copy experiment summary", icon: "⎘", action: "copy" },
  { label: "Share experiment link", icon: "↗", action: "share" },
];

export function ExportPanel({
  onExportJson,
  onExportScreenshot,
  onCopySummary,
  onShareRun,
  shareStatus,
}: {
  onExportJson: () => void;
  onExportScreenshot: () => void;
  onCopySummary: () => void;
  onShareRun: () => void;
  shareStatus?: string | null;
}) {
  const handlers = {
    json: onExportJson,
    png: onExportScreenshot,
    copy: onCopySummary,
    share: onShareRun,
  };

  return (
    <div>
      <p style={{ ...rightPanelTitleStyle, marginBottom: 9 }}>Export</p>
      <div style={{ display: "grid", gap: 5 }}>
        {exportButtons.map(({ label, icon, action }) => (
          <button
            key={label}
            onClick={handlers[action]}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.022)",
              color: "#4a4a58",
              fontSize: 11,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 9,
              transition:
                "background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(255,255,255,0.042)";
              el.style.borderColor = "rgba(255,255,255,0.10)";
              el.style.color = "#a1a1aa";
              el.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(255,255,255,0.022)";
              el.style.borderColor = "rgba(255,255,255,0.06)";
              el.style.color = "#4a4a58";
              el.style.transform = "translateX(0)";
            }}
          >
            <span style={{ fontSize: 13, opacity: 0.5, lineHeight: 1 }}>
              {icon}
            </span>
            {label}
          </button>
        ))}
      </div>

      {shareStatus && (
        <p
          style={{
            marginTop: 7,
            color: "#5f5f6b",
            fontSize: 10,
            lineHeight: 1.5,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {shareStatus}
        </p>
      )}
    </div>
  );
}
