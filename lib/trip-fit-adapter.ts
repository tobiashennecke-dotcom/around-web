/**
 * Server-side adapter for the AROUND Trip Fit Engine (lib/trip-fit.ts).
 *
 * ENGINE CALCULATES. ADAPTER RESOLVES CONTEXT. UI ONLY PRESENTS THE RESULT.
 *
 * This module resolves real context (Sanity Place Intelligence, trip-item
 * coordinates, geographic eligibility) and hands it to the frozen, pure engine.
 * It must never reimplement a hard gate, score weight, reason code or geographic
 * eligibility algorithm - those all live in lib/trip-fit.ts / lib/relevance.ts.
 */

import { sanity } from "@/lib/sanity/client";
import { TRIP_FIT_CANDIDATES_QUERY, PLACES_BY_IDS_QUERY, DESTINATION_GEO_QUERY } from "@/lib/sanity/queries";
import { normalizeContentRole } from "@/lib/content-role";
import { haversineDistanceKm, isGeographicallyEligible, type AroundItAnchor, type AroundItCandidate } from "@/lib/relevance";
import { evaluateTripFit, type TripFitItem, type TripFitResult, type TripFitRole } from "@/lib/trip-fit";

export type TripFitAdapterTripItem = {
  sourceId: string;
  sourceType?: string;
  sourceRole?: string;
  dayIndex?: number;
  isFixed?: boolean;
  fixedTime?: string;
  durationMinutes?: number;
};

export type TripFitAdapterRequest = {
  candidateIds: string[];
  dayIndex: number;
  tripItems: TripFitAdapterTripItem[];
  tripDestinationId?: string;
  candidateStartTimes?: Record<string, string>;
  /** Actual planned duration per candidate (Planner's real TripItem duration, or
   * Quick Add's Fixpunkt draft duration) - overrides canonical Sanity duration
   * when present, so Trip Fit reflects what the user is actually planning. */
  candidateDurationMinutes?: Record<string, number>;
};

const MAX_CANDIDATES = 20;

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

/**
 * Evaluates Trip Fit for up to MAX_CANDIDATES Place ids against one day of an
 * existing trip. If Sanity or geographic context cannot be resolved for a
 * candidate, it is simply omitted from the result map - never a fabricated
 * fallback context.
 */
export async function evaluateTripFitBatch(request: TripFitAdapterRequest): Promise<Record<string, TripFitResult>> {
  const results: Record<string, TripFitResult> = {};
  const candidateIds = request.candidateIds.slice(0, MAX_CANDIDATES).filter(Boolean);
  if (!candidateIds.length || !sanity) return results;

  // A) Canonical Place Intelligence for the candidates.
  const candidateDocs = await sanity.fetch(TRIP_FIT_CANDIDATES_QUERY, { ids: candidateIds });
  const docs = (candidateDocs as any[] | undefined) || [];
  if (!docs.length) return results;

  // B) Coordinates (+ destinationId) for the trip's existing Place items, fetched
  // once and reused below for every candidate - no per-candidate Sanity request.
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

  // Trip destination coordinates, fetched once (only if supplied) as the fallback
  // anchor for when no OTHER trip Place has known coordinates.
  let destinationAnchor: AroundItAnchor | null = null;
  if (request.tripDestinationId) {
    const destDoc = await sanity.fetch(DESTINATION_GEO_QUERY, { id: request.tripDestinationId });
    if (typeof destDoc?.coordinates?.lat === "number" && typeof destDoc?.coordinates?.lng === "number") {
      destinationAnchor = { destinationId: request.tripDestinationId, latitude: destDoc.coordinates.lat, longitude: destDoc.coordinates.lng };
    }
  }

  const baseTripFitItems = request.tripItems.map(toTripFitItem);

  for (const doc of docs) {
    if (!doc?._id) continue;

    // C) Geographic anchors for THIS candidate - existing global eligibility
    // logic, no second algorithm, but never the candidate's own coordinate: in
    // the Planner the candidate is already one of the trip's Place items, and
    // must not become its own 0 km anchor. Falls back to the trip destination
    // only when no OTHER trip Place has known coordinates; with neither,
    // isGeographicallyEligible([], ...) below correctly yields false.
    const anchors: AroundItAnchor[] = [];
    for (const [sourceId, geo] of tripPlaceGeo) {
      if (sourceId === doc._id) continue;
      anchors.push({ destinationId: geo.destinationId, latitude: geo.lat, longitude: geo.lng });
    }
    if (!anchors.length && destinationAnchor) anchors.push(destinationAnchor);

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
      for (const [sourceId, geo] of tripPlaceGeo) {
        if (sourceId === doc._id) continue;
        const distance = haversineDistanceKm({ latitude: doc.coordinates.lat, longitude: doc.coordinates.lng }, { latitude: geo.lat, longitude: geo.lng });
        distanceToItemKm ??= {};
        distanceToItemKm[sourceId] = distance;
      }
    }

    // F1) Remove ONLY this candidate's own existing TripItem, so the engine's
    // ALREADY_IN_TRIP gate isn't tripped when re-evaluating a Planner item.
    const tripItemsForCandidate = baseTripFitItems.filter(item => item.sourceId !== doc._id);

    // Actual planned duration (Planner's real TripItem, or Quick Add's Fixpunkt
    // draft) wins over the canonical Sanity duration when it's a valid positive number.
    const durationOverride = request.candidateDurationMinutes?.[doc._id];
    const suggestedDurationMinutes =
      typeof durationOverride === "number" && Number.isFinite(durationOverride) && durationOverride > 0
        ? durationOverride
        : typeof doc.suggestedDurationMinutes === "number"
          ? doc.suggestedDurationMinutes
          : undefined;

    const result = evaluateTripFit({
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
      dayIndex: request.dayIndex,
      tripItems: tripItemsForCandidate,
      geo: {
        eligible: isGeographicallyEligible(anchors, candidateGeoCandidate),
        distanceToItemKm
      },
      // Only a real, caller-supplied time - never invented here.
      candidateStartTime: request.candidateStartTimes?.[doc._id]
    });

    results[doc._id] = result;
  }

  return results;
}
