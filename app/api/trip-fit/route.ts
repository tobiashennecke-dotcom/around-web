import { NextResponse } from "next/server";
import { evaluateTripFitBatch, type TripFitAdapterTripItem } from "@/lib/trip-fit-adapter";

/**
 * Thin delegation to lib/trip-fit-adapter.ts - no score/reason logic here.
 * Body: { candidateIds, dayIndex, tripItems, tripDestinationId?, candidateStartTimes?, candidateDurationMinutes? }
 * Response: { results: { [candidateId]: TripFitResult } }
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ results: {} });
  }

  const candidateIds = Array.isArray(body?.candidateIds) ? body.candidateIds.filter((id: unknown): id is string => typeof id === "string") : [];
  const dayIndex = typeof body?.dayIndex === "number" ? body.dayIndex : undefined;
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

  if (!candidateIds.length || dayIndex === undefined) {
    return NextResponse.json({ results: {} });
  }

  try {
    const results = await evaluateTripFitBatch({ candidateIds, dayIndex, tripItems, tripDestinationId, candidateStartTimes, candidateDurationMinutes });
    return NextResponse.json({ results });
  } catch {
    // Never fabricate fallback context - if resolution fails, omit all contextual results.
    return NextResponse.json({ results: {} });
  }
}
