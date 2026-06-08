"use client";

import { useEffect, useRef } from "react";

export function LossChart({ lossHistory }: { lossHistory: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || lossHistory.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...lossHistory, 1);
    const min = Math.min(...lossHistory, 0);
    const range = max - min || 1;
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i <= 4; i++) { const y = (i / 4) * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, "#7c3aed"); grad.addColorStop(1, "#ec4899");
    ctx.beginPath(); ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.lineJoin = "round";
    lossHistory.forEach((l, i) => { const x = (i / (lossHistory.length - 1)) * W; const y = H - ((l - min) / range) * H * 0.85 - H * 0.07; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke(); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    const area = ctx.createLinearGradient(0, 0, 0, H); area.addColorStop(0, "rgba(124,58,237,0.12)"); area.addColorStop(1, "rgba(124,58,237,0)"); ctx.fillStyle = area; ctx.fill();
  }, [lossHistory]);
  return lossHistory.length < 2 ? <div style={{ height: 80, display: "grid", placeItems: "center", color: "#27272f", fontSize: 10 }}>starts on train</div> : <canvas ref={ref} width={240} height={80} style={{ width: "100%", height: 80, display: "block" }} />;
}
