import Link from "next/link";
import type { FeaturedDestinationCard } from "@/lib/stories-hub";

/**
 * Makes the Story Graph visible to the reader: a curated Destination plus
 * how many Stories qualify for it under the v1.25a graph rule (direct
 * Destination reference, or a related Place whose destination is this one)
 * and one representative Story title - never geography, never text matching.
 */
export function DestinationExploreCard({ destination }: { destination: FeaturedDestinationCard }) {
  const href = `/destinations/${destination.slug}`;
  const storyCountLabel = `${destination.storyCount} ${destination.storyCount === 1 ? "STORY" : "STORIES"}`;

  return (
    <article className="destinationExploreCard">
      <Link href={href} className="destinationExploreMedia" aria-label={destination.title}>
        {destination.image ? (
          <img src={destination.image} alt={destination.title} loading="lazy" />
        ) : (
          <div className="destinationExploreTypographic" aria-hidden="true">
            <span>{destination.title}</span>
          </div>
        )}
      </Link>
      <div className="destinationExploreBody">
        {destination.kicker && <div className="eyebrow lime">{destination.kicker}</div>}
        <h3>
          <Link href={href}>{destination.title}</Link>
        </h3>
        <div className="destinationExploreMeta">
          <span>{storyCountLabel}</span>
          {destination.representativeStory && <span className="destinationExploreStory">{destination.representativeStory.title}</span>}
        </div>
        <Link href={href} className="destinationExploreCta">
          EXPLORE {destination.title.toUpperCase()} →
        </Link>
      </div>
    </article>
  );
}
