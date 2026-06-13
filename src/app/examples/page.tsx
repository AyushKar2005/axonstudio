"use client";

import Link from "next/link";
import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence ,type Variants} from "framer-motion";
import SiteNav from "@/components/site/SiteNav";
import { PRESETS } from "@/lib/tf/datasets";

const examples = [
  {
    name: "XOR compact",
    presetFallbackId: "xor-small",
    tag: "Classic non-linear split",
    dataset: "xor",
    architecture: "2 → 4 → 4 → 1",
    activation: "ReLU",
    difficulty: "Medium",
    why: "Shows why a linear boundary is not enough. A tiny hidden network learns quadrant-based separation.",
  },
  {
    name: "Circles clean",
    presetFallbackId: "circles-fast",
    tag: "Fast convergence demo",
    dataset: "circles",
    architecture: "2 → 4 → 4 → 1",
    activation: "ReLU",
    difficulty: "Easy",
    why: "A strong demo for decision boundaries. The network learns an enclosed class region quickly.",
  },
  {
    name: "Spiral deep",
    presetFallbackId: "spiral-deep",
    tag: "Process-view stress test",
    dataset: "spiral",
    architecture: "2 → 8 → 8 → 8 → 8 → 1",
    activation: "Tanh",
    difficulty: "Hard",
    why: "Great for inspecting confidence, misclassifications, gradients, and the limits of tiny networks.",
  },
  {
    name: "Linear baseline",
    presetFallbackId: "linear-base",
    tag: "One boundary sanity check",
    dataset: "blobs",
    architecture: "2 → 2 → 1",
    activation: "Linear",
    difficulty: "Easy",
    why: "Proves the system works on linearly separable data before trying harder shapes.",
  },
  {
    name: "CSV import demo",
    presetFallbackId: "",
    tag: "Bring your own data",
    dataset: "custom CSV",
    architecture: "User selected",
    activation: "Any",
    difficulty: "Variable",
    why: "Turns Axon from a playground into a real local experiment lab for 2D binary datasets.",
  },
];

const difficultyColor: Record<string, string> = {
  Easy: "#4ade80",
  Medium: "#facc15",
  Hard: "#f87171",
  Variable: "#60a5fa",
};

function getExampleHref(example: (typeof examples)[number]) {
  if (example.dataset === "custom CSV") return "/playground";

  const preset = PRESETS.find((p) => {
    const sameName = p.name.toLowerCase() === example.name.toLowerCase();
    const sameId = p.id === example.presetFallbackId;
    return sameName || sameId;
  });

  return preset ? `/playground?example=${encodeURIComponent(preset.id)}` : "/playground";
}

function MiniPlot({ type }: { type: string }) {
  const points = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const t = i / 44;

        if (type === "circles") {
          const a = t * Math.PI * 8;
          const r = i % 2 ? 34 : 16;
          return {
            x: 50 + Math.cos(a) * r + Math.sin(i) * 4,
            y: 50 + Math.sin(a) * r + Math.cos(i) * 4,
            c: i % 2,
          };
        }

        if (type === "spiral") {
          const a = t * Math.PI * 5;
          const r = t * 44;
          return {
            x: 50 + Math.cos(a + (i % 2) * Math.PI) * r,
            y: 50 + Math.sin(a + (i % 2) * Math.PI) * r,
            c: i % 2,
          };
        }

        if (type === "xor") {
          const x = i % 4 < 2 ? 25 + ((i * 3.1) % 12) : 63 + ((i * 2.7) % 12);
          const y = i % 2 ? 25 + ((i * 2.3) % 12) : 63 + ((i * 3.7) % 12);
          return { x, y, c: (x > 50) === (y > 50) ? 0 : 1 };
        }

        return {
          x: 22 + (i % 2) * 55 + ((i * 1.7) % 15),
          y: 24 + (i % 2) * 45 + ((i * 2.1) % 16),
          c: i % 2,
        };
      }),
    [type],
  );

  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: 140, display: "block" }}>
      <rect x="0" y="0" width="100" height="100" rx="10" fill="rgba(255,255,255,0.018)" />
      <path
        d="M0 54 C22 32, 36 70, 55 49 S78 33, 100 54"
        stroke="rgba(255,255,255,0.10)"
        fill="none"
        strokeWidth="0.8"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.2" fill={p.c ? "#ec4899" : "#8b5cf6"} opacity="0.8" />
      ))}
    </svg>
  );
}

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.97,
  },

  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.07,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),

  exit: {
    opacity: 0,
    scale: 0.96,
    transition: {
      duration: 0.2,
    },
  },
};

