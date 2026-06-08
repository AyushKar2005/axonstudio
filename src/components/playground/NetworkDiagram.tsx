"use client";

import type { LayerConfig } from "@/lib/tf/types";
import { cardStyle, eyebrowStyle, monoValueStyle, mutedLineStyle } from "@/components/playground/ui";

export function NetworkDiagram({ layers }: { layers: LayerConfig[] }) {
  const width = 720;
  const height = 88;
  const maxVisible = 5;
  const xFor = (i: number) => 44 + (i * (width - 88)) / Math.max(1, layers.length - 1);
  const yFor = (j: number, count: number) => {
    const visible = Math.min(count, maxVisible);
    if (visible === 1) return height / 2 + 7;
    return 28 + (j * (height - 48)) / (visible - 1);
  };
  return (
    <section style={{ ...cardStyle, padding: "12px 16px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div><p style={eyebrowStyle}>Model architecture</p><p style={mutedLineStyle}>compact process view · input to binary output</p></div>
        <p style={{ ...monoValueStyle, color: "#767682" }}>{layers.map((l) => l.neurons).join(" → ")}</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height, display: "block", marginTop: 4 }}>
        {layers.slice(0, -1).map((layer, i) => {
          const next = layers[i + 1];
          const fromCount = Math.min(layer.neurons, maxVisible);
          const toCount = Math.min(next.neurons, maxVisible);
          return Array.from({ length: fromCount }).flatMap((_, a) => Array.from({ length: toCount }).map((_, b) => {
            const keep = a === b || (a + b + i) % 4 === 0;
            if (!keep) return null;
            return <line key={`${i}-${a}-${b}`} x1={xFor(i) + 6} y1={yFor(a, layer.neurons)} x2={xFor(i + 1) - 6} y2={yFor(b, next.neurons)} stroke="rgba(228,228,231,0.055)" strokeWidth="1" />;
          }));
        })}
        {layers.map((layer, i) => {
          const visible = Math.min(layer.neurons, maxVisible);
          const hidden = Math.max(0, layer.neurons - visible);
          const isInput = i === 0;
          const isOutput = i === layers.length - 1;
          const stroke = isInput ? "#71717a" : isOutput ? "#c84686" : "#8b5cf6";
          const label = isInput ? "input" : isOutput ? "output" : layer.activation;
          return <g key={layer.id}><text x={xFor(i)} y="13" textAnchor="middle" fill="#565662" fontSize="9" fontFamily="JetBrains Mono, monospace">{label}</text>{Array.from({ length: visible }).map((_, j) => <circle key={j} cx={xFor(i)} cy={yFor(j, layer.neurons)} r="5.4" fill="#0f0f11" stroke={stroke} strokeOpacity={isInput ? 0.42 : 0.58} strokeWidth="1.05" />)}{hidden > 0 && <text x={xFor(i)} y={height - 2} textAnchor="middle" fill="#52525b" fontSize="9" fontFamily="JetBrains Mono, monospace">+{hidden}</text>}</g>;
        })}
      </svg>
    </section>
  );
}
