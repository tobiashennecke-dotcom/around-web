import { createImageUrlBuilder } from "@sanity/image-url";
import { sanity, sanityConfigured } from "@/lib/sanity/client";
import { HOMEPAGE_SETTINGS_QUERY } from "@/lib/sanity/queries";

/**
 * Homepage hero art direction (Homepage Hero Media). Deliberately its own
 * file, mirroring lib/stories-hub.ts's pattern for the storiesHub singleton -
 * kept separate from lib/content.ts so the existing homepage content query
 * (getHomepageContent/HOME_QUERY) is never touched by this work.
 */

const builder = sanityConfigured && sanity ? createImageUrlBuilder(sanity) : null;

const DEFAULT_OVERLAY = 45;

export type RawSanityImage = {
  asset?: { _ref?: string; _type?: string; _id?: string } | null;
  hotspot?: { x: number; y: number; height?: number; width?: number } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  alt?: string;
};

export type HomepageHero = {
  /** True only when the editor enabled imagery AND a valid desktop image exists. */
  enabled: boolean;
  /** 0-100, always a finite safe integer regardless of what Sanity returns. */
  overlay: number;
  desktop: RawSanityImage | null;
  /** Optional - absent unless the editor uploaded a dedicated mobile image. */
  mobile: RawSanityImage | null;
};

const EMPTY_HERO: HomepageHero = { enabled: false, overlay: DEFAULT_OVERLAY, desktop: null, mobile: null };

function clampOverlay(value: unknown): number {
  const num = typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_OVERLAY;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function isValidImage(image: unknown): image is RawSanityImage {
  if (!image || typeof image !== "object") return false;
  const asset = (image as RawSanityImage).asset;
  return Boolean(asset && (asset._ref || asset._id));
}

/**
 * Reads the published around-homepage singleton only. Never throws - any
 * Sanity/network failure, missing document, draft-only document (excluded by
 * both the exact undrafted _id filter and the client's perspective:"published"),
 * or malformed image quietly falls back to the disabled state so the existing
 * ink-colored hero always renders.
 */
export async function getHomepageHero(): Promise<HomepageHero> {
  if (!sanity) return EMPTY_HERO;

  try {
    const doc = await sanity.fetch(HOMEPAGE_SETTINGS_QUERY);
    if (!doc) return EMPTY_HERO;

    const desktop = isValidImage(doc.heroImage) ? doc.heroImage : null;
    const mobile = isValidImage(doc.mobileHeroImage) ? doc.mobileHeroImage : null;

    return {
      enabled: Boolean(doc.enableHeroImage) && Boolean(desktop),
      overlay: clampOverlay(doc.heroOverlay),
      desktop,
      mobile
    };
  } catch {
    return EMPTY_HERO;
  }
}

/**
 * Hotspot-aware, width-capped Sanity CDN URL for a hero crop. Forcing an
 * explicit aspect ratio (via width+height) is what makes the Content Lake API
 * actually honour the editor's hotspot/crop - a width-only request would just
 * scale the original proportionally and ignore it. auto("format") lets the
 * CDN serve AVIF/WebP to browsers that support them. Returns undefined (never
 * throws) if the builder or image is unavailable, so callers can skip
 * rendering that source entirely.
 */
export function heroImageUrl(image: RawSanityImage | null, width: number, aspectRatio: number, quality = 75): string | undefined {
  if (!builder || !image?.asset) return undefined;
  const height = Math.max(1, Math.round(width / aspectRatio));
  try {
    return builder.image(image).width(width).height(height).fit("crop").auto("format").quality(quality).url();
  } catch {
    return undefined;
  }
}
