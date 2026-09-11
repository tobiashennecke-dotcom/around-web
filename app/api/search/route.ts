import { NextResponse } from "next/server";
import { getSearchContent, getTripAwareSearchContent } from "@/lib/content";

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

  return NextResponse.json({ results });
}
