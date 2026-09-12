"use client";

import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { MediaLightbox } from "@/components/MediaLightbox";
import type { MediaItem } from "@/lib/types";

const DESKTOP_MAX = 6;
const MOBILE_MAX = 4;

function hotspotStyle(item: MediaItem): CSSProperties | undefined {
  if (!item.hotspot) return undefined;
  const x = Math.round(item.hotspot.x * 100);
  const y = Math.round(item.hotspot.y * 100);
  return { objectPosition: `${x}% ${y}%` };
}

/**
 * The global AROUND media grid: uniform 4:3 tiles, hotspot-aware cropping,
 * a +N "view all" tile when there are more images than fit, and a shared
 * fullscreen viewer (MediaLightbox) that always shows real proportions.
 * Reusable across PLAY, STAY, generic Places and Story galleries.
 */
export function MediaGallery({ items, title }: { items: MediaItem[]; title: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (!items.length) return null;

  const total = items.length;
  const visible = items.slice(0, DESKTOP_MAX);
  const desktopOverlayIndex = total > DESKTOP_MAX ? DESKTOP_MAX - 1 : -1;
  const mobileOverlayIndex = total > MOBILE_MAX ? MOBILE_MAX - 1 : -1;

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    const trigger = lightboxIndex !== null ? triggerRefs.current[lightboxIndex] : null;
    setLightboxIndex(null);
    trigger?.focus();
  }

  return (
    <div className="mediaGallery">
      <div className="mediaGalleryGrid" data-count={Math.min(total, DESKTOP_MAX)}>
        {visible.map((item, index) => {
          const isDesktopOverlay = index === desktopOverlayIndex;
          const isMobileOverlay = index === mobileOverlayIndex;
          const desktopRemaining = total - (DESKTOP_MAX - 1);
          const mobileRemaining = total - (MOBILE_MAX - 1);
          const label = isDesktopOverlay || isMobileOverlay
            ? `Alle ${total} Bilder ansehen`
            : `Bild ${index + 1} von ${total} vollständig anzeigen`;

          return (
            <button
              type="button"
              key={`${item.url}-${index}`}
              className="mediaGalleryTile"
              ref={el => { triggerRefs.current[index] = el; }}
              onClick={() => openLightbox(index)}
              aria-label={label}
            >
              <img
                src={item.url}
                alt={item.alt || `${title} – Bild ${index + 1}`}
                loading={index < 3 ? "eager" : "lazy"}
                style={hotspotStyle(item)}
              />
              {isDesktopOverlay ? (
                <span className="mediaGalleryOverlay mediaGalleryOverlay--desktop" aria-hidden="true">
                  <strong>+{desktopRemaining}</strong>
                  <small>BILDER</small>
                  <em>ALLE ANSEHEN</em>
                </span>
              ) : null}
              {isMobileOverlay ? (
                <span className="mediaGalleryOverlay mediaGalleryOverlay--mobile" aria-hidden="true">
                  <strong>+{mobileRemaining}</strong>
                  <small>BILDER</small>
                  <em>ALLE ANSEHEN</em>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {lightboxIndex !== null ? (
        <MediaLightbox items={items} initialIndex={lightboxIndex} title={title} onClose={closeLightbox} />
      ) : null}
    </div>
  );
}
