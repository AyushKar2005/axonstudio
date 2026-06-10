"use client";

import type { ExplainCard } from "@/lib/tf/explain";

const toneColors: Record<string, { dot: string; border: string; bg: string }> = {
  good: { dot: "#34d399", border: "rgba(52,211,153,0.16)", bg: "rgba(52,211,153,0.04)" },
  warn: { dot: "#fb923c", border: "rgba(251,146,60,0.16)", bg: "rgba(251,146,60,0.04)" },
  info: { dot: "#a78bfa", border: "rgba(167,139,250,0.16)", bg: "rgba(167,139,250,0.04)" },
};

export function ExplainPanel({ cards }: { cards: ExplainCard[] }) {
  return (
    <div>
      <p style={title}>Explain mode</p>
      <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
        {cards.map((card) => {
          const tone = toneColors[card.tone] ?? toneColors.info;
          return (
            <div
              key={card.title}
              style={{
                border: `1px solid ${tone.border}`,
                borderRadius: 9,
                background: tone.bg,
                padding: "10px 12px",
              }}
            >
              <div style={{
                display: "flex",
                gap: 7,
                alignItems: "center",
                color: "#d4d4d8",
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 5,
              }}>
                <span style={{
                  width: 6, height: 6,
                  borderRadius: 99,
                  background: tone.dot,
                  flexShrink: 0,
                  boxShadow: `0 0 5px ${tone.dot}80`,
                }} />
                {card.title}
              </div>
              <p style={{ color: "#4a4a58", fontSize: 11, lineHeight: 1.58 }}>
                {card.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const title = {
  fontSize: 9,
  color: "#3e3e4e",
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
};
