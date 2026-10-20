import { NextResponse } from "next/server";
import { getOfflineContentIds } from "@/lib/content";

/**
 * POST { ids: string[] } -> { offline: string[] }
 * Public, read-only: reports which of the given editorial content ids are
 * currently switched offline, so saved items can be labelled "Derzeit nicht
 * verfügbar" instead of linking to a 404. Never touches user data.
 */
export async function POST(request: Request) {
  let ids: unknown = [];
  try {
    const body = await request.json();
    ids = body?.ids;
  } catch {
    return NextResponse.json({ offline: [] }, { status: 400 });
  }
  if (!Array.isArray(ids)) return NextResponse.json({ offline: [] }, { status: 400 });
  const offline = await getOfflineContentIds(ids.filter((id): id is string => typeof id === "string"));
  return NextResponse.json({ offline });
}
