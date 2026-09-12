"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/types";

/**
 * Global AROUND fullscreen viewer. Always shows the image's real proportions
 * (object-fit:contain) - the tile grid may crop, fullscreen never does.
 * Used by MediaGallery; not meant to be mounted directly by page code.
 */
export function MediaLightbox({
  items,
  initialIndex,
  title,
  onClose
}: {
  items: MediaItem[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeIndexRef = useRef(initialIndex);
  activeIndexRef.current = activeIndex;

  const active = items[activeIndex] || items[0];

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    setActiveIndex(clamped);
    slideRefs.current[clamped]?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }

  // Snap to the requested slide and move focus in, once, on mount.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      slideRefs.current[activeIndexRef.current]?.scrollIntoView({ inline: "nearest", block: "nearest" });
      closeRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track which slide is snapped into view as the user swipes.
  useEffect(() => {
    if (items.length < 2) return;
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      entries => {
        const mostVisible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;
        const index = slideRefs.current.findIndex(el => el === mostVisible.target);
        if (index !== -1) setActiveIndex(index);
      },
      { root: track, threshold: [0.6] }
    );
    slideRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [items.length]);

  // Lock page scroll while open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  // ESC + arrow keys, regardless of which control has focus.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndexRef.current - 1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndexRef.current + 1); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <div
      className="mediaLightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} – Vollbildansicht, Bild ${activeIndex + 1} von ${items.length}`}
    >
      <button type="button" ref={closeRef} className="mediaLightboxClose" onClick={onClose} aria-label="Vollbildansicht schließen">×</button>
      <div className="mediaLightboxCounter" aria-hidden="true">{String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</div>
      {items.length > 1 ? (
        <button type="button" className="mediaLightboxArrow mediaLightboxArrow--prev" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Vorheriges Bild">‹</button>
      ) : null}
      <div className="mediaLightboxTrack" ref={trackRef}>
        {items.map((item, index) => (
          <div
            className="mediaLightboxSlide"
            key={`${item.url}-${index}`}
            ref={el => { slideRefs.current[index] = el; }}
            onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
          >
            <img src={item.url} alt={item.alt || `${title} – Bild ${index + 1}`} loading={index === activeIndex ? "eager" : "lazy"} />
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <button type="button" className="mediaLightboxArrow mediaLightboxArrow--next" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === items.length - 1} aria-label="Nächstes Bild">›</button>
      ) : null}
      {(active.caption || active.credit) ? (
        <figcaption className="mediaLightboxCaption">
          <span>{active.caption || ""}</span>
          {active.credit ? <small>{active.credit}</small> : null}
        </figcaption>
      ) : null}
    </div>
  );
}
