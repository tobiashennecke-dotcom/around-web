import { sanity } from "@/lib/sanity/client";
import { STORIES_HUB_QUERY } from "@/lib/sanity/queries";
import { toCard } from "@/lib/content";
import { STORY_FORMAT_ORDER, storyFormatAnchor, storyFormatDescriptor, storyFormatLabel } from "@/lib/story-format";
import type { ContentCard } from "@/lib/types";

const HUB_FALLBACK_EDITION_LABEL = "AROUND STORIES";
const MAX_FEATURED_DESTINATIONS = 4;
const MAX_SECONDARY_STORIES = 2;

export type FeaturedDestinationCard = {
  id: string;
  title: string;
  slug: string;
  kicker?: string;
  country?: string;
  image?: string;
  storyCount: number;
  representativeStory?: ContentCard;
};

export type StoryFormatShelf = {
  format: string;
  label: string;
  descriptor?: string;
  anchor: string;
  stories: ContentCard[];
};

export type StoriesHubData = {
  editionLabel: string;
  intro?: string;
  leadStory: ContentCard | null;
  secondaryStories: ContentCard[];
  /** Full library, sorted priority DESC then publishedAt DESC - the "All Stories" archive. */
  stories: ContentCard[];
  /** One shelf per format that currently has at least one Story, in a fixed editorial order. */
  formats: StoryFormatShelf[];
  featuredDestinations: FeaturedDestinationCard[];
};

type RelatedRef = { type?: string; id?: string; destinationId?: string };

/**
 * Editorial ranking shared by the fallback lead/secondary selection and the
 * "fill remaining slots" logic: featured DESC, priority DESC, publishedAt DESC.
 * Never influenced by commercial fields - there are none on Story anyway.
 */
function sortByEditorialRank(cards: ContentCard[]): ContentCard[] {
  return [...cards].sort((a, b) => {
    if (Boolean(b.featured) !== Boolean(a.featured)) return Boolean(b.featured) ? 1 : -1;
    const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });
}

/** "All Stories" archive order: priority DESC then publishedAt DESC only - no featured bump, this is the completeness layer, not a curated rail. */
function sortForArchive(cards: ContentCard[]): ContentCard[] {
  return [...cards].sort((a, b) => {
    const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });
}

/**
 * The v1.25a Story Graph rule, applied here to decide whether a Story
 * qualifies for a Destination in the Hub's "Explore by Place" section:
 * direct Story->Destination reference, OR Story->Place whose Place.destination
 * is this Destination. Never geography, never text matching, and a
 * Destination-level reference never expands down to that Destination's Places.
 */
function storyQualifiesForDestination(relatedRefs: RelatedRef[], destinationId: string): boolean {
  return relatedRefs.some(
    ref => (ref.type === "destination" && ref.id === destinationId) || (ref.type === "place" && ref.destinationId === destinationId)
  );
}

function emptyHub(): StoriesHubData {
  return {
    editionLabel: HUB_FALLBACK_EDITION_LABEL,
    leadStory: null,
    secondaryStories: [],
    stories: [],
    formats: [],
    featuredDestinations: []
  };
}

