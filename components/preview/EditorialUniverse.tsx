import { previewContent } from "@/lib/preview-content";

export function EditorialUniverse() {
  const { ticker, headlineLines } = previewContent.editorialUniverse;

  return (
    <section className="pv-universe" aria-label="Editorial universe">
      <p className="pv-srOnly">{ticker}</p>
      <div className="pv-marquee" aria-hidden="true">
        <div className="pv-marqueeTrack">
          <span>{ticker}</span>
          <span>{ticker}</span>
        </div>
      </div>
      <div className="container pv-universeHeadline">
        <h2 className="sectionTitle">
          {headlineLines.map((line) => (
            <span key={line} className="pv-block">
              {line}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
