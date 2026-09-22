import { previewContent } from "@/lib/preview-content";
import { PreviewMedia } from "./PreviewMedia";
import { Reveal } from "./Reveal";

export function FieldStories() {
  const { eyebrow, headlineLines, cards } = previewContent.stories;

  return (
    <section className="section pv-section pv-stories">
      <div className="container">
        <Reveal>
          <p className="eyebrow lime">{eyebrow}</p>
          <h2 className="sectionTitle">
            {headlineLines.map((line) => (
              <span key={line} className="pv-block">
                {line}
              </span>
            ))}
          </h2>
        </Reveal>

        <div className="pv-storiesGrid">
          {cards.map((card, i) => (
            <Reveal
              key={card.key}
              as="article"
              className={`pv-storyCard pv-storyCard--${card.role} pv-storyCard--${card.accent}`}
              delay={i * 90}
            >
              <div className="pv-storyMedia">
                <PreviewMedia media={card.media} loading={card.role === "lead" ? "eager" : "lazy"} />
                <span className="pv-previewLabel">PREVIEW STORY</span>
              </div>
              <div className="pv-storyBody">
                <span className={`tag ${card.accent === "lime" ? "" : card.accent}`.trim()}>{card.category}</span>
                <p className="pv-storyTitle serif">{card.title}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
