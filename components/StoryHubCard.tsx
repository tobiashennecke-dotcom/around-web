import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { PremiumAccessBadge } from "@/components/PremiumAccessBadge";
import { storyFormatLabel } from "@/lib/story-format";
import type { ContentCard as ContentCardType } from "@/lib/types";

/**
 * Story-specific card for the Hub's format shelves and All Stories archive.
 * Reuses the existing card/cardMedia/cardBody/cardMeta/tag classes so it
 * still looks like the rest of AROUND, but shows format + reading time as
 * the primary metadata instead of ContentCard's generic "STORY · Featured"
 * line - "Featured" is an internal editorial control, not reader-facing
 * information.
 */
export function StoryHubCard({ story }: { story: ContentCardType }) {
  const href = `/stories/${story.slug}`;
  const meta = [storyFormatLabel(story.storyFormat), story.readingTime ? `${story.readingTime} MIN` : undefined]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  return (
    <article className="card card--blue storyHubCard">
      <Link href={href} className="cardMedia" aria-label={story.title}>
        {story.image ? (
          <img src={story.image} alt={story.title} loading="lazy" />
        ) : (
          <div className="storyHubCardTypographic" aria-hidden="true">
            <span>{storyFormatLabel(story.storyFormat)}</span>
          </div>
        )}
        {story.accessTier === "premium" && <PremiumAccessBadge />}
      </Link>
      <div className="cardBody">
        <span className="tag blue">{storyFormatLabel(story.storyFormat)}</span>
        <h3>
          <Link href={href}>{story.title}</Link>
        </h3>
        {story.description && <p>{story.description}</p>}
        <div className="cardMeta">
          <span>{meta}</span>
          <SaveButton sourceId={story.id} sourceType={story.type} title={story.title} slug={story.slug} />
        </div>
      </div>
    </article>
  );
}
