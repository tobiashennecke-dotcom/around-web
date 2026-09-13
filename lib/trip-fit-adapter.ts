/**
 * Server-side adapter for the AROUND Trip Fit Engine (lib/trip-fit.ts).
 *
 * ENGINE CALCULATES. ADAPTER RESOLVES CONTEXT. UI ONLY PRESENTS THE RESULT.
 *
 * This module resolves real context (Sanity Place Intelligence, trip-item
 * coordinates, geographic eligibility) and hands it to the frozen, pure engine.
 * It must never reimplement a hard gate, score weight, reason code or geographic
 * eligibility algorithm - those all live in lib/trip-fit.ts / lib/relevance.ts.
 *
 * Two orchestration layers on top of the same shared candidate preparation:
 * - evaluateTripFitBatch: "does this candidate fit THIS day?" (one dayIndex)
 * - evaluateTripBestDays: "which of THESE days fits this candidate best?"
 *   (compares only already-eligible per-day evaluateTripFit() results - it
 *   never invents eligibility the engine didn't grant)
 */

import { sanity } from "@/lib/sanity/client";
import { TRIP_FIT_CANDIDATES_QUERY, PLACES_BY_IDS_QUERY, DESTINATION_GEO_QUERY } from "@/lib/sanity/queries";
import { normalizeContentRole } from "@/lib/content-role";
import { haversineDistanceKm, isGeographicallyEligible, type AroundItAnchor, type AroundItCandidate } from "@/lib/relevance";
import { evaluateTripFit, type TripFitCandidate, type TripFitItem, type TripFitResult, type TripFitRole } from "@/lib/trip-fit";

export type TripFitAdapterTripItem = {
  sourceId: string;
  sourceType?: string;
  sourceRole?: string;
  dayIndex?: number;
  isFixed?: boolean;
  fixedTime?: string;
  durationMinutes?: number;
};

type SharedRequestFields = {
  candidateIds: string[];
  tripItems: TripFitAdapterTripItem[];
  tripDestinationId?: string;
  candidateStartTimes?: Record<string, string>;
  /** Actual planned duration per candidate (Planner's real TripItem duration, or
   * Quick Add's Fixpunkt draft duration) - overrides canonical Sanity duration
   * when present, so Trip Fit reflects what the user is actually planning. */
  candidateDurationMinutes?: Record<string, number>;
};

export type TripFitAdapterRequest = SharedRequestFields & {
  dayIndex: number;
};

export type TripBestDayResult = {
  candidateId: string;
  dayIndex: number;
  fit: TripFitResult;
};

export type TripBestDayAdapterRequest = SharedRequestFields & {
  dayIndexes: number[];
};

const MAX_CANDIDATES = 20;
const MAX_DAYS = 31;

function toTripFitRole(value: string | undefined): TripFitRole | undefined {
  const role = normalizeContentRole(value);
  return role || undefined;
}

function toTripFitItem(item: TripFitAdapterTripItem): TripFitItem {
  return {
    sourceId: item.sourceId,
    role: toTripFitRole(item.sourceRole),
    dayIndex: item.dayIndex,
    isFixed: item.isFixed,
    fixedTime: item.fixedTime,
    durationMinutes: item.durationMinutes
  };
}

/** Day-independent per-candidate inputs, prepared once and reused across every day it's evaluated against. */
type CandidateEvalContext = {
  id: string;
  candidate: TripFitCandidate;
  tripItemsForCandidate: TripFitItem[];
  geo: { eligible: boolean; distanceToItemKm?: Record<string, number> };
  candidateStartTime?: string;
};

type PreparedTripContext = {
  docs: any[];
  tripPlaceGeo: Map<string, { lat: number; lng: number; destinationId?: string }>;
  destinationAnchor: AroundItAnchor | null;
  baseTripFitItems: TripFitItem[];
};

/**
 * A) Fetches canonical Place Intelligence for the candidates.
 * B) Resolves coordinates (+ destinationId) for the trip's existing Place items, once.
 * Resolves the trip destination's coordinates, once, as the geo fallback.
 * Shared by both evaluateTripFitBatch and evaluateTripBestDays - no diverging implementations.
 */
