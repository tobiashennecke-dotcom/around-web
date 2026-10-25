"use client";

import { useEffect, useState } from "react";
import { AroundWordmark } from "@/components/AroundLogo";

/**
 * The header starts over the hero photograph and becomes opaque as soon as
 * the reader scrolls onto the warm-white editorial sections. /preview only.
 */
export function PreviewHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    setEnhanced(true);
    const update = () => setScrolled(window.scrollY > 36);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className="pv-header" data-scrolled={scrolled} data-enhanced={enhanced}>
      <div className="container pv-headerInner">
        <a href="#top" className="wordmark" aria-label="AROUND — zurück nach oben">
          <AroundWordmark className="wordmarkLogo" />
        </a>
        <nav className="pv-headerNav" aria-label="Preview-Navigation">
          <a href="#about">ABOUT</a>
          <a href="#contact">CONTACT</a>
        </nav>
      </div>
    </header>
  );
}
