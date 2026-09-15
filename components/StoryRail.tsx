import type { ContentCard as ContentCardType } from "@/lib/types";
import { ContentCard } from "./ContentCard";

type Props = {
  stories: ContentCardType[];
  eyebrow: string;
  title: string;
  intro?: string;
  className?: string;
};

/**
 * Reusable contextual Story rail for Place/Destination/Person pages. Renders
 * nothing when there are no related Stories - editorial distribution should
 * never show an empty or placeholder section.
 */
export function StoryRail({ stories, eyebrow, title, intro, className }: Props) {
  if (!stories.length) return null;

  return (
    <section className={`section storyRailSection ${className || ""}`.trim()}>
      <div className="container">
        <div className="eyebrow blue">{eyebrow}</div>
        <h2 className="sectionTitle">{title}</h2>
        {intro && <p className="storyRailIntro">{intro}</p>}
        <div className="cardGrid">
          {stories.map(story => (
            <ContentCard key={story.id} item={story} />
          ))}
        </div>
      </div>
    </section>
  );
}
