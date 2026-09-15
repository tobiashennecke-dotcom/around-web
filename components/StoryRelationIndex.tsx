import Link from "next/link";
import { contentHref } from "@/components/ContentCard";
import { contentTypeLabel } from "@/lib/content-role";
import type { ContentCard } from "@/lib/types";

/**
 * Compact "IN THIS STORY" index - orientation, not conversion. Renders every
 * canonical story.related[] item (any type) in its exact editorial order.
 * Deliberately carries no Trip/Save controls; that conversion moment belongs
 * to StoryPlaceBridge for Places only.
 */
export function StoryRelationIndex({ related }: { related: ContentCard[] }) {
  if (!related.length) return null;

  return (
    <nav className="storyRelationIndex" aria-label="In dieser Story">
      <div className="eyebrow lime">IN THIS STORY</div>
      <ul>
        {related.map(item => (
          <li key={item.id}>
            <Link href={contentHref(item)}>
              <span className="storyRelationType">{contentTypeLabel(item.type, item.placeType)}</span>
              <span className="storyRelationTitle">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
