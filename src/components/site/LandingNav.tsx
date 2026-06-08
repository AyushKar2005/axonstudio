"use client";

import Link from "next/link";

export default function LandingNav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        height: 56,
        width: "min(1120px, calc(100% - 48px))",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(10,10,12,0.72)",
        backdropFilter: "blur(18px)",
        borderRadius: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: "linear-gradient(135deg,#7c3aed,#ec4899)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 800,
          }}
        >
          a
        </div>

        <span
          style={{
            color: "#f4f4f5",
            fontWeight: 750,
            fontSize: 14,
            letterSpacing: "-0.02em",
          }}
        >
          axon studio
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {[
          ["/", "Home"],
          ["/playground", "Playground"],
          ["/docs", "Docs"],
          ["/examples", "Examples"],
          ["/experiments", "Experiments"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            style={{
              color: "#8a8a94",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 650,
            }}
          >
            {label}
          </Link>
        ))}

        <a
          href="https://github.com/AyushKar2005"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#8a8a94",
            textDecoration: "none",
            fontSize: 12,
            fontWeight: 650,
          }}
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}