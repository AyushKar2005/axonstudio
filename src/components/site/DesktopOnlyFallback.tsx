export default function DesktopOnlyFallback() {
  return (
    <div className="axon-desktop-fallback">
      <div
        style={{
          maxWidth: 520,
          padding: 28,
          border: "1px solid #1f1f25",
          borderRadius: 18,
          background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
          textAlign: "center",
          boxShadow: "0 24px 90px rgba(0,0,0,0.32)",
        }}
      >
        <div style={{ color: "#a78bfa", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 800 }}>
          Desktop lab
        </div>
        <h1 style={{ color: "#f4f4f5", fontSize: 34, letterSpacing: "-0.055em", marginTop: 14, marginBottom: 12 }}>
          Axon Playground needs a wider screen.
        </h1>
        <p style={{ color: "#8a8a94", fontSize: 14, lineHeight: 1.7 }}>
          The lab uses resizable panels, a decision boundary canvas, timelines, and inspectors. Open it on a desktop or tablet landscape view for the full experience.
        </p>
      </div>
    </div>
  );
}
