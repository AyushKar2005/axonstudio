"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SiteNav from "@/components/site/SiteNav";

// ─── ALL sections — every sidebar item maps to one of these ids ───────────────
const sections = [
  // Getting started
  {
    id: "introduction",
    sidebarLabel: "Introduction",
    title: "Getting Started",
    kicker: "Onboarding",
    body: "Axon Studio is a browser-based neural-network lab for small 2D classification problems. It is built to show how a model learns, not just what it predicts at the end.",
    bullets: [
      "Train directly in the browser with TensorFlow.js",
      "Watch the decision field update epoch by epoch",
      "Inspect errors, confidence, weights, and saved snapshots",
    ],
  },
  {
    id: "quick-start",
    sidebarLabel: "Quick start",
    title: "Quick Start",
    kicker: "First run",
    body: "Open the playground, select a preset, press Run, then switch between boundary, errors, and gradients. Pause training and scrub the epoch timeline to inspect earlier states.",
    bullets: [
      "Use Space to run or pause",
      "Use S to step one epoch",
      "Use E / G / B to switch view modes",
    ],
  },
  {
    id: "choosing-a-dataset",
    sidebarLabel: "Choosing a dataset",
    title: "Choosing a Dataset",
    kicker: "Datasets",
    body: "Axon ships with four built-in datasets and supports custom CSV import. Pick a dataset based on the learning behavior you want to observe.",
    bullets: [
      "XOR — classic non-linear split; requires hidden layers",
      "Circles — fast convergence; great for boundary demos",
      "Spiral — stress test; reveals limits of small networks",
      "Blobs — linearly separable; sanity-check baseline",
    ],
  },
  {
    id: "training-your-first-model",
    sidebarLabel: "Training your first model",
    title: "Training Your First Model",
    kicker: "Step by step",
    body: "Select the Circles clean preset, leave all defaults, and press Run. The decision boundary will start forming within the first few epochs. Use the epoch timeline to scrub back and see how the boundary evolved.",
    bullets: [
      "Step 1 — Select a preset from the left panel",
      "Step 2 — Press Run or hit Space",
      "Step 3 — Watch the boundary form in the center canvas",
      "Step 4 — Pause and scrub the timeline to inspect earlier epochs",
    ],
  },
  {
    id: "keyboard-shortcuts",
    sidebarLabel: "Keyboard shortcuts",
    title: "Keyboard Shortcuts",
    kicker: "Power user",
    body: "All major playground actions are accessible from the keyboard. These shortcuts work as long as focus is not inside a text input.",
    bullets: [
      "Space — run / pause training",
      "R — reset model and data",
      "S — step one epoch",
      "E — switch to Errors view",
      "G — switch to Gradients view",
      "B — switch to Boundary view",
      "Ctrl / Cmd + S — save current run",
    ],
  },
  // Core concepts
  {
    id: "decision-boundary",
    sidebarLabel: "Decision boundary",
    title: "Decision Boundary",
    kicker: "Visual model output",
    body: "The central square maps the x₁ / x₂ input space. Purple and pink regions show the predicted class, while the contour line shows the 0.5 decision threshold.",
    bullets: [
      "Darker regions indicate stronger model confidence",
      "The contour line marks where the model changes class",
      "Train/test points show whether the boundary generalizes",
    ],
  },
  {
    id: "misclassification-lens",
    sidebarLabel: "Misclassification lens",
    title: "Misclassification Lens",
    kicker: "Debugging mistakes",
    body: "Errors view highlights points where the predicted label does not match the true label. This helps you understand whether the model is underfitting, overfitting, or confused by noisy data.",
    bullets: [
      "Orange rings mark visible errors on the canvas",
      "The right panel shows the total misclassified count",
      "Click any point to inspect its prediction path",
    ],
  },
  {
    id: "forward-pass-inspector",
    sidebarLabel: "Forward-pass inspector",
    title: "Forward-Pass Inspector",
    kicker: "Point-level transparency",
    body: "Click any data point on the boundary canvas to inspect how that specific input travels through the network layer by layer. The right panel shows activations, output score, and confidence.",
    bullets: [
      "Shows layer-by-layer activation values",
      "Displays predicted class and probability",
      "Works on both training and test points",
    ],
  },
  {
    id: "train-test-split",
    sidebarLabel: "Train/test split",
    title: "Train / Test Split",
    kicker: "Generalization",
    body: "Axon reports train accuracy, test accuracy, and generalization gap. This stops the playground from becoming a pure memorization demo.",
    bullets: [
      "Train accuracy measures fitted points",
      "Test accuracy uses held-out examples",
      "A large gap means the model may not generalize",
    ],
  },
  {
    id: "gradient-flow",
    sidebarLabel: "Gradient flow",
    title: "Gradient Flow",
    kicker: "Layer-level learning",
    body: "The Gradients view and layer flow indicators show how strongly each layer is updating. Use this to detect vanishing gradients or stuck layers.",
    bullets: [
      "Bright layers are updating strongly",
      "Dim layers may have vanishing gradients",
      "Switch to Gradients view with the G shortcut",
    ],
  },
  // Custom data
  {
    id: "csv-format",
    sidebarLabel: "CSV format",
    title: "CSV Format",
    kicker: "Custom datasets",
    body: "CSV mode supports two numeric input columns and one binary label column. Axon normalizes x/y values to [-1, 1] so the dataset fits the boundary canvas.",
    bullets: [
      "Expected columns: x, y, label",
      "Labels can be 0/1 or two distinct class names",
      "Invalid rows are counted and excluded before training",
    ],
  },
  {
    id: "column-detection",
    sidebarLabel: "Column detection",
    title: "Column Detection",
    kicker: "Auto-parsing",
    body: "When you upload a CSV, Axon scans the header row and attempts to auto-detect which columns are numeric inputs and which is the binary label. You can override the selection manually.",
    bullets: [
      "Numeric columns are auto-selected as x and y inputs",
      "The label column is inferred from binary-valued data",
      "Manual override is available if detection is wrong",
    ],
  },
  {
    id: "validation-states",
    sidebarLabel: "Validation states",
    title: "Validation States",
    kicker: "Error handling",
    body: "The CSV importer validates each row before training. Rows with non-numeric values, missing fields, or out-of-range labels are flagged and excluded.",
    bullets: [
      "Invalid row count is shown before training starts",
      "At least 20 valid rows are required to proceed",
      "Validation errors are shown inline in the importer",
    ],
  },
  {
    id: "normalization",
    sidebarLabel: "Normalization",
    title: "Normalization",
    kicker: "Data preprocessing",
    body: "All input features are normalized to [-1, 1] based on the min/max of the uploaded dataset. This ensures the values fit the boundary canvas and the model trains stably.",
    bullets: [
      "Min/max normalization applied per column",
      "Normalization is automatic and cannot be disabled",
      "Original values are preserved in the export JSON",
    ],
  },
  {
    id: "invalid-rows",
    sidebarLabel: "Invalid rows",
    title: "Invalid Rows",
    kicker: "Data quality",
    body: "Rows that fail validation are silently excluded from training. The importer shows a count of invalid rows so you can assess data quality before proceeding.",
    bullets: [
      "Rows with non-numeric inputs are excluded",
      "Rows with labels outside the detected class set are excluded",
      "Completely empty rows are ignored",
    ],
  },
  // Experiments
  {
    id: "compare-runs",
    sidebarLabel: "Compare runs",
    title: "Compare Runs",
    kicker: "Experiment tracking",
    body: "Save multiple runs from the playground and compare them on the Experiments page. Each saved run stores the architecture, dataset, metrics, and training config.",
    bullets: [
      "Save a run with Ctrl/Cmd+S or the save run button",
      "Up to 8 runs are stored in localStorage",
      "Compare accuracy, loss, and architecture side by side",
    ],
  },
  {
    id: "export-json",
    sidebarLabel: "Export JSON",
    title: "Export JSON",
    kicker: "Portable results",
    body: "Export a full experiment snapshot as JSON. The file includes metrics, architecture config, dataset metadata, snapshots, and saved runs.",
    bullets: [
      "Includes train/test accuracy and loss",
      "Captures the full layer configuration",
      "Useful for logging results outside the browser",
    ],
  },
  {
    id: "export-png",
    sidebarLabel: "Export PNG",
    title: "Export Boundary PNG",
    kicker: "Visual export",
    body: "Download a screenshot of the current decision boundary canvas as a PNG. The export captures the exact visual state including points, boundary regions, and confidence zones.",
    bullets: [
      "Exports at canvas resolution",
      "Captures the currently active view mode",
      "Useful for presentations and reports",
    ],
  },
  {
    id: "copy-summary",
    sidebarLabel: "Copy summary",
    title: "Copy Experiment Summary",
    kicker: "Quick share",
    body: "Copy a human-readable text summary of the current experiment to your clipboard. The summary includes dataset, architecture, epoch count, loss, and accuracy.",
    bullets: [
      "Paste into a notebook, README, or issue",
      "Includes all key metrics in plain text",
      "Generated from the current visible state",
    ],
  },
  {
    id: "saved-experiments",
    sidebarLabel: "Saved experiments",
    title: "Saved Experiments",
    kicker: "Run history",
    body: "The Experiments page shows all runs you have saved from the playground. Runs are stored in localStorage and persist across page refreshes.",
    bullets: [
      "Access saved runs from the top navigation",
      "Delete individual runs or clear all at once",
      "Export all runs as a single JSON file",
    ],
  },
];

