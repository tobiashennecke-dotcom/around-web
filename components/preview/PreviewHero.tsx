import type { PartnerPreviewContent } from "@/lib/preview-content";
import { heroImageUrl } from "@/lib/homepage-hero";
import { PreviewMedia } from "./PreviewMedia";

const DESKTOP_ASPECT = 16 / 9;
const MOBILE_ASPECT = 4 / 5;
const DESKTOP_WIDTHS = [900, 1400, 1900, 2400];
const MOBILE_WIDTHS = [640, 960, 1280];

function srcSet(image: Parameters<typeof heroImageUrl>[0], widths: number[], aspect: number) {
  return widths
    .map(width => {
      const url = heroImageUrl(image, width, aspect);
      return url ? `${url} ${width}w` : null;
    })
    .filter((entry): entry is string => Boolean(entry))
    .join(", ");
}

export function PreviewHero({ content }: { content: PartnerPreviewContent }) {
  const { eyebrow, headlineLines, subline, intro, scrollCue, media, desktopRaw, mobileRaw } = content.hero;
  const sublineWords = subline.split(" · ");

  return (
    <section id="top" className="pv-hero" aria-label="AROUND — Golf is where the journey starts.">
      <div className="pv-heroMedia" aria-hidden="true">
        {desktopRaw ? (
          <picture className="pv-heroPicture">
            <source media="(max-width: 620px)" srcSet={srcSet(mobileRaw ?? desktopRaw, MOBILE_WIDTHS, MOBILE_ASPECT)} sizes="100vw" />
            <img
              className="pv-heroImg"
              src={heroImageUrl(desktopRaw, DESKTOP_WIDTHS[DESKTOP_WIDTHS.length - 1], DESKTOP_ASPECT)}
              srcSet={srcSet(desktopRaw, DESKTOP_WIDTHS, DESKTOP_ASPECT)}
              sizes="100vw"
              width={DESKTOP_WIDTHS[DESKTOP_WIDTHS.length - 1]}
              height={Math.round(DESKTOP_WIDTHS[DESKTOP_WIDTHS.length - 1] / DESKTOP_ASPECT)}
              alt={desktopRaw.alt || mobileRaw?.alt || ""}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        ) : (
          <PreviewMedia media={media} loading="eager" fetchPriority="high" className="pv-heroImg" />
        )}
        <div className="pv-heroScrim" />
      </div>
      <div className="container pv-heroContent">
        <p className="eyebrow pv-heroEyebrow">{eyebrow}</p>
        <h1 className="pv-heroHeadline">
          {headlineLines.map(line => (
            <span key={line} className="pv-heroLine">
              {line}
            </span>
          ))}
        </h1>
        <p className="pv-heroSubline" aria-label={subline}>
          {sublineWords.map((word, i) => (
            <span key={word} className="pv-heroSublineWord">
              {word}
              {i < sublineWords.length - 1 ? (
                <span className="pv-heroSublineDot" aria-hidden="true">
                  ·
                </span>
              ) : null}
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
