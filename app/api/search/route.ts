import { NextResponse } from "next/server";
import { getSearchContent, getTripAwareSearchContent } from "@/lib/content";
import { loadFitProfile } from "@/lib/personalization/server";
import { hasFitSignals, personalizeOrder } from "@/lib/personalization/score";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || undefined;
  const role = searchParams.get("role") || undefined;
  const anchorIdsParam = searchParams.get("anchorPlaceIds");
  const destinationId = searchParams.get("destinationId") || undefined;
  const anchorPlaceIds = anchorIdsParam ? anchorIdsParam.split(",").map(id => id.trim()).filter(Boolean) : undefined;

  const results = (anchorPlaceIds?.length || destinationId)
    ? await getTripAwareSearchContent(q, type, role, { anchorPlaceIds, destinationId })
    : await getSearchContent(q, type, role);

  // Light personal boost for signed-in users with a profile; editorial ranking stays the base.
  let ordered = results;
  try {
    const fit = await loadFitProfile();
    if (fit && hasFitSignals(fit.profile)) ordered = personalizeOrder(results, fit.profile, fit.context);
  } catch {
    ordered = results;
  }

  return NextResponse.json({ results: ordered });
}
