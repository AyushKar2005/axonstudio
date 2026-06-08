"use client";

import type { ExplainCard } from "@/lib/tf/explain";

export function ExplainPanel({ cards }: { cards: ExplainCard[] }) {
  return <div><p style={title}>Explain mode</p><div style={{ display: "grid", gap: 8, marginTop: 10 }}>{cards.map((card) => <div key={card.title} style={{ border: "1px solid #1e1e22", borderRadius: 10, background: "rgba(255,255,255,0.018)", padding: 12 }}><div style={{ display: "flex", gap: 8, alignItems: "center", color: "#e4e4e7", fontSize: 12, fontWeight: 700 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: card.tone === "good" ? "#34d399" : card.tone === "warn" ? "#fb923c" : "#8b5cf6" }} />{card.title}</div><p style={{ color: "#71717a", fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{card.detail}</p></div>)}</div></div>;
}
const title = { fontSize: 9, color: "#333", letterSpacing: "0.14em", textTransform: "uppercase" as const };
