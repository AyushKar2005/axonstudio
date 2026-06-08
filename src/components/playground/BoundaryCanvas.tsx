"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { DataPoint, PointPrediction, TrainingMetrics, ViewMode } from "@/lib/tf/types";

export function BoundaryCanvas({ grid, data, predictions, selectedPointIndex, viewMode, metrics, resolution = 60, onSelectPoint }: {
  grid: number[];
  data: DataPoint[];
  predictions: PointPrediction[];
  selectedPointIndex: number | null;
  viewMode: ViewMode;
  metrics: TrainingMetrics | null;
  resolution?: number;
  onSelectPoint: (index: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(300, Math.floor(rect.width));
    const H = Math.max(300, Math.floor(rect.height));
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(0, 0, W, H);

    const hasGrid = grid.length === resolution * resolution;
    if (hasGrid) {
      const field = document.createElement("canvas");
      field.width = resolution;
      field.height = resolution;
      const fctx = field.getContext("2d");
      if (fctx) {
        const img = fctx.createImageData(resolution, resolution);
        const gradientBoost = viewMode === "gradients" ? Math.min(1, Math.max(...(metrics?.layerUpdateNorms ?? [0])) * 35) : 0;
        for (let row = 0; row < resolution; row++) {
          for (let col = 0; col < resolution; col++) {
            const val = grid[row * resolution + col];
            const confidence = Math.abs(val - 0.5) * 2;
            const idx = (row * resolution + col) * 4;
            const classOne = val >= 0.5;
            img.data[idx] = classOne ? 150 + gradientBoost * 30 : 80;
            img.data[idx + 1] = classOne ? 46 : 62 + gradientBoost * 30;
            img.data[idx + 2] = classOne ? 102 : 138;
            img.data[idx + 3] = Math.round(18 + confidence * 42 + gradientBoost * 18);
          }
        }
        fctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(field, 0, 0, W, H);
      }
      drawContour(ctx, grid, resolution, W, H);
    }

    drawGrid(ctx, W, H);
    const toX = (v: number) => ((v + 1) / 2) * W;
    const toY = (v: number) => (1 - (v + 1) / 2) * H;
    const predMap = new Map(predictions.map((p) => [p.index, p]));

    data.forEach((p, index) => {
      const pred = predMap.get(index);
      const cx = toX(p.x);
      const cy = toY(p.y);
      const wrong = pred && !pred.correct;
      const isTest = pred?.split === "test";
      if (viewMode === "errors" && !wrong) ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(cx, cy, isTest ? 3.8 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 0 ? "#8b5cf6" : "#d9468f";
      ctx.fill();
      ctx.strokeStyle = isTest ? "rgba(255,255,255,0.84)" : "rgba(255,255,255,0.52)";
      ctx.lineWidth = isTest ? 1.15 : 0.85;
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (wrong && viewMode === "errors") {
        ctx.beginPath();
        ctx.arc(cx, cy, 8.5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(251,146,60,0.95)";
        ctx.lineWidth = 1.7;
        ctx.stroke();
      }
      if (selectedPointIndex === index) {
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(244,244,245,0.92)";
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    });

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
  }, [grid, data, predictions, selectedPointIndex, viewMode, metrics, resolution]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const click = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let best = -1;
    let bestD = Infinity;
    data.forEach((p, i) => {
      const cx = ((p.x + 1) / 2) * W;
      const cy = (1 - (p.y + 1) / 2) * H;
      const d = Math.hypot(cx - mx, cy - my);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0 && bestD <= 18) onSelectPoint(best);
  };

  return <canvas id="axon-boundary-canvas" ref={canvasRef} onClick={click} style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }} />;
}

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.026)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    const p = (i / 8) * W;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.055)";
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
}

function drawContour(ctx: CanvasRenderingContext2D, grid: number[], resolution: number, W: number, H: number) {
  const cellW = W / resolution;
  const cellH = H / resolution;
  ctx.strokeStyle = "rgba(244,244,245,0.42)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let row = 0; row < resolution - 1; row++) {
    for (let col = 0; col < resolution - 1; col++) {
      const tl = grid[row * resolution + col], tr = grid[row * resolution + col + 1], bl = grid[(row + 1) * resolution + col], br = grid[(row + 1) * resolution + col + 1];
      const x = col * cellW, y = row * cellH, pts: { x: number; y: number }[] = [];
      const cross = (a: number, b: number) => (a - 0.5) * (b - 0.5) < 0;
      const mix = (a: number, b: number) => Math.max(0, Math.min(1, (0.5 - a) / (b - a)));
      if (cross(tl, tr)) pts.push({ x: x + mix(tl, tr) * cellW, y });
      if (cross(tr, br)) pts.push({ x: x + cellW, y: y + mix(tr, br) * cellH });
      if (cross(bl, br)) pts.push({ x: x + mix(bl, br) * cellW, y: y + cellH });
      if (cross(tl, bl)) pts.push({ x, y: y + mix(tl, bl) * cellH });
      if (pts.length === 2) { ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); }
      else if (pts.length === 4) { ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.moveTo(pts[2].x, pts[2].y); ctx.lineTo(pts[3].x, pts[3].y); }
    }
  }
  ctx.stroke();
}
