import { StoryFeature } from "@/components/StoryFeature";
import { StoryHubCard } from "@/components/StoryHubCard";
import type { StoryFormatShelf } from "@/lib/stories-hub";

/**
 * One editorial shelf per Story format. Deliberately varies layout by count
 * instead of always rendering the same grid: a single Story becomes a wide
 * horizontal teaser (not one lonely small card), while 2+ Stories use the
 * standard editorial card grid.
 */
export function StoryShelf({ format }: { format: StoryFormatShelf }) {
  if (!format.stories.length) return null;

  return (
    <section id={format.anchor} className="section storyShelf">
      <div className="container">
        <div className="eyebrow blue">{format.label}</div>
        {format.descriptor && <p className="storyShelfDescriptor">{format.descriptor}</p>}
        {format.stories.length === 1 ? (
          <StoryFeature story={format.stories[0]} variant="wide" />
        ) : (
          <div className="cardGrid storyShelfGrid">
            {format.stories.map(story => (
              <StoryHubCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
