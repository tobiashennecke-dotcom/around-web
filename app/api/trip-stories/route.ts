import { NextResponse } from "next/server";
import { getTripStoryRecommendations } from "@/lib/trip-stories";

const MAX_INPUT_IDS = 50;

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const strings = value.filter((id): id is string => typeof id === "string" && id.length > 0);
  return [...new Set(strings)].slice(0, MAX_INPUT_IDS);
}

/**
 * Thin delegation to lib/trip-stories.ts - no matching/ranking logic here.
 * Body: { placeIds: string[], destinationIds?: string[] }
 * Response: { recommendations: TripStoryRecommendation[] }
 * No DB write, no private Trip content stored.
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ recommendations: [] });
  }

  const placeIds = sanitizeIds(body?.placeIds);
  const destinationIds = sanitizeIds(body?.destinationIds);

  if (!placeIds.length && !destinationIds.length) {
    return NextResponse.json({ recommendations: [] });
  }

  try {
    const recommendations = await getTripStoryRecommendations({ placeIds, destinationIds });
    return NextResponse.json({ recommendations });
  } catch {
    // READ BEFORE YOU GO must never break the Trip Planner.
    return NextResponse.json({ recommendations: [] });
  }
}
