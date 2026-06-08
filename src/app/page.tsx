"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import LandingNav from "@/components/site/LandingNav";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// ─── Neural canvas (unchanged) ───────────────────────────────────────────────
function NeuralField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    const fibers = Array.from({ length: 150 }, (_, i) => {
      const a = (i / 150) * Math.PI * 2 + Math.random() * 0.55;
      const len = 0.18 + Math.random() * 0.55;
      const bend = (Math.random() - 0.5) * 1.8;
      const speed = 0.002 + Math.random() * 0.006;
      const hue = Math.random();
      return { a, len, bend, speed, hue, phase: Math.random() * Math.PI * 2 };
    });

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.58;
      const cy = h * 0.52;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.42);
      core.addColorStop(0, "rgba(236,72,153,0.42)");
      core.addColorStop(0.18, "rgba(124,58,237,0.25)");
      core.addColorStop(0.42, "rgba(34,211,238,0.07)");
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      fibers.forEach((f, i) => {
        const pulse = Math.sin(frame * f.speed + f.phase) * 0.5 + 0.5;
        const startR = Math.min(w, h) * (0.04 + pulse * 0.018);
        const endR = Math.min(w, h) * (f.len + pulse * 0.08);
        const a = f.a + Math.sin(frame * 0.004 + f.phase) * 0.08;
        const sx = cx + Math.cos(a) * startR;
        const sy = cy + Math.sin(a) * startR;
        const ex = cx + Math.cos(a + f.bend * 0.18) * endR;
        const ey = cy + Math.sin(a + f.bend * 0.18) * endR;
        const mx = cx + Math.cos(a + f.bend * 0.45) * endR * 0.48;
        const my = cy + Math.sin(a + f.bend * 0.45) * endR * 0.48;
        const color = f.hue < 0.55 ? "236,72,153" : f.hue < 0.82 ? "124,58,237" : "245,158,11";

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(mx, my, ex, ey);
        ctx.strokeStyle = `rgba(${color},${0.09 + pulse * 0.32})`;
        ctx.lineWidth = 0.8 + pulse * 1.2;
        ctx.stroke();

        if (i % 8 === 0) {
          const t = (pulse + frame * 0.001) % 1;
          const px = sx + (ex - sx) * t;
          const py = sy + (ey - sy) * t;
          ctx.beginPath();
          ctx.arc(px, py, 1.5 + pulse * 1.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.16 + pulse * 0.35})`;
          ctx.fill();
        }
      });

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      glow.addColorStop(0, "rgba(255,214,238,0.95)");
      glow.addColorStop(0.25, "rgba(236,72,153,0.55)");
      glow.addColorStop(1, "rgba(236,72,153,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 100, cy - 100, 200, 200);

      frame++;
      raf = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", draw);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.92 }}
    />
  );
}

// ─── Feature card (unchanged) ────────────────────────────────────────────────
function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <article
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.014))",
        padding: 24,
        minHeight: 164,
      }}
    >
      <h3 style={{ color: "#f4f4f5", fontSize: 19, marginBottom: 12, letterSpacing: "-0.03em" }}>
        {title}
      </h3>
      <p style={{ color: "#8a8a94", lineHeight: 1.7, fontSize: 14 }}>{body}</p>
    </article>
  );
}

// ─── Decision-boundary mini canvas ───────────────────────────────────────────
function DecisionCanvas({ progress }: { progress: React.MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pts = Array.from({ length: 90 }, (_, i) => {
      const cls = i < 45 ? 0 : 1;
      const angle = Math.random() * Math.PI * 2;
      const r = cls === 0 ? 0.15 + Math.random() * 0.28 : 0.52 + Math.random() * 0.32;
      return { x: 0.5 + r * Math.cos(angle) * 0.85, y: 0.5 + r * Math.sin(angle) * 0.85, cls };
    });

    let raf = 0;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const p = Math.min(progress.current, 1);
      const cx = w / 2, cy = h / 2;
      const radius = Math.min(w, h) * 0.38 * p;

      // boundary fill
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.6);
      g1.addColorStop(0, "rgba(236,72,153,0.10)");
      g1.addColorStop(0.5, "rgba(124,58,237,0.05)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      // circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(124,58,237,0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // confidence ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.14, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(236,72,153,0.12)";
      ctx.lineWidth = 6;
      ctx.stroke();

      pts.forEach((pt) => {
        const px = pt.x * w, py = pt.y * h;
        const inside = Math.hypot(px - cx, py - cy) < radius;
        const correct = (pt.cls === 0 && inside) || (pt.cls === 1 && !inside);
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = pt.cls === 0
          ? (correct ? "rgba(124,58,237,0.9)" : "rgba(236,72,153,0.7)")
          : (correct ? "rgba(236,72,153,0.9)" : "rgba(124,58,237,0.7)");
        ctx.fill();
        if (!correct) {
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(245,158,11,0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <canvas
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 12,
        border: "1px solid rgba(124,58,237,0.18)",
        background: "rgba(124,58,237,0.03)",
      }}
    />
  );
}

// ─── Loss curve canvas ────────────────────────────────────────────────────────
function LossCanvas({ progress }: { progress: React.MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const p = Math.min(progress.current, 1);
      const pad = { l: 36, r: 16, t: 16, b: 32 };
      const gw = w - pad.l - pad.r, gh = h - pad.t - pad.b;

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (gh / 4) * i;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + gw, y); ctx.stroke();
      }

      // axis labels
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "10px monospace";
      ["1.0", "0.75", "0.5", "0.25", "0"].forEach((v, i) => {
        ctx.fillText(v, 2, pad.t + (gh / 4) * i + 4);
      });

      // loss curve (train)
      const trainPoints = Array.from({ length: 60 }, (_, i) => {
        const x = i / 59;
        const y = Math.exp(-x * 3.2) * 0.88 + 0.04 + Math.sin(x * 18) * 0.012;
        return { x: pad.l + x * gw * p, y: pad.t + (1 - y) * gh };
      }).filter(pt => pt.x <= pad.l + gw * p);

      if (trainPoints.length > 1) {
        const grad = ctx.createLinearGradient(pad.l, 0, pad.l + gw, 0);
        grad.addColorStop(0, "rgba(236,72,153,0.9)");
        grad.addColorStop(1, "rgba(124,58,237,0.9)");
        ctx.beginPath();
        trainPoints.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();

        // area fill
        ctx.beginPath();
        trainPoints.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
        ctx.lineTo(trainPoints[trainPoints.length - 1].x, pad.t + gh);
        ctx.lineTo(pad.l, pad.t + gh);
        ctx.closePath();
        const areaGrad = ctx.createLinearGradient(0, pad.t, 0, pad.t + gh);
        areaGrad.addColorStop(0, "rgba(236,72,153,0.12)");
        areaGrad.addColorStop(1, "transparent");
        ctx.fillStyle = areaGrad;
        ctx.fill();
      }

      // val curve
      const valPoints = Array.from({ length: 60 }, (_, i) => {
        const x = i / 59;
        const y = Math.exp(-x * 2.6) * 0.84 + 0.08 + Math.sin(x * 12) * 0.022;
        return { x: pad.l + x * gw * p, y: pad.t + (1 - y) * gh };
      }).filter(pt => pt.x <= pad.l + gw * p);

      if (valPoints.length > 1) {
        ctx.beginPath();
        valPoints.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
        ctx.strokeStyle = "rgba(245,158,11,0.55)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // legend
      ctx.fillStyle = "rgba(236,72,153,0.8)";
      ctx.fillRect(pad.l, h - 14, 12, 3);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText("train loss", pad.l + 16, h - 10);
      ctx.fillStyle = "rgba(245,158,11,0.8)";
      ctx.fillRect(pad.l + 80, h - 14, 12, 3);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText("val loss", pad.l + 96, h - 10);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <canvas
      ref={ref}
      style={{ width: "100%", height: "100%", borderRadius: 8 }}
    />
  );
}

// ─── Weight heatmap canvas ─────────────────────────────────────────────────
function HeatmapCanvas({ progress }: { progress: React.MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // static weights so they don't flicker
    const rows = 6, cols = 8;
    const weights = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (Math.random() - 0.5) * 2)
    );

    let raf = 0;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const p = Math.min(progress.current, 1);
      const cw = w / cols, ch = h / rows;

      weights.forEach((row, ri) => {
        row.forEach((val, ci) => {
          const opacity = p * (0.3 + Math.abs(val) * 0.6);
          const color = val > 0 ? `rgba(124,58,237,${opacity})` : `rgba(236,72,153,${opacity})`;
          ctx.fillStyle = color;
          ctx.fillRect(ci * cw + 1, ri * ch + 1, cw - 2, ch - 2);

          // value text
          if (p > 0.5) {
            ctx.fillStyle = `rgba(255,255,255,${(p - 0.5) * 1.2 * 0.7})`;
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.fillText(val.toFixed(2), ci * cw + cw / 2, ri * ch + ch / 2 + 3);
          }
        });
      });

      // grid
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(w, r * ch); ctx.stroke(); }
      for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, h); ctx.stroke(); }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return <canvas ref={ref} style={{ width: "100%", height: "100%", borderRadius: 8 }} />;
}

// ─── Scroll-cinematic hook ────────────────────────────────────────────────────
function useScrollCinema(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const scenes = gsap.utils.toArray<HTMLElement>(".cinema-scene");

      scenes.forEach((scene) => {
        const tag    = scene.querySelector(".ci-tag");
        const title  = scene.querySelector(".ci-title");
        const body   = scene.querySelector(".ci-body");
        const visual = scene.querySelector(".ci-visual");
        const extras = gsap.utils.toArray<HTMLElement>(scene.querySelectorAll(".ci-extra"));

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scene,
            start: "top 80%",
            end: "bottom 20%",
            scrub: 1.2,
          },
        });

        // Enter
        if (tag)   tl.fromTo(tag,   { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.3 }, 0);
        if (title) tl.fromTo(title, { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.4 }, 0.05);
        if (body)  tl.fromTo(body,  { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35 }, 0.12);
        if (visual) tl.fromTo(visual, { opacity: 0, x: 40, scale: 0.94 }, { opacity: 1, x: 0, scale: 1, duration: 0.5 }, 0.08);
        extras.forEach((el, i) => {
          tl.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0.2 + i * 0.08);
        });

        // Exit (scrub back out)
        tl.to([tag, title, body].filter(Boolean),  { opacity: 0, y: -30, duration: 0.3 }, 0.72);
        tl.to(visual ? [visual] : [],               { opacity: 0, x: -30, duration: 0.3 }, 0.72);
        tl.to(extras,                               { opacity: 0, y: -20, duration: 0.25 }, 0.76);
      });

      // Horizontal stat ticker
      const ticker = document.querySelector<HTMLElement>(".stat-ticker-inner");
      if (ticker) {
        gsap.to(ticker, {
          x: "-50%",
          ease: "none",
          duration: 28,
          repeat: -1,
        });
      }
    }, containerRef.current!);

    return () => ctx.revert();
  }, [containerRef]);
}

// ─── Inline stat pill ─────────────────────────────────────────────────────────
function Pill({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 14px",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 4,
        margin: "4px 5px",
        fontFamily: "monospace",
      }}
    >
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);

  // progress refs for canvas animations — driven by IntersectionObserver
  const dbProgress = useRef(0);
  const lossProgress = useRef(0);
  const heatProgress = useRef(0);

  useScrollCinema(pageRef);

  // animate canvas progress values when their section is visible
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const watch = (id: string, ref: React.MutableRefObject<number>) => {
      const el = document.getElementById(id);
      if (!el) return;
      let raf = 0;
      const obs = new IntersectionObserver(
        ([entry]) => {
          cancelAnimationFrame(raf);
          if (entry.isIntersecting) {
            const start = performance.now();
            const step = (now: number) => {
              ref.current = Math.min((now - start) / 1400, 1);
              if (ref.current < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
          } else {
            ref.current = 0;
          }
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    };

    watch("db-anchor", dbProgress);
    watch("loss-anchor", lossProgress);
    watch("heat-anchor", heatProgress);

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div ref={pageRef}>
      <main style={{ minHeight: "100vh", background: "#08080a", color: "#f4f4f5", overflow: "hidden" }}>
        <LandingNav />

        {/* ── HERO (unchanged) ─────────────────────────────────────────── */}
        <section
          style={{
            minHeight: "100vh",
            position: "relative",
            padding: "0 68px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 12% 18%, rgba(236,72,153,0.08), transparent 18%), radial-gradient(circle at 70% 85%, rgba(124,58,237,0.18), transparent 22%), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)",
              backgroundSize: "auto, auto, 72px 72px, 72px 72px",
              maskImage: "linear-gradient(180deg, black, black 72%, transparent)",
            }}
          />
          <div style={{ position: "absolute", inset: 0, left: "36%" }}>
            <NeuralField />
          </div>
          <div style={{ position: "relative", zIndex: 2, width: "100%", paddingTop: 80 }}>
            <p style={{ color: "#8a8a94", fontSize: 16, marginBottom: 20 }}>Totally Free</p>
            <div
              style={{
                width: 86,
                height: 1,
                background: "linear-gradient(90deg,#ec4899,transparent)",
                marginBottom: 42,
              }}
            />
            <h1
              style={{
                fontSize: "clamp(116px, 22vw, 270px)",
                lineHeight: 0.72,
                letterSpacing: "-0.13em",
                fontWeight: 900,
                color: "#fff",
                marginBottom: 70,
                textShadow: "0 14px 80px rgba(255,255,255,0.08)",
              }}
            >
              Axon
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <Link
                href="/playground"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 16,
                  height: 72,
                  padding: "0 22px 0 34px",
                  minWidth: 286,
                  borderRadius: 10,
                  color: "#f4f4f5",
                  textDecoration: "none",
                  fontWeight: 850,
                  border: "1px solid rgba(236,72,153,0.48)",
                  background: "linear-gradient(135deg, rgba(236,72,153,0.20), rgba(124,58,237,0.11))",
                  boxShadow: "0 0 52px rgba(236,72,153,0.13)",
                }}
              >
                Launch playground
                <span
                  style={{
                    marginLeft: "auto",
                    width: 42,
                    height: 42,
                    borderRadius: 9,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(236,72,153,0.45)",
                  }}
                >
                  →
                </span>
              </Link>
              <span style={{ color: "#52525b", fontSize: 15 }}>No setup · runs in your browser</span>
            </div>
          </div>
        </section>

        {/* ── TICKER (unchanged) ───────────────────────────────────────── */}
        <section
          style={{
            borderTop: "1px solid rgba(255,255,255,0.065)",
            borderBottom: "1px solid rgba(255,255,255,0.065)",
            padding: "18px 0",
            overflow: "hidden",
          }}
        >
          <div
            className="stat-ticker-inner"
            style={{
              display: "inline-flex",
              whiteSpace: "nowrap",
              color: "#73737f",
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              gap: 48,
              paddingLeft: 48,
            }}
          >
            {[
              "Decision boundaries", "Misclassification lens", "CSV training",
              "Forward-pass inspection", "Train/test split", "Experiment export",
              "Weight heatmaps", "Gradient flow", "Epoch timeline",
              // duplicate for seamless loop
              "Decision boundaries", "Misclassification lens", "CSV training",
              "Forward-pass inspection", "Train/test split", "Experiment export",
              "Weight heatmaps", "Gradient flow", "Epoch timeline",
            ].map((s, i) => (
              <span key={i}>{s}</span>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CINEMATIC SCROLL SECTIONS
        ═══════════════════════════════════════════════════════════════ */}

        {/* ── SCENE A: Decision Boundary ───────────────────────────────── */}
        <section
          className="cinema-scene"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            padding: "0 68px",
            position: "relative",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* ambient glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 55% 60% at 75% 50%, rgba(124,58,237,0.10) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* left copy */}
          <div style={{ flex: "0 0 42%", paddingRight: 60 }}>
            <p
              className="ci-tag"
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#7c3aed",
                marginBottom: 20,
                opacity: 0,
              }}
            >
              01 — Decision Boundary
            </p>
            <h2
              className="ci-title"
              style={{
                fontSize: "clamp(36px, 4vw, 58px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                marginBottom: 24,
                opacity: 0,
              }}
            >
              Watch the<br />
              model think<br />
              <span style={{ color: "#ec4899" }}>in real time.</span>
            </h2>
            <p
              className="ci-body"
              style={{ color: "#8a8a94", lineHeight: 1.75, fontSize: 15, marginBottom: 32, opacity: 0 }}
            >
              The decision boundary canvas updates live with every gradient step.
              Switch between <em style={{ color: "#f4f4f5" }}>Boundary</em>,{" "}
              <em style={{ color: "#f4f4f5" }}>Errors</em>, and{" "}
              <em style={{ color: "#f4f4f5" }}>Gradients</em> view modes — or click
              any point to inspect its full forward pass, layer activations, and confidence score.
            </p>
            <div className="ci-extra" style={{ opacity: 0 }}>
              <Pill label="Confidence zones" />
              <Pill label="Misclassification lens" />
              <Pill label="Forward-pass inspector" />
            </div>
          </div>

          {/* right visual */}
          <div
            id="db-anchor"
            className="ci-visual"
            style={{ flex: 1, height: 380, opacity: 0 }}
          >
            <DecisionCanvas progress={dbProgress} />
          </div>
        </section>

        {/* ── SCENE B: Loss curve + metrics ───────────────────────────── */}
        <section
          className="cinema-scene"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            padding: "0 68px",
            position: "relative",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 55% 60% at 20% 50%, rgba(236,72,153,0.07) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* left visual */}
          <div
            id="loss-anchor"
            className="ci-visual"
            style={{ flex: 1, height: 300, marginRight: 60, opacity: 0 }}
          >
            <LossCanvas progress={lossProgress} />
          </div>

          {/* right copy */}
          <div style={{ flex: "0 0 42%" }}>
            <p
              className="ci-tag"
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#ec4899",
                marginBottom: 20,
                opacity: 0,
              }}
            >
              02 — Live Metrics
            </p>
            <h2
              className="ci-title"
              style={{
                fontSize: "clamp(36px, 4vw, 58px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                marginBottom: 24,
                opacity: 0,
              }}
            >
              Every number,<br />
              <span style={{ color: "#7c3aed" }}>explained.</span>
            </h2>
            <p
              className="ci-body"
              style={{ color: "#8a8a94", lineHeight: 1.75, fontSize: 15, marginBottom: 36, opacity: 0 }}
            >
              Track train and val loss curves in real time. Spot the moment your model
              starts overfitting. Compare generalization gaps across architectures and
              learning rates without writing a single line of code.
            </p>

            {/* stat grid */}
            <div
              className="ci-extra"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                overflow: "hidden",
                opacity: 0,
              }}
            >
              {[
                { num: "98%", label: "Train acc" },
                { num: "94%", label: "Test acc" },
                { num: "0.04", label: "Val loss" },
                { num: "<3ms", label: "Per epoch" },
                { num: "∞", label: "Experiments" },
                { num: "0", label: "Setup required" },
              ].map(({ num, label }) => (
                <div
                  key={label}
                  style={{
                    background: "#08080a",
                    padding: "18px 16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      color: "#f4f4f5",
                      lineHeight: 1,
                      marginBottom: 4,
                    }}
                  >
                    {num}
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#52525b",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SCENE C: Weight heatmap + explain mode ───────────────────── */}
        <section
          className="cinema-scene"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            padding: "0 68px",
            position: "relative",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 55% 60% at 75% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* left copy */}
          <div style={{ flex: "0 0 44%", paddingRight: 64 }}>
            <p
              className="ci-tag"
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#f59e0b",
                marginBottom: 20,
                opacity: 0,
              }}
            >
              03 — Internal State
            </p>
            <h2
              className="ci-title"
              style={{
                fontSize: "clamp(36px, 4vw, 58px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                marginBottom: 24,
                opacity: 0,
              }}
            >
              Open the<br />
              black box.<br />
              <span style={{ color: "#ec4899" }}>For real.</span>
            </h2>
            <p
              className="ci-body"
              style={{ color: "#8a8a94", lineHeight: 1.75, fontSize: 15, marginBottom: 28, opacity: 0 }}
            >
              The weight heatmap shows every learned parameter — positive weights in{" "}
              <span style={{ color: "#7c3aed" }}>violet</span>, negative in{" "}
              <span style={{ color: "#ec4899" }}>pink</span>. Pair that with the
              gradient flow view to see which layers are learning and which are stuck.
            </p>

            {/* explain-mode card */}
            <div
              className="ci-extra"
              style={{
                padding: "18px 20px",
                border: "1px solid rgba(245,158,11,0.18)",
                borderRadius: 10,
                background: "rgba(245,158,11,0.04)",
                opacity: 0,
              }}
            >
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#f59e0b",
                  marginBottom: 10,
                }}
              >
                ✦ Explain Mode
              </p>
              {[
                "Model is likely underfitting — try more neurons.",
                "Learning rate may be too high — loss is unstable.",
                "Generalization gap is small — model is healthy.",
              ].map((msg, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.6,
                    marginBottom: i < 2 ? 6 : 0,
                  }}
                >
                  → {msg}
                </p>
              ))}
            </div>
          </div>

          {/* right visual */}
          <div
            id="heat-anchor"
            className="ci-visual"
            style={{ flex: 1, height: 260, opacity: 0 }}
          >
            <HeatmapCanvas progress={heatProgress} />
          </div>
        </section>

        {/* ── SCENE D: CSV import ──────────────────────────────────────── */}
        <section
          className="cinema-scene"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            padding: "0 68px",
            position: "relative",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 55% 60% at 20% 50%, rgba(34,211,238,0.05) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* left: drop zone visual */}
          <div
            className="ci-visual"
            style={{ flex: 1, marginRight: 64, opacity: 0 }}
          >
            <div
              style={{
                border: "1px dashed rgba(34,211,238,0.25)",
                borderRadius: 12,
                padding: "36px 28px",
                background: "rgba(34,211,238,0.03)",
              }}
            >
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(34,211,238,0.5)",
                  marginBottom: 16,
                }}
              >
                Dataset Preview · 320 rows valid
              </p>

              {/* CSV table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["x", "y", "label"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          color: "rgba(255,255,255,0.25)",
                          padding: "4px 10px",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          letterSpacing: "0.12em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["0.12", "0.88", "0", "#7c3aed"],
                    ["-0.40", "0.20", "1", "#ec4899"],
                    ["0.60", "-0.10", "0", "#7c3aed"],
                    ["-0.22", "-0.71", "1", "#ec4899"],
                    ["0.91", "0.34", "1", "#ec4899"],
                    ["...", "...", "...", "rgba(255,255,255,0.15)"],
                  ].map(([x, y, label, col], i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                      {[x, y].map((v, j) => (
                        <td key={j} style={{ padding: "6px 10px", color: "rgba(255,255,255,0.35)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{v}</td>
                      ))}
                      <td style={{ padding: "6px 10px", color: col, borderBottom: "1px solid rgba(255,255,255,0.04)", fontWeight: 700 }}>{label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {["✓ Auto column detect", "✓ Numeric validation", "✓ Normalize to [−1, 1]", "✓ 320 valid rows"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: "rgba(34,211,238,0.6)",
                      background: "rgba(34,211,238,0.06)",
                      border: "1px solid rgba(34,211,238,0.12)",
                      borderRadius: 4,
                      padding: "4px 10px",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* right copy */}
          <div style={{ flex: "0 0 40%" }}>
            <p
              className="ci-tag"
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#22d3ee",
                marginBottom: 20,
                opacity: 0,
              }}
            >
              04 — Custom Data
            </p>
            <h2
              className="ci-title"
              style={{
                fontSize: "clamp(36px, 4vw, 58px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                marginBottom: 24,
                opacity: 0,
              }}
            >
              Your data.<br />
              Your model.<br />
              <span style={{ color: "#ec4899" }}>Your rules.</span>
            </h2>
            <p
              className="ci-body"
              style={{ color: "#8a8a94", lineHeight: 1.75, fontSize: 15, marginBottom: 28, opacity: 0 }}
            >
              Drop any CSV with two numeric columns and a binary label. Axon
              detects columns, validates rows, normalizes values and trains on your
              data instantly — no backend, no upload, no waiting.
            </p>
            <div className="ci-extra" style={{ opacity: 0 }}>
              <Pill label="Drag & drop" />
              <Pill label="Click to upload" />
              <Pill label="Sample CSV" />
              <Pill label="Manual column select" />
            </div>
          </div>
        </section>

        {/* ── SCENE E: Final CTA ───────────────────────────────────────── */}
        <section
          className="cinema-scene"
          style={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 68px",
            position: "relative",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            overflow: "hidden",
          }}
        >
          {/* large blurred glow orb */}
          <div
            style={{
              position: "absolute",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.18), rgba(236,72,153,0.10), transparent 70%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />

          <p
            className="ci-tag"
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#7c3aed",
              marginBottom: 20,
              opacity: 0,
            }}
          >
            Axon Studio · Free Forever
          </p>
          <h2
            className="ci-title"
            style={{
              fontSize: "clamp(52px, 8vw, 110px)",
              fontWeight: 900,
              letterSpacing: "-0.07em",
              lineHeight: 0.95,
              marginBottom: 28,
              opacity: 0,
            }}
          >
            The lab<br />is open.
          </h2>
          <p
            className="ci-body"
            style={{
              color: "#8a8a94",
              fontSize: 16,
              lineHeight: 1.7,
              maxWidth: 480,
              marginBottom: 44,
              opacity: 0,
            }}
          >
            No GPU. No install. No backend. Open the playground in your browser
            and start training in under ten seconds.
          </p>
          <div className="ci-extra" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", opacity: 0 }}>
            <Link
              href="/playground"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                height: 64,
                padding: "0 20px 0 30px",
                borderRadius: 10,
                color: "#f4f4f5",
                textDecoration: "none",
                fontWeight: 800,
                border: "1px solid rgba(236,72,153,0.48)",
                background: "linear-gradient(135deg, rgba(236,72,153,0.20), rgba(124,58,237,0.11))",
              }}
            >
              Launch Playground
              <span
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  display: "grid", placeItems: "center",
                  background: "rgba(236,72,153,0.45)",
                }}
              >
                →
              </span>
            </Link>
            <Link
              href="/docs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 64,
                padding: "0 28px",
                borderRadius: 10,
                color: "#8a8a94",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                fontWeight: 600,
              }}
            >
              Read the docs →
            </Link>
          </div>
        </section>

        {/* ── Feature grid (unchanged) ─────────────────────────────────── */}
        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "96px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <FeatureCard
              title="Inspect the learning process"
              body="Watch decision regions, errors, confidence, loss, weights, and layer flow update while the model learns."
            />
            <FeatureCard
              title="Bring your own CSV"
              body="Import a 2D binary dataset, auto-detect columns, validate rows, normalize values, and train locally."
            />
            <FeatureCard
              title="Compare experiments"
              body="Save runs, export summaries, download JSON, and compare architecture choices across datasets."
            />
          </div>
        </section>
      </main>
    </div>
  );
}