export async function getStoriesHub(): Promise<StoriesHubData> {
  if (!sanity) return emptyHub();

  const data = await sanity.fetch(STORIES_HUB_QUERY);
  const rawStories: any[] = Array.isArray(data?.stories) ? data.stories : [];

  const cards = rawStories.map(toCard).filter((card): card is ContentCard => Boolean(card));
  const cardsById = new Map(cards.map(card => [card.id, card]));

  const relatedRefsById = new Map<string, RelatedRef[]>();
  for (const doc of rawStories) {
    if (!doc?._id) continue;
    const refs: RelatedRef[] = Array.isArray(doc.relatedRefs) ? doc.relatedRefs.filter(Boolean) : [];
    relatedRefsById.set(doc._id, refs);
  }

  const ranked = sortByEditorialRank(cards);
  const hub = data?.hub;
  const usedIds = new Set<string>();

  // --- Lead: explicit curation wins; fallback is the top-ranked Story. ---
  const curatedLead = hub?.leadStoryId ? cardsById.get(hub.leadStoryId) : undefined;
  const leadStory: ContentCard | null = curatedLead || ranked[0] || null;
  if (leadStory) usedIds.add(leadStory.id);

  // --- Secondary: curated ids first (skipping duplicates/broken refs), then fallback fill. ---
  const secondaryStories: ContentCard[] = [];
  const curatedSecondaryIds: string[] = Array.isArray(hub?.secondaryStoryIds) ? hub.secondaryStoryIds.filter(Boolean) : [];
  for (const id of curatedSecondaryIds) {
    if (secondaryStories.length >= MAX_SECONDARY_STORIES) break;
    if (usedIds.has(id)) continue; // dedupe against lead and against an accidental duplicate curated pick
    const card = cardsById.get(id);
    if (!card) continue; // curated Story deleted/unpublished - skip gracefully
    secondaryStories.push(card);
    usedIds.add(id);
  }
  for (const card of ranked) {
    if (secondaryStories.length >= MAX_SECONDARY_STORIES) break;
    if (usedIds.has(card.id)) continue;
    secondaryStories.push(card);
    usedIds.add(card.id);
  }

  // --- Format shelves: fixed editorial order, only formats with >=1 Story. ---
  const formats: StoryFormatShelf[] = STORY_FORMAT_ORDER.map(format => ({
    format,
    label: storyFormatLabel(format),
    descriptor: storyFormatDescriptor(format),
    anchor: storyFormatAnchor(format),
    stories: sortByEditorialRank(cards.filter(card => (card.storyFormat || "story") === format))
  })).filter(shelf => shelf.stories.length > 0);

  // --- Explore by Place: curated Destinations first, backfilled from the full pool. ---
  const allDestinations: any[] = Array.isArray(data?.allDestinations) ? data.allDestinations : [];

  function toDestinationCard(doc: any): FeaturedDestinationCard | null {
    if (!doc?._id || !doc?.slug?.current) return null;
    const qualifying = ranked.filter(card => storyQualifiesForDestination(relatedRefsById.get(card.id) || [], doc._id));
    return {
      id: doc._id,
      title: doc.title,
      slug: doc.slug.current,
      kicker: doc.kicker || undefined,
      country: doc.country || undefined,
      image: doc.image || undefined,
      storyCount: qualifying.length,
      representativeStory: qualifying[0]
    };
  }

  const destinationDocsById = new Map(allDestinations.map(doc => [doc._id, doc]));
  const curatedDestinationIds: string[] = Array.isArray(hub?.featuredDestinationIds) ? hub.featuredDestinationIds.filter(Boolean) : [];

  const featuredDestinations: FeaturedDestinationCard[] = [];
  const usedDestinationIds = new Set<string>();
  for (const id of curatedDestinationIds) {
    if (featuredDestinations.length >= MAX_FEATURED_DESTINATIONS) break;
    if (usedDestinationIds.has(id)) continue;
    const card = toDestinationCard(destinationDocsById.get(id));
    if (!card || card.storyCount === 0) continue; // deleted/unpublished, or its only Story is gone - skip gracefully
    featuredDestinations.push(card);
    usedDestinationIds.add(id);
  }
  if (featuredDestinations.length < MAX_FEATURED_DESTINATIONS) {
    const fallbackPool = allDestinations
      .map(toDestinationCard)
      .filter((card): card is FeaturedDestinationCard => card !== null && card.storyCount > 0 && !usedDestinationIds.has(card.id))
      .sort((a, b) => b.storyCount - a.storyCount || a.title.localeCompare(b.title));
    for (const card of fallbackPool) {
      if (featuredDestinations.length >= MAX_FEATURED_DESTINATIONS) break;
      featuredDestinations.push(card);
    }
  }

  return {
    editionLabel: hub?.editionLabel || HUB_FALLBACK_EDITION_LABEL,
    intro: hub?.intro || undefined,
    leadStory,
    secondaryStories,
    stories: sortForArchive(cards),
    formats,
    featuredDestinations
  };
}
