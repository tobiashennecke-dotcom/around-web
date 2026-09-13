import { NextResponse } from "next/server";
import { evaluateTripBestDays } from "@/lib/trip-fit-adapter";
import { parseTripFitRequestBody } from "@/lib/trip-fit-request";

const MAX_DAYS = 31;

/**
 * Thin delegation to lib/trip-fit-adapter.ts - no scoring/selection logic here.
 * Body: { candidateIds, dayIndexes, tripItems, tripDestinationId?, candidateStartTimes?, candidateDurationMinutes? }
 * Response: { results: { [candidateId]: { candidateId, dayIndex, fit } } }
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ results: {} });
  }

  const { candidateIds, tripItems, tripDestinationId, candidateStartTimes, candidateDurationMinutes } = parseTripFitRequestBody(body);
  const dayIndexes: number[] = Array.isArray(body?.dayIndexes)
    ? body.dayIndexes.filter((value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0).slice(0, MAX_DAYS)
    : [];

  if (!candidateIds.length || !dayIndexes.length) {
    return NextResponse.json({ results: {} });
  }

  try {
    const results = await evaluateTripBestDays({ candidateIds, dayIndexes, tripItems, tripDestinationId, candidateStartTimes, candidateDurationMinutes });
    return NextResponse.json({ results });
  } catch {
    // Never fabricate fallback context - if resolution fails, omit all contextual results.
    return NextResponse.json({ results: {} });
  }
}
