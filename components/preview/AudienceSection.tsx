import type { PartnerPreviewContent } from "@/lib/preview-content";
import { Reveal } from "./Reveal";

/**
 * "Built around the traveller": what an AROUND account adds (profile,
 * "Für dich" recommendations, trip planning) and what partners get.
 * Blue = AROUND's planning/information signal. Anything not live yet
 * carries an explicit status tag instead of being presented as shipped.
 */
export function AudienceSection({ content }: { content: PartnerPreviewContent }) {
  const { eyebrow, headlineLines, intro, items, footnote } = content.audience;

  return (
    <section id="for-travellers" className="section pv-section pv-audience">
      <div className="container">
        <Reveal>
          <p className="eyebrow pv-audienceEyebrow">{eyebrow}</p>
          <h2 className="sectionTitle">
            {headlineLines.map((line) => (
              <span key={line} className="pv-block">
                {line}
              </span>
            ))}
          </h2>
          <div className="pv-audienceIntro">
            {intro.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </Reveal>

        <ol className="pv-audienceGrid">
          {items.map((item, i) => (
            <Reveal key={`${item.number}-${item.label}`} as="li" className="pv-audienceItem" delay={i * 80}>
              <div className="pv-audienceItemHead">
                <span className="pv-audienceNumber">{item.number}</span>
                <span className="eyebrow pv-audienceLabel">{item.label}</span>
              </div>
              <h3 className="pv-audienceHeadline">{item.headline}</h3>
              <p className="pv-audienceCopy">{item.copy}</p>
              {item.status ? <span className="pv-audienceStatus">{item.status}</span> : null}
            </Reveal>
          ))}
        </ol>

        {footnote ? (
          <Reveal className="pv-audienceFootnote">
            <p>{footnote}</p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
