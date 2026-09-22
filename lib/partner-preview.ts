import { draftMode } from "next/headers";
import { sanity, sanityConfigured } from "@/lib/sanity/client";
import { PARTNER_PREVIEW_QUERY } from "@/lib/sanity/queries";
import { heroImageUrl, type RawSanityImage } from "@/lib/homepage-hero";
import { toCard } from "@/lib/content";
import { typeLabel } from "@/components/ContentCard";
import {
  previewContent,
  type Accent,
  type AroundItConnection,
  type Chapter,
  type FieldStoryCard,
  type JourneyStep,
  type PartnerPreviewContent,
  type PreviewMedia,
  type Principle,
  type ResolvedCard
} from "@/lib/preview-content";

/**
 * Fetch/merge layer for the /preview onepager's `partnerPreview` Sanity
 * singleton (around-partner-preview). getPartnerPreview() is the only
 * export the page needs: it returns a complete PartnerPreviewContent,
 * merging the Sanity document over lib/preview-content.ts's local fallback
 * field-by-field, so an editor never needs to fill in the whole document
 * before anything renders, and the page keeps working exactly as before
 * when Sanity is unconfigured or the document doesn't exist yet.
 *
 * Draft preview: when Next's draft mode is enabled (via the existing
 * /api/draft-mode/enable route, e.g. from Sanity's Presentation tool) and
 * SANITY_VIEWER_TOKEN is set, this reads with perspective:"drafts" so
 * unpublished edits are visible to the editor. Every other visitor always
 * gets the published-only client - unpublished content is never exposed
 * publicly. Reading draftMode() here opts /preview out of static rendering
 * (Next can't know ahead of time whether a given request carries the draft
 * cookie), which is the intended, accepted tradeoff for a low-traffic,
 * link-only page that needs live draft preview.
 */

