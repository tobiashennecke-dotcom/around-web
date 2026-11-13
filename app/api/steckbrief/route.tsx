import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { profileFromRow } from "@/lib/profile/profile";
import { computeBadges, passStats } from "@/lib/profile/badges";
import { buildSteckbrief } from "@/lib/profile/steckbrief";
import { renderSteckbrief } from "@/lib/profile/steckbrief-image";
import { AVATAR_BUCKET, providerAvatarUrl } from "@/lib/profile/avatar";

/** The signed-in user's Golfer-Steckbrief as a 1080×1920 PNG for Instagram Stories. */
export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: row }, { data: markRows }, { count: tripCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_place_marks").select("source_id,kind,country,destination_id,title_snapshot,played_on").eq("user_id", user.id).order("played_on", { ascending: false }),
    supabase.from("trips").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  ]);

  const profile = profileFromRow(row);
  const marks = (markRows || []).map(mark => ({
    sourceId: mark.source_id as string,
    kind: mark.kind as "played" | "bucket",
    country: mark.country || undefined,
    destinationId: mark.destination_id || undefined
  }));
  const stats = passStats(marks);
  const stamps = (markRows || []).filter(mark => mark.kind === "played").map(mark => mark.title_snapshot || "Platz");
  const card = buildSteckbrief(profile, stats, stamps, computeBadges({ profile, marks, tripCount: tripCount || 0 }));

  let avatarUrl: string | null = null;
  if (row?.avatar_path) {
    const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(row.avatar_path, 120);
    avatarUrl = data?.signedUrl ?? null;
  }
  avatarUrl = avatarUrl || providerAvatarUrl(user.user_metadata);

  return renderSteckbrief({ ...card, avatarUrl });
}