async function prepareTripContext(request: SharedRequestFields): Promise<PreparedTripContext | null> {
  if (!sanity) return null;
  const candidateIds = request.candidateIds.slice(0, MAX_CANDIDATES).filter(Boolean);
  if (!candidateIds.length) return null;

  const candidateDocs = await sanity.fetch(TRIP_FIT_CANDIDATES_QUERY, { ids: candidateIds });
  const docs = (candidateDocs as any[] | undefined) || [];
  if (!docs.length) return null;

  const tripPlaceIds = Array.from(
    new Set(request.tripItems.filter(item => item.sourceType === "place").map(item => item.sourceId))
  );
  const tripPlaceGeo = new Map<string, { lat: number; lng: number; destinationId?: string }>();
  if (tripPlaceIds.length) {
    const placeDocs = await sanity.fetch(PLACES_BY_IDS_QUERY, { ids: tripPlaceIds });
    for (const doc of (placeDocs as any[] | undefined) || []) {
      if (typeof doc?.coordinates?.lat === "number" && typeof doc?.coordinates?.lng === "number") {
        tripPlaceGeo.set(doc._id, { lat: doc.coordinates.lat, lng: doc.coordinates.lng, destinationId: doc.destinationId || undefined });
      }
    }
  }

  let destinationAnchor: AroundItAnchor | null = null;
  if (request.tripDestinationId) {
    const destDoc = await sanity.fetch(DESTINATION_GEO_QUERY, { id: request.tripDestinationId });
    if (typeof destDoc?.coordinates?.lat === "number" && typeof destDoc?.coordinates?.lng === "number") {
      destinationAnchor = { destinationId: request.tripDestinationId, latitude: destDoc.coordinates.lat, longitude: destDoc.coordinates.lng };
    }
  }

  return { docs, tripPlaceGeo, destinationAnchor, baseTripFitItems: request.tripItems.map(toTripFitItem) };
}

/**
 * Builds the day-independent evaluation context for every candidate. Geography
 * and duration overrides only need to be resolved once per candidate, since
 * evaluateTripFit()'s dayIndex parameter is the only thing that varies per day.
 */
function buildCandidateEvalContexts(request: SharedRequestFields, prepared: PreparedTripContext): CandidateEvalContext[] {
  const contexts: CandidateEvalContext[] = [];

  for (const doc of prepared.docs) {
    if (!doc?._id) continue;

    // C) Geographic anchors for THIS candidate - existing global eligibility
    // logic, no second algorithm, but never the candidate's own coordinate: the
    // candidate may already be one of the trip's Place items (Planner, or an
    // "already in trip" candidate), and must not become its own 0 km anchor.
    // Falls back to the trip destination only when no OTHER trip Place has known
    // coordinates; with neither, isGeographicallyEligible([], ...) yields false.
    const anchors: AroundItAnchor[] = [];
    for (const [sourceId, geo] of prepared.tripPlaceGeo) {
      if (sourceId === doc._id) continue;
      anchors.push({ destinationId: geo.destinationId, latitude: geo.lat, longitude: geo.lng });
    }
    if (!anchors.length && prepared.destinationAnchor) anchors.push(prepared.destinationAnchor);

    const candidateGeoCandidate: AroundItCandidate = {
      id: doc._id,
      placeType: doc.placeType || undefined,
      destinationId: doc.destinationId || undefined,
      latitude: doc.coordinates?.lat,
      longitude: doc.coordinates?.lng,
      priority: typeof doc.priority === "number" ? doc.priority : undefined,
      featured: Boolean(doc.featured),
      aroundSelected: Boolean(doc.aroundSelected)
    };

    // D) distanceToItemKm - only for OTHER trip items whose coordinates are
    // actually known; the candidate's own item (if any) is excluded here too.
    let distanceToItemKm: Record<string, number> | undefined;
    if (typeof doc.coordinates?.lat === "number" && typeof doc.coordinates?.lng === "number") {
      for (const [sourceId, geo] of prepared.tripPlaceGeo) {
        if (sourceId === doc._id) continue;
        const distance = haversineDistanceKm({ latitude: doc.coordinates.lat, longitude: doc.coordinates.lng }, { latitude: geo.lat, longitude: geo.lng });
        distanceToItemKm ??= {};
        distanceToItemKm[sourceId] = distance;
      }
    }

    // Remove ONLY this candidate's own existing TripItem, so the engine's
    // ALREADY_IN_TRIP gate isn't tripped when re-evaluating a Planner item.
    const tripItemsForCandidate = prepared.baseTripFitItems.filter(item => item.sourceId !== doc._id);

    // Actual planned duration (Planner's real TripItem, or Quick Add's Fixpunkt
    // draft) wins over the canonical Sanity duration when it's a valid positive number.
    const durationOverride = request.candidateDurationMinutes?.[doc._id];
    const suggestedDurationMinutes =
      typeof durationOverride === "number" && Number.isFinite(durationOverride) && durationOverride > 0
        ? durationOverride
        : typeof doc.suggestedDurationMinutes === "number"
          ? doc.suggestedDurationMinutes
          : undefined;

    contexts.push({
      id: doc._id,
      candidate: {
        id: doc._id,
        role: toTripFitRole(doc.placeType),
        defaultPlanningMode: doc.defaultPlanningMode || undefined,
        suggestedDurationMinutes,
        suggestedDaypart: doc.suggestedDaypart || undefined,
        compatibleDayparts: Array.isArray(doc.compatibleDayparts) ? doc.compatibleDayparts : undefined,
        effortLevel: doc.effortLevel || undefined,
        environment: doc.environment || undefined,
        weatherSensitivity: doc.weatherSensitivity || undefined,
        priority: typeof doc.priority === "number" ? doc.priority : undefined,
        featured: Boolean(doc.featured),
        aroundSelected: Boolean(doc.aroundSelected)
      },
      tripItemsForCandidate,
      geo: { eligible: isGeographicallyEligible(anchors, candidateGeoCandidate), distanceToItemKm },
      // Only a real, caller-supplied time - never invented here.
      candidateStartTime: request.candidateStartTimes?.[doc._id]
    });
  }

  return contexts;
}

