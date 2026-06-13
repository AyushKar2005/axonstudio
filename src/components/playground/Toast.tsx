"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type ToastVariant = "success" | "error" | "loading" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

const ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error:   "✕",
  loading: "○",
  info:    "↗",
};

const COLORS: Record<ToastVariant, { border: string; accent: string }> = {
  success: { border: "rgba(52,211,153,0.22)",  accent: "#34d399" },
  error:   { border: "rgba(248,113,113,0.22)", accent: "#f87171" },
  loading: { border: "rgba(167,139,250,0.22)", accent: "#a78bfa" },
  info:    { border: "rgba(167,139,250,0.22)", accent: "#a78bfa" },
};

const DURATION: Record<ToastVariant, number> = {
  success: 2800,
  error:   3400,
  loading: 99999, // stays until replaced
  info:    2800,
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter  = useRef(0);
  const timers   = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
    const dur = DURATION[variant];
    if (dur < 99999) timers.current[id] = setTimeout(() => dismiss(id), dur);
    return id;
  }, [dismiss]);

  // Replace a toast in-place — used to swap loading → success/error
  const replace = useCallback((id: number, message: string, variant: ToastVariant = "success") => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, message, variant } : t));
    const dur = DURATION[variant];
    if (dur < 99999) timers.current[id] = setTimeout(() => dismiss(id), dur);
  }, [dismiss]);

  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  return { toasts, show, replace, dismiss };
}

export function ToastContainer({ toasts }: { toasts: ReturnType<typeof useToast>["toasts"] }) {
  if (toasts.length === 0) return null;

  return (
    <>
      <div style={{
        position: "fixed", bottom: 28, right: 28,
        zIndex: 9999, display: "flex", flexDirection: "column",
        gap: 8, pointerEvents: "none",
      }}>
        {toasts.map((t) => {
          const c = COLORS[t.variant];
          const isLoading = t.variant === "loading";
          return (
            <div key={t.id} style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(12,12,16,0.97)",
              border: `1px solid ${c.border}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset",
              backdropFilter: "blur(14px)",
              animation: "axon-toast-in 0.2s cubic-bezier(0.22,1,0.36,1) both",
              minWidth: 200, maxWidth: 300,
              position: "relative", overflow: "hidden",
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%",
                background: `${c.accent}14`, border: `1px solid ${c.accent}38`,
                display: "grid", placeItems: "center",
                fontSize: 10, color: c.accent, flexShrink: 0, fontWeight: 700,
                animation: isLoading ? "axon-spin 1s linear infinite" : "none",
              }}>
                {ICONS[t.variant]}
              </span>
              <span style={{
                fontSize: 12, fontFamily: "'Syne', sans-serif",
                fontWeight: 600, color: "#d4d4d8",
                letterSpacing: "0.01em", lineHeight: 1.4, flex: 1,
              }}>
                {t.message}
              </span>
              {!isLoading && (
                <span style={{
                  position: "absolute", bottom: 0, left: 0,
                  height: 2, width: "100%", background: c.accent,
                  opacity: 0.35, borderRadius: "0 0 10px 10px",
                  animation: `axon-bar ${DURATION[t.variant]}ms linear both`,
                  transformOrigin: "left",
                }} />
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes axon-toast-in {
          from { opacity:0; transform:translateY(8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes axon-bar {
          from { transform:scaleX(1); }
          to   { transform:scaleX(0); }
        }
        @keyframes axon-spin {
          to { transform:rotate(360deg); }
        }
      `}</style>
    </>
  );
}
