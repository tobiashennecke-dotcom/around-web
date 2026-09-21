import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { PremiumAccessBadge } from "@/components/PremiumAccessBadge";
import { storyFormatLabel } from "@/lib/story-format";
import type { ContentCard as ContentCardType } from "@/lib/types";

type Variant = "lead" | "secondary" | "wide";

type Props = {
  story: ContentCardType;
  variant: Variant;
  /**
   * Optional override for the lead image's loading behavior. Defaults to
   * "eager" for variant="lead" (its usual placement is above the fold on the
   * Stories Hub) and "lazy" otherwise. Pass "lazy" explicitly when a lead
   * feature is rendered further down the page - e.g. the homepage STORIES
   * section - where eager loading would compete with above-the-fold assets.
   */
  imageLoading?: "eager" | "lazy";
};

/**
 * Purpose-built editorial Story feature for the Stories Hub's EDITORIAL NOW
 * module and single-Story format shelves - deliberately not the generic
 * ContentCard, since a lead Story needs cinematic image treatment (or a
 * confident typographic surface when no image exists yet) rather than a
 * uniform grid card.
 */
export function StoryFeature({ story, variant, imageLoading }: Props) {
  const href = `/stories/${story.slug}`;
  const metaParts = [storyFormatLabel(story.storyFormat), story.readingTime ? `${story.readingTime} MIN` : undefined].filter(
    (part): part is string => Boolean(part)
  );
  const loading = imageLoading ?? (variant === "lead" ? "eager" : "lazy");

  return (
    <article className={`storyFeature storyFeature--${variant} ${story.image ? "storyFeature--withImage" : "storyFeature--typographic"}`}>
      <Link href={href} className="storyFeatureMedia" aria-label={story.title}>
        {story.image ? (
          <img src={story.image} alt={story.title} loading={loading} />
        ) : (
          <div className="storyFeatureTypographic" aria-hidden="true">
            <span>{storyFormatLabel(story.storyFormat)}</span>
          </div>
        )}
        {story.accessTier === "premium" && <PremiumAccessBadge />}
      </Link>
      <div className="storyFeatureBody">
        <div className="storyFeatureMeta">{metaParts.join(" · ")}</div>
        {story.kicker && <div className="storyFeatureKicker">{story.kicker}</div>}
        <h3 className="storyFeatureTitle">
          <Link href={href}>{story.title}</Link>
        </h3>
        {variant !== "secondary" && story.description && <p className="storyFeatureDeck">{story.description}</p>}
        <div className="storyFeatureFooter">
          <Link href={href} className="storyFeatureCta">
            READ STORY →
          </Link>
          <SaveButton sourceId={story.id} sourceType={story.type} title={story.title} slug={story.slug} label="Story merken" />
        </div>
      </div>
    </article>
  );
}
