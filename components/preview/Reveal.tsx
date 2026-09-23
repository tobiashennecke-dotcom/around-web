"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
};

/**
 * Editorial reveal-on-scroll: content is fully visible by default (no-JS
 * and prefers-reduced-motion safe — see .pv-reveal in preview.css) and only
 * gains the fade/translate treatment once JS confirms motion is welcome.
 */
export function Reveal({ children, as = "div", className, delay = 0 }: Props) {
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    setEnhanced(true);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`pv-reveal ${visible ? "is-visible" : ""} ${className ?? ""}`.trim()}
      data-enhanced={enhanced}
      style={delay ? ({ "--pv-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
