import { NextResponse } from "next/server";
import { getSearchContent } from "@/lib/content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || undefined;
  const results = await getSearchContent(q,type);
  return NextResponse.json({ results });
}
