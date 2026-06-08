import type { CSSProperties } from "react";

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const pct = (value: number) => `${Math.round(value * 1000) / 10}%`;

export const panelBg = "#0d0d0f";
export const border = "#1a1a1e";

export const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  color: "#73737f",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  fontWeight: 650,
};

export const mutedLineStyle: CSSProperties = { fontSize: 11, color: "#52525b", marginTop: 5 };
export const monoValueStyle: CSSProperties = { fontSize: 10, fontFamily: "'JetBrains Mono', monospace" };
export const metricLabelStyle: CSSProperties = { fontSize: 9, color: "#52525b", letterSpacing: "0.15em", textTransform: "uppercase" };
export const rightPanelTitleStyle: CSSProperties = { fontSize: 9, color: "#333", letterSpacing: "0.14em", textTransform: "uppercase" };
export const rightPanelValueStyle: CSSProperties = { fontSize: 10, color: "#ec4899", fontFamily: "'JetBrains Mono', monospace" };

export const cardStyle: CSSProperties = {
  border: "1px solid #1a1a1e",
  background: "linear-gradient(180deg, rgba(255,255,255,0.024), rgba(255,255,255,0.011))",
  borderRadius: 14,
  boxShadow: "0 1px 0 rgba(255,255,255,0.032) inset",
};

export const buttonStyle = (active = false): CSSProperties => ({
  height: 36,
  minWidth: 74,
  padding: "0 12px",
  borderRadius: 9,
  border: active ? "1px solid rgba(139,92,246,0.45)" : "1px solid #24242a",
  background: active ? "rgba(139,92,246,0.12)" : "#121214",
  color: active ? "#c4b5fd" : "#a1a1aa",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 11,
  fontWeight: 650,
});

export const smallButtonStyle = (active = false): CSSProperties => ({
  border: active ? "1px solid rgba(192,132,252,0.45)" : "1px solid #24242a",
  background: active ? "rgba(192,132,252,0.1)" : "rgba(255,255,255,0.02)",
  color: active ? "#d8b4fe" : "#777",
  borderRadius: 7,
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: 10,
  fontWeight: 650,
});
