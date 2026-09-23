"use client";

import { useEffect, useState } from "react";

/**
 * The header starts over the hero photograph and becomes opaque as soon as
 * the reader scrolls onto the warm-white editorial sections. /preview only.
 */
export function PreviewHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 36);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className="pv-header" data-scrolled={scrolled}>
      <div className="container pv-headerInner">
        <a href="#top" className="wordmark" aria-label="AROUND — zurück nach oben">
          ar<span className="o">o</span>und
        </a>
        <nav className="pv-headerNav" aria-label="Preview-Navigation">
          <a href="#about">ABOUT</a>
          <a href="#contact">CONTACT</a>
        </nav>
      </div>
    </header>
  );
}
