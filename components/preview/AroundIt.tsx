import type { PartnerPreviewContent } from "@/lib/preview-content";
import { PreviewCard } from "./PreviewCard";
import { Reveal } from "./Reveal";

/**
 * "Around it": the anchor place stays put (sticky on desktop) while the
 * places around it scroll in one after another — STAY, then EAT, then the
 * STORY — so the page shows how one recommendation becomes a journey.
 */
export function AroundIt({ content }: { content: PartnerPreviewContent }) {
  const { eyebrow, headlineLines, body, anchor, connections } = content.aroundIt;

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

        <div className="pv-aroundItFlow">
          <div className="pv-aroundItAnchorCol">
            <div className="pv-aroundItAnchorSticky">
              <span className="eyebrow pv-aroundItStart">START HERE</span>
              <PreviewCard
                stamp={anchor.stamp}
                kicker={anchor.kicker}
                title={anchor.title}
                description={anchor.description}
                accent={anchor.accent}
                media={anchor.media}
                className="pv-aroundItAnchorCard"
              />
            </div>
          </div>

          <ol className="pv-aroundItTrail">
            {connections.map((connection, i) => (
              <Reveal as="li" key={connection.role} className={`pv-aroundItStop pv-aroundItStop--${connection.accent}`} delay={i * 60}>
                <span className="pv-aroundItStopRole">
                  <span className="pv-aroundItStopIndex">{String(i + 1).padStart(2, "0")}</span>
                  {connection.role}
                </span>
                <PreviewCard
                  stamp={connection.stamp || connection.role}
                  kicker={connection.kicker || connection.role}
                  title={connection.title}
                  description={connection.note}
                  accent={connection.accent}
                  media={connection.media}
                  className="pv-aroundItStopCard"
                />
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
