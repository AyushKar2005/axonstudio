"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import SiteNav from "@/components/site/SiteNav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 18% 0%, rgba(124,58,237,0.16), transparent 26%), radial-gradient(circle at 84% 18%, rgba(236,72,153,0.12), transparent 30%), #08080a",
        color: "#f4f4f5",
        fontFamily: "var(--font-geist-sans), Inter, system-ui, sans-serif",
      }}
    >
      <SiteNav />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      >
        {children}
      </motion.div>
    </main>
  );
}

export const pageWrap = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "clamp(48px, 7vw, 92px) clamp(20px, 4vw, 40px)",
};

export const eyebrow = {
  color: "#a78bfa",
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  fontWeight: 750,
};

export const heroTitle = {
  fontSize: "clamp(46px, 8vw, 104px)",
  lineHeight: 0.88,
  letterSpacing: "-0.075em",
  marginTop: 20,
  marginBottom: 22,
  fontWeight: 850,
  maxWidth: 980,
};

export const heroCopy = {
  maxWidth: 760,
  color: "#8f8f9b",
  fontSize: "clamp(16px, 2vw, 20px)",
  lineHeight: 1.7,
};

export const card = {
  border: "1px solid #1a1a1e",
  background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
  borderRadius: 20,
  boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 70px rgba(0,0,0,0.24)",
};