/**
 * Evaluates Trip Fit for up to MAX_CANDIDATES Place ids against one day of an
 * existing trip. If Sanity or geographic context cannot be resolved for a
 * candidate, it is simply omitted from the result map - never a fabricated
 * fallback context.
 */
export async function evaluateTripFitBatch(request: TripFitAdapterRequest): Promise<Record<string, TripFitResult>> {
  const results: Record<string, TripFitResult> = {};
  const prepared = await prepareTripContext(request);
  if (!prepared) return results;

  for (const context of buildCandidateEvalContexts(request, prepared)) {
    results[context.id] = evaluateTripFit({
      candidate: context.candidate,
      dayIndex: request.dayIndex,
      tripItems: context.tripItemsForCandidate,
      geo: context.geo,
      candidateStartTime: context.candidateStartTime
    });
  }

  return results;
}

function normalizeDayIndexes(values: number[]): number[] {
  const unique = Array.from(new Set(values.filter(value => Number.isInteger(value) && value >= 0)));
  unique.sort((a, b) => a - b);
  return unique.slice(0, MAX_DAYS);
}

/** Specificity priority used ONLY to break score ties between already-eligible days - never to grant eligibility. */
const RECOMMENDATION_SPECIFICITY: Record<string, number> = {
  after_golf: 2,
  before_dinner: 1,
  fits_available_window: 0
};

function isBetterBestDay(candidate: TripBestDayResult, current: TripBestDayResult): boolean {
  if (candidate.fit.score !== current.fit.score) return candidate.fit.score > current.fit.score;
  const candidateSpecificity = RECOMMENDATION_SPECIFICITY[candidate.fit.recommendationType || ""] ?? -1;
  const currentSpecificity = RECOMMENDATION_SPECIFICITY[current.fit.recommendationType || ""] ?? -1;
  if (candidateSpecificity !== currentSpecificity) return candidateSpecificity > currentSpecificity;
  return candidate.dayIndex < current.dayIndex;
}

/**
 * BEST DAY ONLY COMPARES ELIGIBLE ENGINE RESULTS. For each candidate, evaluates
 * every requested day via the exact same evaluateTripFit() call as the single-day
 * path (same shared candidate context, so geo/duration/time rules are identical),
 * discards every ineligible day, and ranks what's left by score, then
 * recommendation specificity, then earliest day. A candidate with no eligible day
 * at all - including any "fixed, no real time" candidate, which is ineligible on
 * every day identically - simply gets no entry in the result map.
 */
export async function evaluateTripBestDays(request: TripBestDayAdapterRequest): Promise<Record<string, TripBestDayResult>> {
  const results: Record<string, TripBestDayResult> = {};
  const dayIndexes = normalizeDayIndexes(request.dayIndexes);
  if (!dayIndexes.length) return results;

  const prepared = await prepareTripContext(request);
  if (!prepared) return results;

  for (const context of buildCandidateEvalContexts(request, prepared)) {
    let best: TripBestDayResult | null = null;
    for (const dayIndex of dayIndexes) {
      const fit = evaluateTripFit({
        candidate: context.candidate,
        dayIndex,
        tripItems: context.tripItemsForCandidate,
        geo: context.geo,
        candidateStartTime: context.candidateStartTime
      });
      if (!fit.eligible) continue;
      const candidateResult: TripBestDayResult = { candidateId: context.id, dayIndex, fit };
      if (!best || isBetterBestDay(candidateResult, best)) best = candidateResult;
    }
    if (best) results[context.id] = best;
  }

  return results;
}
