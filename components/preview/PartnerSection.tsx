import { previewContent } from "@/lib/preview-content";
import { Reveal } from "./Reveal";

export function PartnerSection() {
  const { eyebrow, headlineLines, body, topics, subheading, helpItems, independenceLine } = previewContent.pr;

  return (
    <section className="section pv-section pv-dark pv-partner">
      <div className="container pv-partnerGrid">
        <Reveal className="pv-partnerIntro">
          <p className="eyebrow lime">{eyebrow}</p>
          <h2 className="sectionTitle">
            {headlineLines.map((line) => (
              <span key={line} className="pv-block">
                {line}
              </span>
            ))}
          </h2>
          {body.map((paragraph) => (
            <p key={paragraph} className="serif pv-partnerBody">
              {paragraph}
            </p>
          ))}
          <div className="pv-partnerTopics">
            {topics.map((topic) => (
              <span key={topic} className="pv-partnerTopic">
                {topic}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal className="pv-partnerHelp" delay={120}>
          <p className="eyebrow pv-partnerSubheading">{subheading}</p>
          <ul className="pv-partnerHelpList">
            {helpItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="serif pv-partnerIndependence">{independenceLine}</p>
          <a href="#contact" className="primary pv-partnerCta">
            {previewContent.contact.ctaLabel}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
