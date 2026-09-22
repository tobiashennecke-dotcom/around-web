import { previewContent } from "@/lib/preview-content";
import { Reveal } from "./Reveal";

export function EditorialPrinciples() {
  const { eyebrow, headlineLines, intro, principles } = previewContent.editorialPrinciples;

  return (
    <section className="section pv-section pv-principles">
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
          <div className="pv-principlesIntro">
            {intro.map((line) => (
              <p key={line} className="serif">
                {line}
              </p>
            ))}
          </div>
        </Reveal>

        <div className="pv-principlesGrid">
          {principles.map((principle, i) => (
            <Reveal key={principle.number} className="pv-principle" delay={i * 90}>
              <span className="pv-principleNumber lime">{principle.number}</span>
              <span className="eyebrow pv-principleLabel">{principle.label}</span>
              <h3 className="pv-principleHeadline">{principle.headline}</h3>
              <p className="pv-principleCopy">{principle.copy}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
