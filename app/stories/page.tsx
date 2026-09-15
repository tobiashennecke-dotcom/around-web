import type { Metadata } from "next";
import { getStoriesHub } from "@/lib/stories-hub";
import { StoryFeature } from "@/components/StoryFeature";
import { StoryHubCard } from "@/components/StoryHubCard";
import { StoryShelf } from "@/components/StoryShelf";
import { DestinationExploreCard } from "@/components/DestinationExploreCard";

export const metadata: Metadata = {
  title: "Stories — AROUND",
  description:
    "Golf-Reise-Geschichten über Orte, Menschen, Plätze und alles, was die Reise lohnenswert macht - die editorielle Startseite von AROUND."
};

export default async function StoriesPage() {
  const hub = await getStoriesHub();

  return (
    <main>
      <section className="section storiesMasthead">
        <div className="container">
          <div className="eyebrow blue">AROUND STORIES</div>
          <h1 className="sectionTitle storiesMastheadTitle">
            GOLF IS WHERE
            <br />
            THE JOURNEY STARTS.
          </h1>
          <p className="storiesMastheadIntro">Stories über Plätze, Menschen und Orte, für die sich die Reise lohnt.</p>
          <div className="storiesEdition">
            <span>{hub.editionLabel}</span>
            {hub.intro && <p>{hub.intro}</p>}
          </div>
        </div>
      </section>

      {hub.leadStory && (
        <section className="section storiesEditorialNow">
          <div className="container">
            <div className="eyebrow lime">EDITORIAL NOW</div>
            <div className="editorialNowGrid">
              <StoryFeature story={hub.leadStory} variant="lead" />
              {hub.secondaryStories.length > 0 && (
                <div className="editorialNowSecondary">
                  {hub.secondaryStories.map(story => (
                    <StoryFeature key={story.id} story={story} variant="secondary" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {hub.formats.length > 0 && (
        <section className="section storiesFormatIndex">
          <div className="container">
            <div className="eyebrow blue">EXPLORE BY STORY</div>
            <h2 className="sectionTitle storiesFormatIndexTitle">Different stories answer different questions.</h2>
            <nav className="formatNav" aria-label="Story-Formate">
              {hub.formats.map(format => (
                <a key={format.format} href={`#${format.anchor}`} className="formatTile">
                  <span className="formatTileLabel">{format.label}</span>
                  <span className="formatTileCount">{format.stories.length} {format.stories.length === 1 ? "STORY" : "STORIES"}</span>
                </a>
              ))}
            </nav>
          </div>
        </section>
      )}

      {hub.formats.map(format => (
        <StoryShelf key={format.format} format={format} />
      ))}

      {hub.featuredDestinations.length > 0 && (
        <section className="section storiesExploreByPlace">
          <div className="container">
            <div className="eyebrow lime">EXPLORE BY PLACE</div>
            <h2 className="sectionTitle storiesExploreByPlaceTitle">Where the Story Graph becomes visible.</h2>
            <div className="destinationExploreGrid">
              {hub.featuredDestinations.map(destination => (
                <DestinationExploreCard key={destination.id} destination={destination} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section storiesArchive">
        <div className="container">
          <div className="eyebrow blue">THE JOURNAL.</div>
          <h2 className="sectionTitle storiesArchiveTitle">All Stories.</h2>
          {hub.stories.length > 0 ? (
            <div className="cardGrid">
              {hub.stories.map(story => (
                <StoryHubCard key={story.id} story={story} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

// AROUND editorial freshness: refresh published Sanity content without a redeploy.
export const revalidate = 30;
