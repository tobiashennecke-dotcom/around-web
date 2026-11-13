import { createClient } from "@/lib/supabase/client";

export const AVATAR_BUCKET = "avatars";
export const AVATAR_SIZE = 512;
export const AVATAR_CHANGED_EVENT = "around:avatar-changed";

export function avatarPath(userId: string) {
  return `${userId}/avatar.webp`;
}

/** Google sign-in delivers a picture URL in the user metadata. */
export function providerAvatarUrl(metadata: Record<string, unknown> | undefined | null): string | null {
  const url = metadata?.avatar_url ?? metadata?.picture;
  return typeof url === "string" && /^https:\/\//.test(url) ? url : null;
}

/** Center-crops to a square and scales to 512 px. WebP, JPEG as fallback. */
export async function resizeToSquare(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close?.();
  const webp = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.86));
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!jpeg) throw new Error("encode");
  return jpeg;
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(AVATAR_CHANGED_EVENT));
}

/** Signed URL of the user's own picture, else the Google picture, else null. */
export async function getAvatarUrl(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("avatar_path,avatar_updated_at").eq("id", user.id).maybeSingle();
  if (profile?.avatar_path) {
    const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(profile.avatar_path, 60 * 60);
    if (data?.signedUrl) return `${data.signedUrl}&v=${encodeURIComponent(profile.avatar_updated_at || "")}`;
  }
  return providerAvatarUrl(user.user_metadata);
}

export async function uploadAvatar(file: File): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase nicht verbunden");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet");
  if (!file.type.startsWith("image/")) throw new Error("Bitte ein Bild wählen.");
  const blob = await resizeToSquare(file);
  const path = avatarPath(user.id);
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, blob, { upsert: true, contentType: blob.type, cacheControl: "3600" });
  if (error) throw error;
  const { error: profileError } = await supabase.from("profiles")
    .upsert({ id: user.id, avatar_path: path, avatar_updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (profileError) throw profileError;
  notify();
}

export async function removeAvatar(): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath(user.id)]);
  await supabase.from("profiles").update({ avatar_path: null, avatar_updated_at: new Date().toISOString() }).eq("id", user.id);
  notify();
}
