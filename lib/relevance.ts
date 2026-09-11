const EARTH_RADIUS_KM = 6371;

export type GeoPoint = { latitude: number; longitude: number };

export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface AroundItSubject {
  id: string;
  placeType?: string;
  destinationId?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
}

export interface AroundItCandidate {
  id: string;
  placeType?: string;
  destinationId?: string;
  latitude?: number;
  longitude?: number;
  priority?: number;
  featured?: boolean;
  aroundSelected?: boolean;
  tags?: string[];
}

export interface AroundItOptions {
  /** Max straight-line km for a candidate sharing the subject's destination. */
  sameDestinationMaxKm?: number;
  /** Max straight-line km for a candidate from a different destination. */
  otherDestinationMaxKm?: number;
  /** Manually curated relations bypass distance filtering entirely. Empty by default. */
  manuallyRelatedIds?: ReadonlySet<string>;
  limit?: number;
  /** Soft cap per category before other categories get a chance to fill remaining slots. */
  maxPerCategory?: number;
}

function normalizeCategory(placeType?: string): string {
  const value = (placeType || "").trim().toLowerCase();
  if (value === "course" || value === "play") return "play";
  if (value === "stay") return "stay";
  if (value === "eat" || value === "drink") return "eat";
  if (value === "do" || value === "culture") return "do";
  return value || "other";
}

interface Evaluated<T> {
  candidate: T;
  score: number;
  category: string;
}

function diversify<T>(sorted: Evaluated<T>[], limit: number, maxPerCategory: number): Evaluated<T>[] {
  const result: Evaluated<T>[] = [];
  const deferred: Evaluated<T>[] = [];
  const counts = new Map<string, number>();

  for (const item of sorted) {
    if (result.length >= limit) break;
    const count = counts.get(item.category) || 0;
    if (count < maxPerCategory) {
      result.push(item);
      counts.set(item.category, count + 1);
    } else {
      deferred.push(item);
    }
  }

  for (const item of deferred) {
    if (result.length >= limit) break;
    result.push(item);
  }

  return result;
}

export function getAroundItRecommendations<T extends AroundItCandidate>(
  subject: AroundItSubject,
  candidates: readonly T[],
  options: AroundItOptions = {}
): T[] {
  const sameDestinationMaxKm = options.sameDestinationMaxKm ?? 80;
  const otherDestinationMaxKm = options.otherDestinationMaxKm ?? 40;
  const limit = options.limit ?? 6;
  const maxPerCategory = options.maxPerCategory ?? 2;
  const manuallyRelatedIds = options.manuallyRelatedIds ?? new Set<string>();

  const subjectHasCoordinates = typeof subject.latitude === "number" && typeof subject.longitude === "number";
  const subjectCategory = normalizeCategory(subject.placeType);
  const evaluated: Evaluated<T>[] = [];

  for (const candidate of candidates) {
    if (candidate.id === subject.id) continue;

    const manuallyRelated = manuallyRelatedIds.has(candidate.id);
    const sameDestination = Boolean(subject.destinationId) && candidate.destinationId === subject.destinationId;
    const maxKm = sameDestination ? sameDestinationMaxKm : otherDestinationMaxKm;

    const candidateHasCoordinates = typeof candidate.latitude === "number" && typeof candidate.longitude === "number";
    const distanceKm = subjectHasCoordinates && candidateHasCoordinates
      ? haversineDistanceKm(
          { latitude: subject.latitude as number, longitude: subject.longitude as number },
          { latitude: candidate.latitude as number, longitude: candidate.longitude as number }
        )
      : undefined;

    if (!manuallyRelated) {
      if (distanceKm === undefined) continue;
      if (distanceKm > maxKm) continue;
    }

    let score = 0;
    if (manuallyRelated) score += 1000;
    if (sameDestination) score += 200;
    if (distanceKm !== undefined) score += Math.max(0, 1 - distanceKm / maxKm) * 150;

    score += Math.max(0, Math.min(100, candidate.priority ?? 50)) * 0.6;
    if (candidate.featured) score += 15;
    if (candidate.aroundSelected) score += 20;

    const category = normalizeCategory(candidate.placeType);
    if (category !== subjectCategory) score += 10;

    if (subject.tags?.length && candidate.tags?.length) {
      const shared = candidate.tags.filter(tag => subject.tags!.includes(tag)).length;
      score += Math.min(shared, 3) * 5;
    }

    evaluated.push({ candidate, score, category });
  }

  evaluated.sort((a, b) => b.score - a.score);
  return diversify(evaluated, limit, maxPerCategory).map(item => item.candidate);
}
