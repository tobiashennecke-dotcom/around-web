import { NextResponse } from "next/server";
import { getSearchContent } from "@/lib/content";
import { loadFitProfile } from "@/lib/personalization/server";
import { hasFitSignals, isRecommendation, scoreFit } from "@/lib/personalization/score";

export const dynamic = "force-dynamic";

/**
 * "Für dich": up to 8 Places that fit the signed-in user's profile, each
 * with readable reasons. Empty for guests, empty profiles or no matches.
 */
export async function GET(request: Request) {
  const fit = await loadFitProfile();
  if (!fit) return NextResponse.json({ items: [], state: "guest" });
  if (!hasFitSignals(fit.profile)) return NextResponse.json({ items: [], state: "no_profile" });

  const limit = Math.min(8, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 8));
  const places = (await getSearchContent("", "place")).filter(card => card.type === "place" && !card.unlisted);

  // Destinations of saved Places count as "gemerkt" too.
  const savedDestinationIds = new Set(fit.context.savedDestinationIds);
  for (const card of places) if (fit.savedIds.has(card.id) && card.destinationId) savedDestinationIds.add(card.destinationId);

  const items = places
    .filter(card => !fit.savedIds.has(card.id))
    .map(card => ({ card, fit: scoreFit(card, fit.profile, { savedDestinationIds }) }))
    .filter(entry => isRecommendation(entry.fit))
    .sort((a, b) => b.fit.score - a.fit.score)
    .slice(0, limit)
    .map(entry => ({ card: entry.card, reasons: entry.fit.reasons }));

  return NextResponse.json({ items, state: items.length ? "ok" : "no_matches" }, { headers: { "Cache-Control": "private, no-store" } });
}
