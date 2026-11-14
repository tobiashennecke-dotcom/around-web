import type { PartnerPreviewContent } from "@/lib/preview-content";
import { AroundWordmark } from "@/components/AroundLogo";

export function PreviewFooter({ content }: { content: PartnerPreviewContent }) {
  const { tagline, instagram, closing } = content.footer;

  return (
    <footer className="pv-footer">
      <div className="container pv-footerTop">
        <div className="eyebrow lime">AROUND · PRIVATE PREVIEW</div>
        <AroundWordmark className="pv-footerLogo" title="AROUND" />
        <p className="pv-footerTagline">{tagline}</p>
      </div>
      <div className="container pv-footerLinks">
        <a href={instagram.href} target="_blank" rel="noreferrer noopener">
          {instagram.label}
        </a>
        <a href="#contact">Contact</a>
      </div>
      <div className="container pv-footerClosing">
        <p className="sectionTitle pv-footerClosingTitle">{closing}</p>
      </div>
    </footer>
  );
}
