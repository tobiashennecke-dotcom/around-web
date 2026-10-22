import { draftMode } from "next/headers";
import { sanity } from "@/lib/sanity/client";

/**
 * Draft preview for Stories (opened from Sanity's Presentation tool).
 *
 * Only when Next's draft mode is enabled AND SANITY_VIEWER_TOKEN is set do we
 * read with perspective "drafts". Every other request - every normal visitor -
 * gets the published-only client, so unpublished content never leaks.
 * Same rule as lib/partner-preview.ts.
 */
export async function isDraftPreview(): Promise<boolean> {
  if (!sanity || !process.env.SANITY_VIEWER_TOKEN) return false;
  try {
    return (await draftMode()).isEnabled;
  } catch {
    // Outside a request (e.g. build-time helpers) there is no draft mode.
    return false;
  }
}

export async function storyReadClient() {
  if (!sanity) return null;
  if (await isDraftPreview()) {
    return sanity.withConfig({ token: process.env.SANITY_VIEWER_TOKEN, perspective: "drafts", useCdn: false });
  }
  return sanity;
}
