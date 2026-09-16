import type { TripStoryRecommendation } from "@/lib/trip-stories";
import { ContentCard } from "./ContentCard";

function matchContextLabel(recommendation: TripStoryRecommendation): string {
  if (recommendation.matchedPlaceIds.length >= 2) {
    return `MATCHES ${recommendation.matchedPlaceIds.length} PLACES IN YOUR TRIP`;
  }
  if (recommendation.matchedPlaceIds.length === 1) {
    return "MATCHES A PLACE IN YOUR TRIP";
  }
  return "FROM YOUR DESTINATION";
}

type Props = {
  recommendations: TripStoryRecommendation[];
  /** Defaults to the Trip Planner's own intro; MY AROUND Home passes a variant tuned to whether the focus Trip is actually future-dated. */
  intro?: string;
  /**
   * MY AROUND Home already renders inside its own outer .container - set
   * this so the rail skips its second nested .container and aligns exactly
   * with the dashboard's other modules (Focus Trip / Saved / Collections /
   * Trips). Trip Detail keeps the default (false): full section, own
   * .container. Same presentation markup either way - only the wrapper differs.
   */
  embedded?: boolean;
};

/**
 * TRIP -> RELEVANT STORIES -> BETTER TRIP - the reverse of Story -> Place ->
 * Trip. Purely editorial distribution via the canonical story.related[]
 * graph, never Trip Fit and never a path back into trip_items: a
 * recommendation can be opened or saved, never turned into a Stop. Renders
 * nothing without at least one recommendation.
 */
export function TripStoryRail({
  recommendations,
  intro = "Stories zu den Orten, die du eingeplant hast.",
  embedded = false
}: Props) {
  if (!recommendations.length) return null;

  const content = (
    <>
      <div className="eyebrow blue">AROUND / READ BEFORE YOU GO</div>
      <h2 className="sectionTitle" id="trip-story-rail-title">READ BEFORE YOU GO.</h2>
      <p className="storyRailIntro">{intro}</p>
      <div className="cardGrid">
        {recommendations.map(recommendation => (
          <div className="tripStoryCard" key={recommendation.story.id}>
            <ContentCard item={recommendation.story} />
            <p className="tripStoryMatch">{matchContextLabel(recommendation)}</p>
          </div>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <section className="section storyRailSection tripStoryRail" aria-labelledby="trip-story-rail-title">
        {content}
      </section>
    );
  }

  return (
    <section className="section storyRailSection tripStoryRail">
      <div className="container">{content}</div>
    </section>
  );
}
