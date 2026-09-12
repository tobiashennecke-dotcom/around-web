import { MediaGallery } from "@/components/MediaGallery";
import type { PlaceMediaItem } from "@/lib/types";

/**
 * Thin compatibility wrapper: existing Place galleries (PLAY, STAY, generic
 * Place) already fetch PlaceMediaItem[] (MediaItem + the legacy `layout`
 * field, which the shared tile grid ignores by design - see lib/types.ts).
 * All actual gallery/lightbox behavior lives in the global MediaGallery.
 */
export function PlaceGallery({ title, items }: { title: string; items: PlaceMediaItem[] }) {
  return <MediaGallery items={items} title={title} />;
}
