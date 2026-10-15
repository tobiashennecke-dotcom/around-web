import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The callback must not silently pretend a failed code exchange succeeded.
 * Never include the auth code, token, or provider error description in redirects.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flowId = url.searchParams.get("sb_flow_id");
  const providerError = url.searchParams.get("error");
  if (providerError || !code) {
    return NextResponse.redirect(new URL("/account?auth_error=invalid_link", url.origin));
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/account?auth_error=unavailable", url.origin));
  }

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    );
    if (error) {
      console.error("[auth/callback] code exchange failed:", error.name);
      return NextResponse.redirect(new URL("/account?auth_error=exchange_failed", url.origin));
    }
  } catch {
    return NextResponse.redirect(new URL("/account?auth_error=exchange_failed", url.origin));
  }

  return NextResponse.redirect(new URL("/account?auth_success=1", url.origin));
}
