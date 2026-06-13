"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LandingNav() {
  const pathname = usePathname();

  const navItems = [
    ["/", "Home"],
    ["/playground", "Playground"],
    ["/docs", "Docs"],
    ["/examples", "Examples"],
    ["/experiments", "Experiments"],
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
      <style>{`
        .axon-nav-link {
          position: relative;
          color: #8a8a94;
          text-decoration: none;
          font-size: 12px;
          font-weight: 650;
          padding: 8px 0;
          transition: color 0.18s ease;
        }

        .axon-nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 2px;
          height: 1px;
          border-radius: 999px;
          background: linear-gradient(90deg, #7c3aed, #ec4899);
          transform: scaleX(0);
          transform-origin: center;
          opacity: 0;
          transition: transform 0.18s ease, opacity 0.18s ease;
        }

        .axon-nav-link:hover {
          color: #f4f4f5;
        }

        .axon-nav-link:hover::after {
          transform: scaleX(1);
          opacity: 0.65;
        }

        .axon-nav-link-active {
          color: #f4f4f5;
        }

        .axon-nav-link-active::after {
          transform: scaleX(1);
          opacity: 1;
        }
      `}</style>

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
            overflow: "hidden",
            background: "#09090d",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 24px rgba(124,58,237,0.24)",
            flexShrink: 0,
          }}
        >
          <img
            src="/brand/axon-icon.png"
            alt="Axon Studio"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
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
        {navItems.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`axon-nav-link ${isActive(href) ? "axon-nav-link-active" : ""}`}
          >
            {label}
          </Link>
        ))}

        <a
          href="https://github.com/AyushKar2005"
          target="_blank"
          rel="noreferrer"
          className="axon-nav-link"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}