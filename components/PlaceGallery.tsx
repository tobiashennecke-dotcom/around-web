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
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);

  const single = items.length < 2;

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

  if (!items.length) return null;

  const active = items[activeIndex] || items[0];

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    setActiveIndex(clamped);
    slideRefs.current[clamped]?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndex - 1); }
    else if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndex + 1); }
  }

  if (single) {
    const layout = resolvedMediaLayout(items[0]);
    return (
      <div className="placeGallery placeGallery--single">
        <figure className={`placeMedia placeMedia--${layout}`}>
          <div className="placeMediaFrame" style={imageStyle(items[0])}>
            <img src={items[0].url} alt={items[0].alt || `${title} – Bild 1`} loading="lazy" />
          </div>
          <Caption item={items[0]} />
        </figure>
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
            return (
              <figure
                className={`placeGallerySlide placeMedia placeMedia--${layout}`}
                key={`${item.url}-${index}`}
                ref={el => { slideRefs.current[index] = el; }}
              >
                <div className="placeMediaFrame" style={imageStyle(item)}>
                  <img src={item.url} alt={item.alt || `${title} – Bild ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} />
                </div>
                <Caption item={item} />
              </figure>
            );
          })}
        </div>
        <div className="placeGalleryCounter" aria-hidden="true">
          {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
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
            <div className="placeMediaFrame" style={imageStyle(active)}>
              <img src={active.url} alt={active.alt || `${title} – Bild ${activeIndex + 1}`} loading="eager" />
            </div>
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
    </div>
  );
}
