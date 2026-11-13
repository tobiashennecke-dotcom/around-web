import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBot, sanitizeAnalyticsPayload } from "@/lib/analytics/sanitize";

/**
 * Intake for consent-aware product analytics (analytics_events).
 * The browser cannot write that table directly: rows are validated here and
 * written with the server-only secret key. Always answers 204 so analytics
 * never surfaces an error in the product.
 */
export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204 });
  if (isBot(request.headers.get("user-agent"))) return done;

  const admin = createAdminClient();
  if (!admin) return done;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return done;
  }

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  const row = sanitizeAnalyticsPayload(payload, userId);
  if (!row) return done;

  await admin.from("analytics_events").insert(row);
  return done;
}
