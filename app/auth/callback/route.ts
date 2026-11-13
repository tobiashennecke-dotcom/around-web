import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/my-around";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const failed = new URL("/account", requestUrl.origin);

  // Abbruch oder Fehler beim Anbieter (z. B. Google-Fenster geschlossen).
  if (requestUrl.searchParams.get("error")) {
    failed.searchParams.set("auth_error", "oauth_failed");
    return NextResponse.redirect(failed);
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined
      );
      if (error) {
        failed.searchParams.set("auth_error", "magic_link_failed");
        return NextResponse.redirect(failed);
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
