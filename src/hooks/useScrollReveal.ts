"use client";
import { useEffect } from "react";

export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) =>
      observer.observe(el)
    );
    return () => observer.disconnect();
  }, []);
}

export function revealStyle(delay = 0): React.CSSProperties {
  return {
    opacity: 0,
    transform: "translateY(28px)",
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  };
}