async function getClient() {
  if (!sanity || !sanityConfigured) return null;
  const draft = await draftMode();
  if (draft.isEnabled && process.env.SANITY_VIEWER_TOKEN) {
    return sanity.withConfig({ token: process.env.SANITY_VIEWER_TOKEN, perspective: "drafts", useCdn: false });
  }
  return sanity;
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function arr<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function hasAsset(image: unknown): image is RawSanityImage {
  if (!image || typeof image !== "object") return false;
  const asset = (image as RawSanityImage).asset;
  return Boolean(asset && (asset._ref || asset._id));
}

function resolveMedia(rawImage: unknown, width: number, aspect: number, placeholderLabel: string | undefined, fallback: PreviewMedia): PreviewMedia {
  if (hasAsset(rawImage)) {
    const url = heroImageUrl(rawImage, width, aspect);
    if (url) return { src: url, alt: (rawImage as { alt?: string }).alt || placeholderLabel || "" };
  }
  if (placeholderLabel) return { assetNeeded: "sanity-missing-image", label: placeholderLabel };
  return fallback;
}

type RawTeaser = {
  ref?: unknown;
  titleOverride?: string;
  kickerOverride?: string;
  descriptionOverride?: string;
  accent?: Accent;
  image?: unknown;
  placeholderLabel?: string;
} | null | undefined;

/**
 * Resolves one editorialTeaser field: a reference-derived card (via the
 * same toCard() every other ContentCard in the app uses), the editor's
 * overrides on top, then the caller-supplied fallback for whatever's still
 * missing. See sanity/schemaTypes/partnerPreview.ts's editorialTeaserFields().
 */
function resolveTeaser(raw: RawTeaser, width: number, aspect: number, fallback: ResolvedCard): ResolvedCard {
  const card = raw?.ref ? toCard(raw.ref) : null;

  const title = str(raw?.titleOverride, card?.title ?? fallback.title);
  const kicker = str(raw?.kickerOverride, card?.kicker ?? fallback.kicker);
  const description = str(raw?.descriptionOverride, card?.description ?? fallback.description ?? "") || undefined;
  const accent: Accent = raw?.accent || card?.accent || fallback.accent;
  const stamp = card ? typeLabel(card) : fallback.stamp;

  let media: PreviewMedia | undefined;
  if (hasAsset(raw?.image)) {
    const url = heroImageUrl(raw!.image as RawSanityImage, width, aspect);
    if (url) media = { src: url, alt: (raw!.image as { alt?: string }).alt || title };
  }
  if (!media && card?.image) media = { src: card.image, alt: title };
  if (!media && raw?.placeholderLabel) media = { assetNeeded: "sanity-missing-image", label: raw.placeholderLabel };
  if (!media) media = fallback.media;

  return { stamp, kicker, title, description, accent, media };
}

const EMPTY_TEASER_FALLBACK: ResolvedCard = { stamp: "", kicker: "", title: "", accent: "lime", media: undefined };

function mapStep(raw: Record<string, unknown>): JourneyStep {
  const kind = (str(raw?.kind, "card") as JourneyStep["kind"]) || "card";
  const label = str(raw?.label, "");
  const copy = str(raw?.copy, "");

  if (kind === "discover") {
    return { label, copy, kind, filters: arr<string>(raw?.filters, []) };
  }
  if (kind === "story") {
    const teaser = resolveTeaser(raw?.item as RawTeaser, 760, 4 / 3, { ...EMPTY_TEASER_FALLBACK, stamp: "STORY", accent: "blue" });
    return { label, copy, kind, story: { kicker: teaser.kicker, title: teaser.title, deck: teaser.description ?? "" } };
  }
  const teaser = resolveTeaser(raw?.item as RawTeaser, 760, 4 / 3, {
    ...EMPTY_TEASER_FALLBACK,
    stamp: kind === "save" ? "PLAY" : "PLACE"
  });
  return { label, copy, kind: kind === "save" ? "save" : "card", card: teaser };
}

function mapFieldStoryCard(raw: Record<string, unknown>): FieldStoryCard {
  const role = raw?.role === "lead" ? "lead" : "secondary";
  const width = role === "lead" ? 900 : 700;
  const aspect = role === "lead" ? 4 / 5 : 4 / 3;
  const teaser = resolveTeaser(raw as RawTeaser, width, aspect, EMPTY_TEASER_FALLBACK);
  return {
    role,
    category: teaser.kicker,
    title: teaser.title,
    media: teaser.media ?? { assetNeeded: "sanity-missing-image", label: teaser.title || "Image" },
    accent: teaser.accent
  };
}

function mapConnection(raw: Record<string, unknown>): AroundItConnection {
  const teaser = resolveTeaser(raw?.teaser as RawTeaser, 640, 4 / 3, EMPTY_TEASER_FALLBACK);
  return { role: str(raw?.role, ""), title: teaser.title, note: teaser.description ?? "", accent: teaser.accent };
}

function mapChapter(raw: Record<string, unknown>): Chapter {
  const key = str(raw?.key, "PLAY");
  const label = str(raw?.label, key);
  return {
    key,
    label,
    caption: str(raw?.caption, ""),
    media: resolveMedia(raw?.image, 700, 4 / 5, label, { assetNeeded: "sanity-missing-image", label })
  };
}

function mapPrinciple(raw: Record<string, unknown>): Principle {
  return { number: str(raw?.number, ""), label: str(raw?.label, ""), headline: str(raw?.headline, ""), copy: str(raw?.copy, "") };
}

export async function getPartnerPreview(): Promise<PartnerPreviewContent> {
  const client = await getClient();
  if (!client) return previewContent;

  let doc: Record<string, any> | null = null;
  try {
    doc = await client.fetch(PARTNER_PREVIEW_QUERY);
  } catch {
    return previewContent;
  }
  if (!doc) return previewContent;

  const fb = previewContent;

  return {
    seo: {
      title: str(doc.seo?.title, fb.seo.title),
      description: str(doc.seo?.description, fb.seo.description),
      ogImage: hasAsset(doc.seo?.ogImage) ? heroImageUrl(doc.seo.ogImage, 1200, 1200 / 630) || fb.seo.ogImage : fb.seo.ogImage,
      noindex: typeof doc.seo?.noindex === "boolean" ? doc.seo.noindex : fb.seo.noindex
    },
    hero: {
      eyebrow: str(doc.hero?.eyebrow, fb.hero.eyebrow),
      headlineLines: arr<string>(doc.hero?.headlineLines, fb.hero.headlineLines),
      subline: str(doc.hero?.subline, fb.hero.subline),
      intro: str(doc.hero?.intro, fb.hero.intro),
      scrollCue: str(doc.hero?.scrollCue, fb.hero.scrollCue),
      media: fb.hero.media,
      desktopRaw: hasAsset(doc.hero?.desktopImage) ? (doc.hero.desktopImage as RawSanityImage) : null,
      mobileRaw: hasAsset(doc.hero?.mobileImage) ? (doc.hero.mobileImage as RawSanityImage) : null
    },
    intro: {
      eyebrow: str(doc.intro?.eyebrow, fb.intro.eyebrow),
      headlineLines: arr<string>(doc.intro?.headlineLines, fb.intro.headlineLines),
      body: arr<string>(doc.intro?.body, fb.intro.body),
      chapters: arr(doc.intro?.chapters, []).length > 0 ? arr(doc.intro?.chapters, []).map(mapChapter) : fb.intro.chapters
    },
    productJourney: {
      eyebrow: str(doc.productJourney?.eyebrow, fb.productJourney.eyebrow),
      headlineLines: arr<string>(doc.productJourney?.headlineLines, fb.productJourney.headlineLines),
      closing: str(doc.productJourney?.closing, fb.productJourney.closing),
      steps: arr(doc.productJourney?.steps, []).length > 0 ? arr(doc.productJourney?.steps, []).map(mapStep) : fb.productJourney.steps
    },
    editorialPrinciples: {
      eyebrow: str(doc.editorialPrinciples?.eyebrow, fb.editorialPrinciples.eyebrow),
      headlineLines: arr<string>(doc.editorialPrinciples?.headlineLines, fb.editorialPrinciples.headlineLines),
      intro: arr<string>(doc.editorialPrinciples?.intro, fb.editorialPrinciples.intro),
      principles:
        arr(doc.editorialPrinciples?.principles, []).length > 0
          ? arr(doc.editorialPrinciples?.principles, []).map(mapPrinciple)
          : fb.editorialPrinciples.principles
    },
    stories: {
      eyebrow: str(doc.stories?.eyebrow, fb.stories.eyebrow),
      headlineLines: arr<string>(doc.stories?.headlineLines, fb.stories.headlineLines),
      cards: arr(doc.stories?.cards, []).length > 0 ? arr(doc.stories?.cards, []).map(mapFieldStoryCard) : fb.stories.cards
    },
    aroundIt: {
      eyebrow: str(doc.aroundIt?.eyebrow, fb.aroundIt.eyebrow),
      headlineLines: arr<string>(doc.aroundIt?.headlineLines, fb.aroundIt.headlineLines),
      body: str(doc.aroundIt?.body, fb.aroundIt.body),
      anchor: resolveTeaser(doc.aroundIt?.anchor, 640, 4 / 3, fb.aroundIt.anchor),
      connections:
        arr(doc.aroundIt?.connections, []).length > 0
          ? arr(doc.aroundIt?.connections, []).map(mapConnection)
          : fb.aroundIt.connections
    },
    saveDemo: {
      eyebrow: str(doc.saveDemo?.eyebrow, fb.saveDemo.eyebrow),
      headlineLines: arr<string>(doc.saveDemo?.headlineLines, fb.saveDemo.headlineLines),
      body: arr<string>(doc.saveDemo?.body, fb.saveDemo.body),
      card: resolveTeaser(doc.saveDemo?.card, 640, 4 / 3, fb.saveDemo.card),
      destinationLabel: str(doc.saveDemo?.destinationLabel, fb.saveDemo.destinationLabel),
      baseSavedCount: num(doc.saveDemo?.baseSavedCount, fb.saveDemo.baseSavedCount)
    },
    editorialUniverse: {
      ticker: str(doc.editorialUniverse?.ticker, fb.editorialUniverse.ticker),
      headlineLines: arr<string>(doc.editorialUniverse?.headlineLines, fb.editorialUniverse.headlineLines)
    },
    pr: {
      eyebrow: str(doc.pr?.eyebrow, fb.pr.eyebrow),
      headlineLines: arr<string>(doc.pr?.headlineLines, fb.pr.headlineLines),
      body: arr<string>(doc.pr?.body, fb.pr.body),
      topics: arr<string>(doc.pr?.topics, fb.pr.topics),
      subheading: str(doc.pr?.subheading, fb.pr.subheading),
      helpItems: arr<string>(doc.pr?.helpItems, fb.pr.helpItems),
      independenceLine: str(doc.pr?.independenceLine, fb.pr.independenceLine)
    },
    contact: {
      headlineLines: arr<string>(doc.contact?.headlineLines, fb.contact.headlineLines),
      body: arr<string>(doc.contact?.body, fb.contact.body),
      person: str(doc.contact?.person, fb.contact.person),
      role: str(doc.contact?.role, fb.contact.role),
      email: str(doc.contact?.email, fb.contact.email),
      ctaLabel: str(doc.contact?.ctaLabel, fb.contact.ctaLabel)
    },
    status: {
      eyebrow: str(doc.status?.eyebrow, fb.status.eyebrow),
      headlineLines: arr<string>(doc.status?.headlineLines, fb.status.headlineLines),
      body: arr<string>(doc.status?.body, fb.status.body)
    },
    footer: {
      tagline: str(doc.footer?.tagline, fb.footer.tagline),
      instagram: {
        label: str(doc.footer?.instagramLabel, fb.footer.instagram.label),
        href: str(doc.footer?.instagramHref, fb.footer.instagram.href)
      },
      closing: str(doc.footer?.closing, fb.footer.closing)
    }
  };
}
