import type { PartnerPreviewContent } from "@/lib/preview-content";
import { Reveal } from "./Reveal";

export function PreviewContact({ content }: { content: PartnerPreviewContent }) {
  const { headlineLines, body, person, role, email, ctaLabel } = content.contact;
  const mailto = `mailto:${email}?subject=${encodeURIComponent("AROUND — Partner Inquiry")}`;

  return (
    <section id="contact" className="section pv-section pv-contact">
      <div className="container pv-contactGrid">
        <Reveal className="pv-contactCopy">
          <h2 className="sectionTitle">
            {headlineLines.map((line) => (
              <span key={line} className="pv-block">
                {line}
              </span>
            ))}
          </h2>
          {body.map((paragraph) => (
            <p key={paragraph} className="pv-contactBody">
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal className="pv-contactCard" delay={100}>
          <p className="pv-contactPerson">{person}</p>
          <p className="eyebrow pv-contactRole">{role}</p>
          <a href={mailto} className="primary pv-contactCta">
            {ctaLabel}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