// Map sidebar group titles to their item ids in order
const groups = [
  {
    title: "Getting started",
    ids: ["introduction", "quick-start", "choosing-a-dataset", "training-your-first-model", "keyboard-shortcuts"],
  },
  {
    title: "Core concepts",
    ids: ["decision-boundary", "misclassification-lens", "forward-pass-inspector", "train-test-split", "gradient-flow"],
  },
  {
    title: "Custom data",
    ids: ["csv-format", "column-detection", "validation-states", "normalization", "invalid-rows"],
  },
  {
    title: "Experiments",
    ids: ["compare-runs", "export-json", "export-png", "copy-summary", "saved-experiments"],
  },
];

// Build a quick lookup: id → section
const sectionById = Object.fromEntries(sections.map((s) => [s.id, s]));

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.36, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, y: -8, transition: { duration: 0.16 } },
};

export default function DocsPage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeId, setActiveId] = useState("introduction");
  const inputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Filter sections by search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((s) =>
      [s.title, s.sidebarLabel, s.kicker, s.body, ...s.bullets].join(" ").toLowerCase().includes(q)
    );
  }, [query]);

  // Track which section is visible for ToC highlight
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { root: el, rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    el.querySelectorAll("article[id]").forEach((a) => observer.observe(a));
    return () => observer.disconnect();
  }, [filtered]);

  // Smooth scroll to section when sidebar link is clicked
  const scrollTo = (id: string) => {
    const el = mainRef.current?.querySelector(`#${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% -10%, rgba(124,58,237,0.22), transparent 24%), radial-gradient(circle at 100% 70%, rgba(59,130,246,0.16), transparent 25%), #060607",
        color: "#f4f4f5",
        padding: "clamp(16px, 3vw, 34px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        style={{
          maxWidth: 1360,
          height: "calc(100vh - clamp(32px, 6vw, 68px))",
          minHeight: 520,
          margin: "0 auto",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "clamp(10px, 2vw, 18px)",
          background: "linear-gradient(180deg, rgba(16,16,20,0.96), rgba(8,8,10,0.97))",
          boxShadow: "0 0 80px rgba(124,58,237,0.16), 0 40px 120px rgba(0,0,0,0.54)",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto 1fr",
        }}
      >
        {/* Nav bar */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <SiteNav />
        </div>

        {/* Three-column body */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "clamp(180px, 22vw, 248px) 1fr clamp(160px, 18vw, 230px)",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* ── Left sidebar ─────────────────────────────────────────── */}
          <motion.aside
            initial={{ x: -18, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{
              borderRight: "1px solid rgba(255,255,255,0.06)",
              padding: "22px 16px 24px",
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          >
            {groups.map((g) => (
              <div key={g.title} style={{ marginBottom: 26 }}>
                <p
                  style={{
                    color: "#f4f4f5",
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 8,
                    padding: "0 8px",
                  }}
                >
                  {g.title}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {g.ids.map((id) => {
                    const sec = sectionById[id];
                    if (!sec) return null;
                    const isActive = activeId === id;
                    return (
                      <motion.button
                        key={id}
                        onClick={() => scrollTo(id)}
                        whileHover={{ x: 2 }}
                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                        style={{
                          background: isActive ? "rgba(124,58,237,0.12)" : "transparent",
                          border: "none",
                          textAlign: "left",
                          cursor: "pointer",
                          color: isActive ? "#c4b5fd" : "#4a4a58",
                          fontSize: 12,
                          padding: "6px 8px",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          width: "100%",
                          transition: "color 0.18s, background 0.18s",
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.color = "#a1a1aa";
                            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.color = "#4a4a58";
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                          }
                        }}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-dot"
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: "#a78bfa",
                              flexShrink: 0,
                              display: "inline-block",
                            }}
                            transition={{ type: "spring", stiffness: 420, damping: 28 }}
                          />
                        )}
                        {!isActive && <span style={{ width: 5, flexShrink: 0, display: "inline-block" }} />}
                        {sec.sidebarLabel}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.aside>

          {/* ── Main content ─────────────────────────────────────────── */}
          <section
            ref={mainRef}
            style={{
              padding: "0 clamp(22px, 4.5vw, 56px)",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#1e1e28 transparent",
              position: "relative",
            }}
          >
            {/* Sticky search bar */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 4,
                padding: "14px 0 10px",
                background: "linear-gradient(180deg, rgba(9,9,12,1) 65%, transparent)",
              }}
            >
              <motion.div
                animate={{
                  boxShadow: focused
                    ? "0 0 0 1.5px rgba(124,58,237,0.55), 0 4px 20px rgba(124,58,237,0.10)"
                    : "0 0 0 1px rgba(255,255,255,0.07)",
                  background: focused ? "rgba(255,255,255,0.042)" : "rgba(255,255,255,0.022)",
                }}
                transition={{ duration: 0.18 }}
                style={{ borderRadius: 10, position: "relative" }}
              >
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#42424e", pointerEvents: "none" }}
                >
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Search docs — CSV, gradients, exports..."
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    color: "#f4f4f5",
                    outline: "none",
                    padding: "0 34px 0 34px",
                    fontSize: 13,
                  }}
                />
                <AnimatePresence>
                  {query && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.75 }}
                      transition={{ duration: 0.14 }}
                      onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                      style={{
                        position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 5,
                        color: "#71717a", cursor: "pointer", padding: "2px 7px", fontSize: 10,
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
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.16 }}
                    style={{ fontSize: 11, color: "#42424e", marginTop: 5, letterSpacing: "0.04em" }}
                  >
                    {filtered.length === 0
                      ? "No results"
                      : `${filtered.length} section${filtered.length !== 1 ? "s" : ""} found`}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Hero blurb */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
              style={{ padding: "18px 0 0", maxWidth: 720 }}
            >
              <p style={{ color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.18em", fontSize: 10, fontWeight: 800, marginBottom: 12 }}>
                Axon documentation
              </p>
              <h1 style={{ fontSize: "clamp(26px, 3.8vw, 50px)", letterSpacing: "-0.065em", lineHeight: 1.02, marginBottom: 12 }}>
                Understand the model,<br />not just the output.
              </h1>
              <p style={{ color: "#6a6a78", lineHeight: 1.75, fontSize: 14, marginBottom: 28 }}>
                A guided manual for training, debugging, comparing, and exporting small neural networks in Axon Studio.
              </p>
            </motion.div>

            {/* Section articles */}
            <div style={{ paddingBottom: 100 }}>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 12,
                      padding: "26px 22px",
                      color: "#42424e",
                      fontSize: 14,
                      marginTop: 8,
                    }}
                  >
                    No docs matched{" "}
                    <span style={{ color: "#8a8a94" }}>"{query}"</span>. Try CSV, errors, gradients, or export.
                  </motion.div>
                ) : (
                  filtered.map((s, i) => (
                    <motion.article
                      key={s.id}
                      id={s.id}
                      custom={i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{
                        padding: "26px 0",
                        borderTop: "1px solid rgba(255,255,255,0.07)",
                        scrollMarginTop: 70, // clears the sticky search bar
                      }}
                    >
                      <p style={{ color: "#42424e", fontSize: 10, marginBottom: 7, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {s.kicker}
                      </p>
                      <h2 style={{ fontSize: "clamp(17px, 2.4vw, 26px)", letterSpacing: "-0.038em", marginBottom: 10, color: "#f0f0f2" }}>
                        {s.title}
                      </h2>
                      <p style={{ color: "#c4c4cc", lineHeight: 1.75, fontSize: 14, marginBottom: 12 }}>{s.body}</p>
                      <ul style={{ paddingLeft: 16, margin: 0 }}>
                        {s.bullets.map((b) => (
                          <li
                            key={b}
                            style={{ color: "#5a5a68", lineHeight: 1.85, fontSize: 13, marginBottom: 3 }}
                          >
                            {b}
                          </li>
                        ))}
                      </ul>
                    </motion.article>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* ── Right ToC ────────────────────────────────────────────── */}
          <motion.aside
            initial={{ x: 18, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.16, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              padding: "22px 18px 24px",
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          >
            <p style={{ color: "#f4f4f5", fontSize: 11, marginBottom: 14, letterSpacing: "0.04em", fontWeight: 650 }}>
              On this page
            </p>
            <div
              style={{
                borderLeft: "1.5px solid rgba(255,255,255,0.07)",
                paddingLeft: 13,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {sections.map((s, i) => {
                const isActive = activeId === s.id;
                return (
                  <motion.button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: isActive ? "#d4d4d8" : "#3e3e4c",
                      fontSize: 11,
                      lineHeight: 1.5,
                      padding: "2px 0",
                      transition: "color 0.18s",
                      fontWeight: isActive ? 600 : 400,
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#8a8a94"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#3e3e4c"; }}
                  >
                    {s.sidebarLabel}
                  </motion.button>
                );
              })}
            </div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              style={{ marginTop: 24 }}
            >
              <Link
                href="/playground"
                style={{
                  display: "block",
                  color: "#f4f4f5",
                  textDecoration: "none",
                  padding: "11px 14px",
                  borderRadius: 10,
                  background: "rgba(124,58,237,0.11)",
                  border: "1px solid rgba(167,139,250,0.2)",
                  fontWeight: 800,
                  fontSize: 12,
                  textAlign: "center",
                }}
              >
                Open playground →
              </Link>
            </motion.div>
          </motion.aside>
        </div>
      </motion.div>
    </main>
  );
}
