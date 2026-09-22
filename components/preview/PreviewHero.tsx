import { previewContent } from "@/lib/preview-content";
import { PreviewMedia } from "./PreviewMedia";

export function PreviewHero() {
  const { eyebrow, headlineLines, subline, intro, scrollCue, media } = previewContent.hero;
  const sublineWords = subline.split(" · ");

  return (
    <section id="top" className="pv-hero" aria-label="AROUND — Golf is where the journey starts.">
      <div className="pv-heroMedia" aria-hidden="true">
        <PreviewMedia media={media} loading="eager" fetchPriority="high" className="pv-heroImg" />
        <div className="pv-heroScrim" />
      </div>
      <div className="container pv-heroContent">
        <p className="eyebrow pv-heroEyebrow">{eyebrow}</p>
        <h1 className="pv-heroHeadline">
          {headlineLines.map((line) => (
            <span key={line} className="pv-heroLine">
              {line}
            </span>
          ))}
        </h1>
        <p className="pv-heroSubline" aria-label={subline}>
          {sublineWords.map((word, i) => (
            <span key={word} className="pv-heroSublineWord">
              {word}
              {i < sublineWords.length - 1 ? <span className="pv-heroSublineDot" aria-hidden="true">·</span> : null}
            </span>
          ))}
        </p>
        <p className="serif pv-heroIntro">{intro}</p>
      </div>
      <div className="pv-heroScroll" aria-hidden="true">
        <span>{scrollCue}</span>
        <span className="pv-heroScrollMark">↓</span>
      </div>
    </section>
  );
}
