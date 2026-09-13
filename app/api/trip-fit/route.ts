import { NextResponse } from "next/server";
import { evaluateTripFitBatch } from "@/lib/trip-fit-adapter";
import { parseTripFitRequestBody } from "@/lib/trip-fit-request";

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

  const { candidateIds, tripItems, tripDestinationId, candidateStartTimes, candidateDurationMinutes } = parseTripFitRequestBody(body);
  const dayIndex = typeof body?.dayIndex === "number" ? body.dayIndex : undefined;

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
