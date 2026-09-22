import type { PartnerPreviewContent } from "@/lib/preview-content";
import { Reveal } from "./Reveal";

export function PreviewStatus({ content }: { content: PartnerPreviewContent }) {
  const { eyebrow, headlineLines, body } = content.status;

  return (
    <section className="section pv-section pv-dark pv-status">
      <div className="container">
        <Reveal>
          <p className="eyebrow lime">{eyebrow}</p>
          <h2 className="sectionTitle pv-statusHeadline">
            {headlineLines.map((line) => (
              <span key={line} className="pv-block">
                {line}
              </span>
            ))}
          </h2>
          {body.map((paragraph) => (
            <p key={paragraph} className="serif pv-statusBody">
              {paragraph}
            </p>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
