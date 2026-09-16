/**
 * AROUND v1.26c - READ BEFORE YOU GO.
 *
 * The reverse of Story -> Place -> Trip: TRIP -> RELEVANT STORIES -> BETTER TRIP.
 * This is NOT Trip Fit - it never reasons about scheduling, geography, or
 * commerce. It answers exactly one question: which editorial Stories does the
 * canonical Story Graph (story.related[]) directly connect to the Places and
 * Destinations actually in this Trip?
 *
 * No AI, no semantic guessing, no geospatial inference, no paid ranking.
 * Trip editorial context is only:
 *   A. Places actually in the Trip (trip.items where sourceType === "place")
 *   B. Destinations explicitly associated with the Trip
 *      (trip.destinationSourceId, or a Trip item with sourceType === "destination")
 *   C. Destinations belonging to an actual Trip Place (resolved via Sanity)
 *
 * The matching + ranking functions below are pure - no Sanity/Supabase/React
 * import - so they can be exercised directly with plain ContentCard values.
 * Only getTripStoryRecommendations() (the orchestrator) touches Sanity.
 */

import { sanity } from "@/lib/sanity/client";
import { PLACES_BY_IDS_QUERY, TRIP_STORIES_RELATED_TO_IDS_QUERY } from "@/lib/sanity/queries";
import { toCard } from "@/lib/content";
import type { ContentCard } from "@/lib/types";

export const MAX_TRIP_STORY_RECOMMENDATIONS = 4;

export type TripStoryMatchType = "places" | "destination";

export type TripStoryRecommendation = {
  story: ContentCard;
  matchedPlaceIds: string[];
  matchedDestinationIds: string[];
  matchType: TripStoryMatchType;
};

export type TripStoryCandidate = {
  story: ContentCard;
  /** Raw story.related[] ref ids - the only signal used to compute a match. */
  relatedRefs: string[];
};

export type TripStoryContextInput = {
  placeIds: string[];
  destinationIds?: string[];
};

