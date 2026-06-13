import { Suspense } from "react";
import PlaygroundLayout from "@/components/playground/PlaygroundLayout";

function PlaygroundFallback() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#08080a",
        color: "#f4f4f5",
        display: "grid",
        placeItems: "center",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.025)",
          borderRadius: 14,
          padding: "18px 22px",
          color: "#8a8a94",
          fontSize: 13,
          letterSpacing: "0.04em",
        }}
      >
        Loading playground...
      </div>
    </main>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<PlaygroundFallback />}>
      <PlaygroundLayout />
    </Suspense>
  );
}