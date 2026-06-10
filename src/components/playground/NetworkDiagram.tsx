"use client";

import type { LayerConfig } from "@/lib/tf/types";
import { cardStyle, eyebrowStyle, monoValueStyle, mutedLineStyle } from "@/components/playground/ui";

export function NetworkDiagram({ layers }: { layers: LayerConfig[] }) {
  const width = 720;
  const height = 92;
  const maxVisible = 5;
  const xFor = (i: number) => 44 + (i * (width - 88)) / Math.max(1, layers.length - 1);
  const yFor = (j: number, count: number) => {
    const visible = Math.min(count, maxVisible);
    if (visible === 1) return height / 2 + 6;
    return 26 + (j * (height - 44)) / (visible - 1);
  };

  return (
    <section style={{ ...cardStyle, padding: "12px 16px 10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <p style={eyebrowStyle}>Model architecture</p>
          <p style={mutedLineStyle}>compact process view · input to binary output</p>
        </div>
        <p style={{ ...monoValueStyle, color: "#4a4a58", fontSize: 11, flexShrink: 0 }}>
          {layers.map((l) => l.neurons).join(" → ")}
        </p>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height, display: "block", marginTop: 6 }}>
        {/* Connections */}
        {layers.slice(0, -1).map((layer, i) => {
          const next = layers[i + 1];
          const fromCount = Math.min(layer.neurons, maxVisible);
          const toCount = Math.min(next.neurons, maxVisible);
          return Array.from({ length: fromCount }).flatMap((_, a) =>
            Array.from({ length: toCount }).map((_, b) => {
              const keep = a === b || (a + b + i) % 4 === 0;
              if (!keep) return null;
              return (
                <line
                  key={`${i}-${a}-${b}`}
                  x1={xFor(i) + 6} y1={yFor(a, layer.neurons)}
                  x2={xFor(i + 1) - 6} y2={yFor(b, next.neurons)}
                  stroke="rgba(255,255,255,0.042)"
                  strokeWidth="0.9"
                />
              );
            })
          );
        })}

        {/* Nodes */}
        {layers.map((layer, i) => {
          const visible = Math.min(layer.neurons, maxVisible);
          const hidden = Math.max(0, layer.neurons - visible);
          const isInput = i === 0;
          const isOutput = i === layers.length - 1;
          const stroke = isInput ? "#52525b" : isOutput ? "#ec4899" : "#7c3aed";
          const strokeOpacity = isInput ? 0.5 : isOutput ? 0.7 : 0.65;
          const fill = isInput ? "rgba(82,82,91,0.08)" : isOutput ? "rgba(236,72,153,0.08)" : "rgba(124,58,237,0.08)";
          const label = isInput ? "input" : isOutput ? "output" : layer.activation;

          return (
            <g key={layer.id}>
              <text
                x={xFor(i)} y="13"
                textAnchor="middle"
                fill="#2e2e3a"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="0.08em"
              >
                {label}
              </text>
              {Array.from({ length: visible }).map((_, j) => (
                <circle
                  key={j}
                  cx={xFor(i)} cy={yFor(j, layer.neurons)}
                  r="5.8"
                  fill={fill}
                  stroke={stroke}
                  strokeOpacity={strokeOpacity}
                  strokeWidth="1.1"
                />
              ))}
              {hidden > 0 && (
                <text
                  x={xFor(i)} y={height - 1}
                  textAnchor="middle"
                  fill="#2e2e3a"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  +{hidden}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </section>
  );
}
