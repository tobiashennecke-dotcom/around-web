import { NextResponse } from "next/server";
import { searchContent } from "@/lib/sample-content";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || undefined;
  return NextResponse.json({ results: searchContent(q,type) });
}
