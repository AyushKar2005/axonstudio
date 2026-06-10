import type { CSSProperties } from "react";

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const pct = (value: number) => `${Math.round(value * 1000) / 10}%`;

export const panelBg = "#0b0b0e";
export const border = "#1e1e26";

export const eyebrowStyle: CSSProperties = {
  fontSize: 9,
  color: "#3e3e4e",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 700,
};

export const mutedLineStyle: CSSProperties = {
  fontSize: 11,
  color: "#3a3a48",
  marginTop: 4,
  lineHeight: 1.5,
};

export const monoValueStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.04em",
};

export const metricLabelStyle: CSSProperties = {
  fontSize: 9,
  color: "#3a3a48",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

export const rightPanelTitleStyle: CSSProperties = {
  fontSize: 9,
  color: "#3e3e4e",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 700,
};

export const rightPanelValueStyle: CSSProperties = {
  fontSize: 10,
  color: "#ec4899",
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.04em",
};

export const cardStyle: CSSProperties = {
  border: "1px solid #1e1e26",
  background: "linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.009))",
  borderRadius: 12,
  boxShadow: "0 1px 0 rgba(255,255,255,0.028) inset, 0 8px 24px rgba(0,0,0,0.18)",
};

// Primary action button (run, save run, active state)
export const buttonStyle = (active = false): CSSProperties => ({
  height: 34,
  minWidth: 72,
  padding: "0 13px",
  borderRadius: 8,
  border: active
    ? "1px solid rgba(167,139,250,0.38)"
    : "1px solid rgba(255,255,255,0.07)",
  background: active
    ? "rgba(124,58,237,0.14)"
    : "rgba(255,255,255,0.028)",
  color: active ? "#c4b5fd" : "#5a5a68",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 11,
  fontWeight: 650,
  fontFamily: "'Syne', sans-serif",
  letterSpacing: "0.01em",
  transition: "background 0.15s, border-color 0.15s, color 0.15s, transform 0.1s",
});

// View mode / small toggle buttons
export const smallButtonStyle = (active = false): CSSProperties => ({
  border: active
    ? "1px solid rgba(167,139,250,0.38)"
    : "1px solid rgba(255,255,255,0.06)",
  background: active
    ? "rgba(124,58,237,0.14)"
    : "rgba(255,255,255,0.022)",
  color: active ? "#c4b5fd" : "#4a4a58",
  borderRadius: 7,
  padding: "6px 11px",
  cursor: "pointer",
  fontSize: 10,
  fontWeight: 650,
  fontFamily: "'Syne', sans-serif",
  letterSpacing: "0.03em",
  transition: "background 0.15s, border-color 0.15s, color 0.15s",
});
