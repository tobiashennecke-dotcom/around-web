import { previewContent } from "@/lib/preview-content";
import { PreviewCard } from "./PreviewCard";
import { Reveal } from "./Reveal";

export function AroundIt() {
  const { eyebrow, headlineLines, body, anchor, connections } = previewContent.aroundIt;

  return (
    <section id="around-it" className="section pv-section pv-aroundIt">
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
          <p className="pv-aroundItBody">{body}</p>
        </Reveal>

        <Reveal className="pv-aroundItComposition" delay={100}>
          <div className="pv-aroundItAnchor">
            <PreviewCard
              stamp={anchor.stamp}
              kicker={anchor.kicker}
              title={anchor.title}
              accent={anchor.accent}
              className="pv-aroundItAnchorCard"
            />
          </div>
          <div className="pv-aroundItConnections">
            {connections.map((connection) => (
              <div key={connection.role} className={`pv-aroundItChip pv-aroundItChip--${connection.accent}`}>
                <span className="eyebrow">{connection.role}</span>
                <span className="pv-aroundItChipTitle">{connection.title}</span>
                <span className="pv-aroundItChipNote">{connection.note}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
