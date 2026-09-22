import { previewContent } from "@/lib/preview-content";

export function PreviewFooter() {
  const { tagline, instagram, closing } = previewContent.footer;

  return (
    <footer className="pv-footer">
      <div className="container pv-footerTop">
        <div className="eyebrow lime">AROUND · PRIVATE PREVIEW</div>
        <div className="footerGiant" aria-label="AROUND">
          AROUND
        </div>
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