function unique(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

/**
 * A Story is eligible only when its own related[] directly references at
 * least one actual Trip Place or Trip Destination id. Returns null for an
 * unrelated Story (test case F) - it must never be returned.
 */
export function matchTripStory(
  relatedRefs: string[],
  eligiblePlaceIds: readonly string[],
  eligibleDestinationIds: readonly string[]
): Pick<TripStoryRecommendation, "matchedPlaceIds" | "matchedDestinationIds" | "matchType"> | null {
  const placeSet = new Set(eligiblePlaceIds);
  const destinationSet = new Set(eligibleDestinationIds);

  const matchedPlaceIds = unique(relatedRefs.filter(ref => placeSet.has(ref)));
  const matchedDestinationIds = unique(relatedRefs.filter(ref => destinationSet.has(ref)));

  if (!matchedPlaceIds.length && !matchedDestinationIds.length) return null;

  return {
    matchedPlaceIds,
    matchedDestinationIds,
    matchType: matchedPlaceIds.length ? "places" : "destination"
  };
}

/**
 * Deterministic priority order (highest first):
 * 1. has a direct Trip Place match at all
 * 2. number of directly matched Trip Places, descending
 * 3. number of directly matched Trip Destinations, descending
 * 4. featured
 * 5. priority, descending
 * 6. publishedAt, newest first
 * 7. Story id, as a stable fallback
 *
 * Steps 1 and 2 are mathematically equivalent (zero is always the minimum),
 * but both are kept explicit to mirror the spec 1:1 and make the "a Place
 * match always outranks a Destination-only match" guarantee self-evident.
 * Never considers aroundSelected, commercialPartner, bookingUrl, Trip Fit,
 * distance, Save state or Premium tier.
 */
export function compareTripStoryRecommendations(
  a: TripStoryRecommendation,
  b: TripStoryRecommendation
): number {
  const aHasPlace = a.matchedPlaceIds.length > 0;
  const bHasPlace = b.matchedPlaceIds.length > 0;
  if (aHasPlace !== bHasPlace) return aHasPlace ? -1 : 1;

  if (a.matchedPlaceIds.length !== b.matchedPlaceIds.length) {
    return b.matchedPlaceIds.length - a.matchedPlaceIds.length;
  }

  if (a.matchedDestinationIds.length !== b.matchedDestinationIds.length) {
    return b.matchedDestinationIds.length - a.matchedDestinationIds.length;
  }

  const aFeatured = Boolean(a.story.featured);
  const bFeatured = Boolean(b.story.featured);
  if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;

  const priorityDiff = (b.story.priority ?? 0) - (a.story.priority ?? 0);
  if (priorityDiff !== 0) return priorityDiff;

  const aTime = a.story.publishedAt ? Date.parse(a.story.publishedAt) : 0;
  const bTime = b.story.publishedAt ? Date.parse(b.story.publishedAt) : 0;
  if (aTime !== bTime) return bTime - aTime;

  if (a.story.id < b.story.id) return -1;
  if (a.story.id > b.story.id) return 1;
  return 0;
}

/**
 * Pure: matches every candidate against the eligible id sets, drops
 * non-matches, ranks, and caps at MAX_TRIP_STORY_RECOMMENDATIONS. Duplicate
 * ids in placeIds/destinationIds never inflate a match count - matching is
 * set-based (test case G).
 */
export function buildTripStoryRecommendations(
  candidates: TripStoryCandidate[],
  placeIds: string[],
  destinationIds: string[]
): TripStoryRecommendation[] {
  const eligiblePlaceIds = unique(placeIds);
  const eligibleDestinationIds = unique(destinationIds);

  const recommendations = candidates
    .map((candidate): TripStoryRecommendation | null => {
      const match = matchTripStory(candidate.relatedRefs, eligiblePlaceIds, eligibleDestinationIds);
      return match ? { story: candidate.story, ...match } : null;
    })
    .filter((item): item is TripStoryRecommendation => Boolean(item));

  return recommendations.sort(compareTripStoryRecommendations).slice(0, MAX_TRIP_STORY_RECOMMENDATIONS);
}

/**
 * Orchestrator: resolves Destination ids for the given Trip Places, fetches
 * every Story whose related[] intersects the full eligible id set, and
 * returns up to MAX_TRIP_STORY_RECOMMENDATIONS ranked recommendations. Never
 * throws - any Sanity failure resolves to an empty list, since READ BEFORE
 * YOU GO must never break the Trip Planner.
 */
export async function getTripStoryRecommendations(
  input: TripStoryContextInput
): Promise<TripStoryRecommendation[]> {
  if (!sanity) return [];

  const placeIds = unique(input.placeIds || []);
  const explicitDestinationIds = unique(input.destinationIds || []);
  if (!placeIds.length && !explicitDestinationIds.length) return [];

  let resolvedDestinationIds: string[] = [];
  if (placeIds.length) {
    try {
      const placeDocs = await sanity.fetch(PLACES_BY_IDS_QUERY, { ids: placeIds });
      resolvedDestinationIds = (Array.isArray(placeDocs) ? placeDocs : [])
        .map((doc: any) => doc?.destinationId)
        .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);
    } catch {
      resolvedDestinationIds = [];
    }
  }

  const destinationIds = unique([...explicitDestinationIds, ...resolvedDestinationIds]);
  const eligibleIds = unique([...placeIds, ...destinationIds]);
  if (!eligibleIds.length) return [];

  let storyDocs: any[] = [];
  try {
    const docs = await sanity.fetch(TRIP_STORIES_RELATED_TO_IDS_QUERY, { ids: eligibleIds });
    storyDocs = Array.isArray(docs) ? docs : [];
  } catch {
    return [];
  }

  const candidates = storyDocs
    .map((doc): TripStoryCandidate | null => {
      const card = toCard(doc);
      if (!card) return null;
      const relatedRefs = Array.isArray(doc.relatedRefs)
        ? doc.relatedRefs.filter((ref: unknown): ref is string => typeof ref === "string")
        : [];
      return { story: card, relatedRefs };
    })
    .filter((item): item is TripStoryCandidate => Boolean(item));

  return buildTripStoryRecommendations(candidates, placeIds, destinationIds);
}
