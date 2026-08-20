import { NextResponse } from "next/server";
import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { sanity } from "@/lib/sanity/client";

export async function GET(request: Request) {
  if (!sanity) {
    return NextResponse.json(
      { error: "Sanity is not configured." },
      { status: 503 }
    );
  }

  const handler = defineEnableDraftMode({
    client: sanity.withConfig({
      token: process.env.SANITY_VIEWER_TOKEN || ""
    })
  });

  return handler.GET(request);
}
