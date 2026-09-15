import { StoryPlaceCard } from "@/components/StoryPlaceCard";
import type { ContentCard } from "@/lib/types";

/**
 * The v1.25c core feature: turns a Story's explicitly related Places
 * (story.related[] items where type === "place", nothing inferred) into a
 * full-width editorial module the reader can act on. Order is exactly the
 * editor's related[] order - no ranking by priority/featured/distance/Trip
 * Fit/commercial state.
 */
export function StoryPlaceBridge({ places }: { places: ContentCard[] }) {
  if (!places.length) return null;

  const isSingle = places.length === 1;
  const isDuo = places.length === 2;
  const layout = isSingle ? "single" : isDuo ? "duo" : "multi";

  return (
    <section className="section storyPlaceBridge">
      <div className="container">
        <div className="eyebrow blue">FROM THE STORY</div>
        <h2 className="sectionTitle storyPlaceBridgeTitle">{isSingle ? "GO DEEPER." : "BUILD THE TRIP."}</h2>
        {!isSingle && <p className="storyPlaceBridgeIntro">Die Orte aus dieser Geschichte – direkt als Reisebausteine.</p>}
        <div className={`storyPlaceBridgeGrid storyPlaceBridgeGrid--${layout}`}>
          {places.map((place, index) => (
            <StoryPlaceCard key={place.id} place={place} size={isSingle ? "wide" : isDuo ? "large" : index === 0 ? "large" : "regular"} />
          ))}
        </div>
      </div>
    </section>
  );
}
