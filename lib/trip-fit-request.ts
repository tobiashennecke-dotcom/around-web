/**
 * Shared request-body parsing for the /api/trip-fit* routes. Pure sanitization
 * only - no scoring/selection logic, which belongs in lib/trip-fit-adapter.ts.
 */

import type { TripFitAdapterTripItem } from "@/lib/trip-fit-adapter";

export type ParsedTripFitBody = {
  candidateIds: string[];
  tripItems: TripFitAdapterTripItem[];
  tripDestinationId?: string;
  candidateStartTimes?: Record<string, string>;
  candidateDurationMinutes?: Record<string, number>;
};

export function parseTripFitRequestBody(body: any): ParsedTripFitBody {
  const candidateIds = Array.isArray(body?.candidateIds)
    ? body.candidateIds.filter((id: unknown): id is string => typeof id === "string")
    : [];

  const tripItems: TripFitAdapterTripItem[] = Array.isArray(body?.tripItems)
    ? body.tripItems
        .filter((item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item: any) => ({
          sourceId: String(item.sourceId || ""),
          sourceType: typeof item.sourceType === "string" ? item.sourceType : undefined,
          sourceRole: typeof item.sourceRole === "string" ? item.sourceRole : undefined,
          dayIndex: typeof item.dayIndex === "number" ? item.dayIndex : undefined,
          isFixed: Boolean(item.isFixed),
          fixedTime: typeof item.fixedTime === "string" ? item.fixedTime : undefined,
          durationMinutes: typeof item.durationMinutes === "number" ? item.durationMinutes : undefined
        }))
        .filter((item: TripFitAdapterTripItem) => Boolean(item.sourceId))
    : [];

  const tripDestinationId = typeof body?.tripDestinationId === "string" ? body.tripDestinationId : undefined;

  const candidateStartTimes: Record<string, string> | undefined =
    body?.candidateStartTimes && typeof body.candidateStartTimes === "object"
      ? Object.fromEntries(
          Object.entries(body.candidateStartTimes).filter((entry): entry is [string, string] => typeof entry[1] === "string")
        )
      : undefined;

  const candidateDurationMinutes: Record<string, number> | undefined =
    body?.candidateDurationMinutes && typeof body.candidateDurationMinutes === "object"
      ? Object.fromEntries(
          Object.entries(body.candidateDurationMinutes).filter(
            (entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0
          )
        )
      : undefined;

  return { candidateIds, tripItems, tripDestinationId, candidateStartTimes, candidateDurationMinutes };
}
