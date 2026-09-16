"use client";

import Link from "next/link";
import { CollectionPicker } from "@/components/CollectionPicker";
import { TripPicker } from "@/components/TripPicker";
import type { SavePayload } from "@/lib/supabase/saves";
import { contentTypeLabel } from "@/lib/content-role";
import {
  isCollectionEligibleSavedItem,
  isTripEligibleSavedItem,
  savedItemPrimaryAction,
  savedLibraryHref
} from "@/lib/saved-content";

type Props = {
  item: SavePayload;
  index: number;
  removing: boolean;
  onRemove: (sourceId: string) => void;
};

/**
 * One row in the Saved Library. Actions are content-aware: a saved Story
 * never gets a TripPicker (Story -> related Place -> Trip is the intended
 * path, not Story -> Trip item), while an eligible Place/Destination does.
 * CollectionPicker stays available for everything except a saved Collection.
 */
export function SavedLibraryItem({ item, index, removing, onRemove }: Props) {
  const href = savedLibraryHref(item);

  return (
    <article className="savedRowV14" data-content-type={item.sourceType}>
      <div className="savedRowIndex">{String(index + 1).padStart(2, "0")}</div>
      <div className="savedRowType">{contentTypeLabel(item.sourceType, item.sourceRole)}</div>
      <h3><Link href={href}>{item.title}</Link></h3>
      <div className="savedRowActions">
        {isCollectionEligibleSavedItem(item) && <CollectionPicker item={item} compact />}
        {isTripEligibleSavedItem(item) && <TripPicker item={item} compact />}
        <Link href={href} className="savedOpen">{savedItemPrimaryAction(item)}</Link>
        <button
          type="button"
          className="savedRemove"
          onClick={() => onRemove(item.sourceId)}
          disabled={removing}
          aria-label={`${item.title} aus MY AROUND entfernen`}
        >
          {removing ? "…" : "×"}
        </button>
      </div>
    </article>
  );
}
