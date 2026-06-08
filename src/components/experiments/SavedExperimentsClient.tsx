"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { SavedRun } from "@/lib/tf/types";
import { PageShell, card, eyebrow, heroCopy, heroTitle, pageWrap } from "@/components/site/PageShell";

const KEY = "axon:saved-runs:v2";

const runVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.055, duration: 0.36, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, x: -18, scale: 0.97, transition: { duration: 0.2 } },
};

export default function SavedExperimentsClient() {
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedRun[];
      setRuns(Array.isArray(raw) ? raw : []);
    } catch { setRuns([]); }
    setLoaded(true);
  }, []);

  const best = useMemo(() => runs.reduce<SavedRun | null>((w, r) => {
    if (!w) return r;
    return ((r.metrics?.testAccuracy ?? r.metrics?.accuracy ?? 0) >
            (w.metrics?.testAccuracy ?? w.metrics?.accuracy ?? 0)) ? r : w;
  }, null), [runs]);

  const remove = (id: string) => {
    const next = runs.filter((r) => r.id !== id);
    setRuns(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const clear = () => { setRuns([]); localStorage.removeItem(KEY); };

  const exportAll = () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), runs }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `axon-runs-${Date.now()}.json` });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        style={pageWrap}
      >
        <p style={eyebrow}>Saved experiments</p>
        <h1 style={heroTitle}>Your local run history.</h1>
        <p style={heroCopy}>
          Saved experiments live in browser localStorage. Compare model runs, review architecture choices,
          and export history before wiring Neon/Postgres persistence.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 30 }}>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/playground" style={{
              color: "#fff", textDecoration: "none", borderRadius: 11,
              padding: "11px 18px", background: "linear-gradient(135deg,#7c3aed,#ec4899)",
              fontWeight: 800, fontSize: 13, display: "inline-block",
            }}>
              Open playground
            </Link>
          </motion.div>

          {([
            { label: "Export all JSON", action: exportAll },
            { label: "Clear all", action: clear },
          ] as const).map(({ label, action }) => (
            <motion.button
              key={label}
              whileHover={runs.length ? { scale: 1.03 } : {}}
              whileTap={runs.length ? { scale: 0.97 } : {}}
              onClick={action}
              disabled={!runs.length}
              style={{
                color: runs.length ? "#c4b5fd" : "#2e2e38",
                borderRadius: 11, padding: "11px 18px",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${runs.length ? "rgba(196,181,253,0.16)" : "#1e1e26"}`,
                fontWeight: 750, fontSize: 13,
                cursor: runs.length ? "pointer" : "not-allowed",
                transition: "color 0.2s, border-color 0.2s",
              }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ── Content ───────────────────────────────────────────────── */}
      <section style={{ ...pageWrap, paddingTop: 0 }}>
        <AnimatePresence mode="wait">
          {/* Loading skeleton */}
          {!loaded && (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "grid", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  height: 88, borderRadius: 18,
                  background: "rgba(255,255,255,0.02)", border: "1px solid #18181e",
                  animation: "axon-pulse 1.6s ease-in-out infinite",
                }} />
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {loaded && runs.length === 0 && (
            <motion.div key="empty"
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ ...card, padding: "clamp(24px, 4vw, 40px)" }}
            >
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.35 }}>🧪</div>
              <h2 style={{ fontSize: "clamp(20px, 3.5vw, 32px)", letterSpacing: "-0.055em", marginBottom: 10 }}>
                No saved runs yet.
              </h2>
              <p style={{ color: "#6a6a78", lineHeight: 1.7, maxWidth: 520, fontSize: 14 }}>
                Train a model in the playground, then click{" "}
                <em style={{ color: "#c4b5fd", fontStyle: "normal" }}>save run</em>{" "}
                or press Ctrl+S. Saved runs appear here automatically.
              </p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ marginTop: 20, display: "inline-block" }}>
                <Link href="/playground" style={{
                  color: "#fff", textDecoration: "none", borderRadius: 10, padding: "10px 18px",
                  background: "linear-gradient(135deg,#7c3aed,#ec4899)",
                  fontWeight: 800, fontSize: 13, display: "inline-block",
                }}>
                  Go to playground →
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* Runs */}
          {loaded && runs.length > 0 && (
            <motion.div key="runs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,0.7fr) minmax(0,1.3fr)",
                gap: "clamp(12px, 2vw, 18px)",
                alignItems: "start",
              }}
            >
              {/* Best run sidebar */}
              <motion.aside
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                style={{ ...card, padding: "clamp(16px, 2.5vw, 24px)", alignSelf: "start" }}
              >
                <p style={{ ...eyebrow, marginBottom: 14 }}>Best run</p>
                {best && <RunSummary run={best} featured />}
                <div style={{
                  marginTop: 18, paddingTop: 14,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  display: "grid", gap: 9,
                }}>
                  <StatCell label="Total saved" value={String(runs.length)} />
                  <StatCell label="Datasets" value={String(new Set(runs.map((r) => r.datasetName)).size)} />
                  <StatCell label="Best test accuracy"
                    value={fmtPct(best?.metrics?.testAccuracy ?? best?.metrics?.accuracy)} />
                </div>
              </motion.aside>

              {/* Run list */}
              <div style={{ display: "grid", gap: "clamp(9px, 1.5vw, 13px)" }}>
                <AnimatePresence>
                  {runs.map((run, i) => (
                    <motion.article key={run.id} custom={i} variants={runVariants}
                      initial="hidden" animate="visible" exit="exit" layout
                      style={{ ...card, padding: "clamp(13px, 2.2vw, 20px)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <RunSummary run={run} />
                        <motion.button
                          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                          onClick={() => remove(run.id)}
                          style={{
                            flexShrink: 0, alignSelf: "start",
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "#42424e", borderRadius: 8,
                            padding: "6px 10px", cursor: "pointer", fontSize: 11,
                            transition: "color 0.18s, border-color 0.18s",
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = "#f87171";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.25)";
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = "#42424e";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                          }}
                        >
                          Delete
                        </motion.button>
                      </div>

                      {/* Animated accuracy bar */}
                      <div style={{
                        marginTop: 14, height: 4, borderRadius: 999,
                        background: "rgba(255,255,255,0.05)", overflow: "hidden",
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, Math.round(
                              (run.metrics?.testAccuracy ?? run.metrics?.accuracy ?? 0) * 100
                            ))}%`
                          }}
                          transition={{ delay: 0.18 + i * 0.05, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                          style={{
                            height: "100%",
                            background: "linear-gradient(90deg,#7c3aed,#ec4899)",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <style>{`
        @keyframes axon-pulse {
          0%,100% { opacity:0.35; }
          50%      { opacity:0.6; }
        }
      `}</style>
    </PageShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function RunSummary({ run, featured = false }: { run: SavedRun; featured?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <h2 style={{
        fontSize: featured ? "clamp(16px, 2.2vw, 24px)" : "clamp(14px, 1.8vw, 18px)",
        letterSpacing: "-0.045em", marginBottom: 5,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {run.name}
      </h2>
      <p style={{ color: "#42424e", fontSize: 11, marginBottom: 12, letterSpacing: "0.02em" }}>
        {run.datasetName} · {run.layers.map((l) => l.neurons).join(" → ")} · {new Date(run.createdAt).toLocaleString()}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7 }}>
        <StatCell label="Accuracy" value={fmtPct(run.metrics?.accuracy)} />
        <StatCell label="Test" value={fmtPct(run.metrics?.testAccuracy)} />
        <StatCell label="Loss" value={run.loss === null ? "—" : run.loss.toFixed(4)} />
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.055)",
      borderRadius: 9, padding: "9px 10px",
      background: "rgba(255,255,255,0.012)",
    }}>
      <div style={{ color: "#3a3a48", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 8, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: "#c4c4cc", fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "clamp(10px, 1.4vw, 12px)" }}>
        {value}
      </div>
    </div>
  );
}

function fmtPct(v?: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return "—";
  return `${Math.round(v * 1000) / 10}%`;
}