export default function ExamplesPage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return examples;
    return examples.filter((e) => Object.values(e).join(" ").toLowerCase().includes(q));
  }, [query]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% -10%, rgba(124,58,237,0.22), transparent 24%), #060607",
        color: "#f4f4f5",
        padding: "clamp(14px, 3vw, 34px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: 1360,
          minHeight: "calc(100vh - clamp(28px, 6vw, 68px))",
          margin: "0 auto",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "clamp(10px, 2vw, 18px)",
          background: "linear-gradient(180deg, rgba(16,16,20,0.94), rgba(8,8,10,0.96))",
          boxShadow: "0 0 80px rgba(124,58,237,0.14), 0 40px 120px rgba(0,0,0,0.54)",
          overflow: "hidden",
        }}
      >
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <SiteNav />
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            padding: "clamp(32px, 5vw, 56px) clamp(20px, 5vw, 56px) clamp(24px, 4vw, 42px)",
            display: "grid",
            gridTemplateColumns: "1fr clamp(240px, 28vw, 320px)",
            gap: "clamp(20px, 3vw, 34px)",
            alignItems: "start",
          }}
        >
          <div>
            <p
              style={{
                color: "#a78bfa",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                fontSize: 10,
                fontWeight: 850,
                marginBottom: 14,
              }}
            >
              Experiment gallery
            </p>
            <h1
              style={{
                fontSize: "clamp(28px, 5vw, 58px)",
                letterSpacing: "-0.07em",
                lineHeight: 0.96,
                marginBottom: 16,
              }}
            >
              Start from demos that reveal
              <br />
              how models learn.
            </h1>
            <p
              style={{
                color: "#a1a1aa",
                lineHeight: 1.8,
                fontSize: "clamp(13px, 1.5vw, 15px)",
                maxWidth: 640,
              }}
            >
              Each example is designed to expose a different learning behavior: non-linear boundaries,
              convergence speed, noisy errors, gradient flow, or custom CSV training.
            </p>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "18px 18px",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              style={{
                fontSize: 10,
                color: "#52525b",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: 10,
              }}
            >
              Search examples
            </p>

            <motion.div
              animate={{
                boxShadow: focused
                  ? "0 0 0 1.5px rgba(124,58,237,0.5), 0 4px 20px rgba(124,58,237,0.10)"
                  : "0 0 0 1px rgba(255,255,255,0.08)",
                background: focused ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
              }}
              transition={{ duration: 0.2 }}
              style={{ borderRadius: 9, position: "relative" }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#52525b",
                  pointerEvents: "none",
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="spiral, csv, relu..."
                style={{
                  width: "100%",
                  height: 38,
                  borderRadius: 9,
                  border: "none",
                  background: "transparent",
                  color: "#f4f4f5",
                  padding: "0 32px 0 32px",
                  outline: "none",
                  fontSize: 13,
                }}
              />

              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(255,255,255,0.07)",
                      border: "none",
                      borderRadius: 5,
                      color: "#71717a",
                      cursor: "pointer",
                      padding: "2px 6px",
                      fontSize: 10,
                    }}
                  >
                    ✕
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {query && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ fontSize: 11, color: "#52525b", marginTop: 6 }}
                >
                  {filtered.length === 0 ? "No results" : `${filtered.length} found`}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ marginTop: 14 }}>
              <Link
                href="/playground"
                style={{
                  display: "block",
                  color: "#f4f4f5",
                  textDecoration: "none",
                  textAlign: "center",
                  padding: "11px",
                  borderRadius: 9,
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(167,139,250,0.22)",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                Open playground →
              </Link>
            </motion.div>
          </div>
        </motion.section>

        <section
          style={{
            padding: "0 clamp(20px, 5vw, 56px) clamp(40px, 6vw, 70px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            gap: "clamp(12px, 2vw, 18px)",
          }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  gridColumn: "1 / -1",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: "32px 24px",
                  color: "#52525b",
                  textAlign: "center",
                  fontSize: 14,
                }}
              >
                No examples matched <span style={{ color: "#a1a1aa" }}>"{query}"</span>
              </motion.div>
            ) : (
              filtered.map((e, i) => (
                <motion.article
                  key={e.name}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 22 } }}
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.038), rgba(255,255,255,0.012))",
                    overflow: "hidden",
                    cursor: "default",
                  }}
                >
                  <div style={{ padding: "14px 14px 8px" }}>
                    <MiniPlot type={e.dataset} />
                  </div>

                  <div style={{ padding: "0 18px 20px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <p
                        style={{
                          color: "#a78bfa",
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                        }}
                      >
                        {e.tag}
                      </p>
                      <span
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: difficultyColor[e.difficulty] ?? "#a1a1aa",
                          background: `${difficultyColor[e.difficulty] ?? "#a1a1aa"}18`,
                          border: `1px solid ${difficultyColor[e.difficulty] ?? "#a1a1aa"}30`,
                          borderRadius: 4,
                          padding: "2px 7px",
                        }}
                      >
                        {e.difficulty}
                      </span>
                    </div>

                    <h2
                      style={{
                        fontSize: "clamp(17px, 2vw, 21px)",
                        letterSpacing: "-0.04em",
                        marginBottom: 8,
                      }}
                    >
                      {e.name}
                    </h2>

                    <p
                      style={{
                        color: "#a1a1aa",
                        lineHeight: 1.7,
                        fontSize: 13,
                        minHeight: 60,
                        marginBottom: 14,
                      }}
                    >
                      {e.why}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        marginBottom: 16,
                        padding: "12px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 9,
                      }}
                    >
                      {[
                        ["Arch", e.architecture],
                        ["Activation", e.activation],
                        ["Dataset", e.dataset],
                        ["Level", e.difficulty],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <span
                            style={{
                              color: "#52525b",
                              fontSize: 9,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              display: "block",
                              marginBottom: 2,
                            }}
                          >
                            {label}
                          </span>
                          <span style={{ color: "#d4d4d8", fontSize: 11, fontWeight: 600 }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    <motion.div whileHover={{ x: 2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
                      <Link
                        href={getExampleHref(e)}
                        style={{
                          display: "inline-block",
                          color: "#c4b5fd",
                          textDecoration: "none",
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        Run this setup →
                      </Link>
                    </motion.div>
                  </div>
                </motion.article>
              ))
            )}
          </AnimatePresence>
        </section>
      </motion.div>
    </main>
  );
}