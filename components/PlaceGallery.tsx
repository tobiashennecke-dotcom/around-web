"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { PlaceMediaItem, PlaceMediaLayout } from "@/lib/types";

function resolvedMediaLayout(item: PlaceMediaItem): Exclude<PlaceMediaLayout,"auto"> | "standard" {
  if (item.layout && item.layout !== "auto") return item.layout;
  const ratio = item.aspectRatio || (item.width && item.height ? item.width / item.height : undefined);
  if (ratio && ratio < .82) return "portrait";
  if (ratio && ratio > 1.55) return "wide";
  return "standard";
}

function imageStyle(item: PlaceMediaItem): CSSProperties | undefined {
  if (!item.width || !item.height) return undefined;
  return { aspectRatio: `${item.width} / ${item.height}` };
}

function Caption({ item }: { item: PlaceMediaItem }) {
  if (!item.caption && !item.credit) return null;
  return (
    <figcaption>
      <span>{item.caption || ""}</span>
      {item.credit ? <small>{item.credit}</small> : null}
    </figcaption>
  );
}

export function PlaceGallery({ title, items }: { title: string; items: PlaceMediaItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const lightboxTrackRef = useRef<HTMLDivElement>(null);
  const lightboxSlideRefs = useRef<Array<HTMLElement | null>>([]);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const single = items.length < 2;

  // Track which slide is snapped into view as the user swipes the main mobile gallery.
  useEffect(() => {
    if (single) return;
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
  }, [single, items.length]);

  // Same tracking inside the lightbox's own horizontal track, only while it's open.
  useEffect(() => {
    if (!lightboxOpen) return;
    const track = lightboxTrackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      entries => {
        const mostVisible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!mostVisible) return;
        const index = lightboxSlideRefs.current.findIndex(el => el === mostVisible.target);
        if (index !== -1) setActiveIndex(index);
      },
      { root: track, threshold: [0.6] }
    );

    lightboxSlideRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [lightboxOpen]);

  // Jump the lightbox track to the already-active image the instant it opens,
  // and move focus in; restore focus to the trigger on close.
  useEffect(() => {
    const index = activeIndexRef.current;
    const frame = requestAnimationFrame(() => {
      if (lightboxOpen) {
        lightboxSlideRefs.current[index]?.scrollIntoView({ inline: "nearest", block: "nearest" });
        lightboxCloseRef.current?.focus();
      } else {
        triggerRef.current?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [lightboxOpen]);

  // Lock page scroll while the lightbox is open.
  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [lightboxOpen]);

  // ESC + arrow keys work regardless of which control inside the lightbox has focus.
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setLightboxOpen(false); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndex - 1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndex + 1); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, activeIndex, items.length]);

  if (!items.length) return null;

  const active = items[activeIndex] || items[0];

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    setActiveIndex(clamped);
    slideRefs.current[clamped]?.scrollIntoView({ inline: "nearest", block: "nearest" });
    lightboxSlideRefs.current[clamped]?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }

  function openLightbox(index: number, event: { currentTarget: HTMLElement }) {
    triggerRef.current = event.currentTarget;
    setActiveIndex(index);
    setLightboxOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndex - 1); }
    else if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndex + 1); }
  }

  const lightbox = lightboxOpen ? (
    <div
      className="placeLightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} – Vollbildansicht, Bild ${activeIndex + 1} von ${items.length}`}
    >
      <button type="button" ref={lightboxCloseRef} className="placeLightboxClose" onClick={() => setLightboxOpen(false)} aria-label="Vollbildansicht schließen">×</button>
      <div className="placeLightboxCounter" aria-hidden="true">{String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</div>
      {items.length > 1 ? (
        <button type="button" className="placeLightboxArrow placeLightboxArrow--prev" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Vorheriges Bild">‹</button>
      ) : null}
      <div className="placeLightboxTrack" ref={lightboxTrackRef}>
        {items.map((item, index) => (
          <div
            className="placeLightboxSlide"
            key={`${item.url}-${index}`}
            ref={el => { lightboxSlideRefs.current[index] = el; }}
            onMouseDown={event => { if (event.target === event.currentTarget) setLightboxOpen(false); }}
          >
            <img src={item.url} alt={item.alt || `${title} – Bild ${index + 1}`} loading={index === activeIndex ? "eager" : "lazy"} />
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <button type="button" className="placeLightboxArrow placeLightboxArrow--next" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === items.length - 1} aria-label="Nächstes Bild">›</button>
      ) : null}
      {(active.caption || active.credit) ? (
        <figcaption className="placeLightboxCaption">
          <span>{active.caption || ""}</span>
          {active.credit ? <small>{active.credit}</small> : null}
        </figcaption>
      ) : null}
    </div>
  ) : null;

  if (single) {
    const layout = resolvedMediaLayout(items[0]);
    return (
      <div className="placeGallery placeGallery--single">
        <figure className={`placeMedia placeMedia--${layout}`}>
          <button type="button" className="placeGalleryImageButton" onClick={event => openLightbox(0, event)} aria-label={`${title} – Bild vollständig anzeigen`}>
            <div className="placeMediaFrame" style={imageStyle(items[0])}>
              <img src={items[0].url} alt={items[0].alt || `${title} – Bild 1`} loading="lazy" />
            </div>
          </button>
          <Caption item={items[0]} />
        </figure>
        {lightbox}
      </div>
    );
  }

  const activeLayout = resolvedMediaLayout(active);

  return (
    <div className="placeGallery">
      <div className="placeGalleryMobile" role="group" aria-roledescription="carousel" aria-label={`${title} Galerie`}>
        <div className="placeGalleryTrack" ref={trackRef}>
          {items.map((item, index) => {
            const layout = resolvedMediaLayout(item);
            const shape = layout === "portrait" ? "portrait" : "landscape";
            return (
              <figure
                className={`placeGallerySlide placeGallerySlide--${shape} placeMedia`}
                key={`${item.url}-${index}`}
                ref={el => { slideRefs.current[index] = el; }}
              >
                <button type="button" className="placeGalleryImageButton" onClick={event => openLightbox(index, event)} aria-label={`Bild ${index + 1} von ${items.length} vollständig anzeigen`}>
                  <div className="placeMediaFrame">
                    <img src={item.url} alt={item.alt || `${title} – Bild ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} />
                    <span className="placeGallerySlideCounter" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</span>
                  </div>
                </button>
                <Caption item={item} />
              </figure>
            );
          })}
        </div>
      </div>

      <div
        className="placeGalleryDesktop"
        role="group"
        aria-roledescription="carousel"
        aria-label={`${title} Galerie`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="placeGalleryStageRow">
          <button type="button" className="placeGalleryArrow" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} aria-label="Vorheriges Bild">‹</button>
          <figure className={`placeMedia placeMedia--${activeLayout} placeGalleryStage`}>
            <button type="button" className="placeGalleryImageButton" onClick={event => openLightbox(activeIndex, event)} aria-label={`Bild ${activeIndex + 1} von ${items.length} vollständig anzeigen`}>
              <div className="placeMediaFrame" style={imageStyle(active)}>
                <img src={active.url} alt={active.alt || `${title} – Bild ${activeIndex + 1}`} loading="eager" />
              </div>
            </button>
          </figure>
          <button type="button" className="placeGalleryArrow" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === items.length - 1} aria-label="Nächstes Bild">›</button>
        </div>
        <Caption item={active} />
        <div className="placeGalleryThumbs">
          {items.map((item, index) => (
            <button
              type="button"
              key={`${item.url}-${index}`}
              className={`placeGalleryThumb ${index === activeIndex ? "placeGalleryThumb--active" : ""}`}
              onClick={() => goTo(index)}
              aria-label={`Bild ${index + 1} von ${items.length} anzeigen`}
              aria-current={index === activeIndex}
            >
              <img src={item.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </div>
      {lightbox}
    </div>
  );
}
