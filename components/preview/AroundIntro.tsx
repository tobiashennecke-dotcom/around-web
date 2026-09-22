"use client";

import { useState } from "react";
import type { PartnerPreviewContent } from "@/lib/preview-content";
import { PreviewMedia } from "./PreviewMedia";
import { Reveal } from "./Reveal";

export function AroundIntro({ content }: { content: PartnerPreviewContent }) {
  const { eyebrow, headlineLines, body, chapters } = content.intro;
  const [active, setActive] = useState(chapters[0].key);

  return (
    <section id="about" className="section pv-section pv-intro">
      <div className="container pv-introGrid">
        <Reveal className="pv-introCopy">
          <p className="eyebrow lime">{eyebrow}</p>
          <h2 className="sectionTitle">
            {headlineLines.map((line) => (
              <span key={line} className="pv-block">
                {line}
              </span>
            ))}
          </h2>
          {body.map((paragraph, i) => (
            <p key={paragraph} className={i === body.length - 1 ? "serif pv-introLast" : "pv-introP"}>
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal className="pv-introMedia" delay={120}>
          <div className="pv-chapterStage">
            {chapters.map((chapter) => (
              <div key={chapter.key} className="pv-chapterFrame" data-active={chapter.key === active}>
                <PreviewMedia
                  media={chapter.media}
                  loading={chapter.key === chapters[0].key ? "eager" : "lazy"}
                  className="pv-chapterImg"
                />
                <span className="pv-chapterLabelMobile">{chapter.label}</span>
                <span className="pv-chapterCaption">{chapter.caption}</span>
              </div>
            ))}
          </div>
          <div className="pv-chapterTabs" role="tablist" aria-label="PLAY, STAY, EAT, DO">
            {chapters.map((chapter) => (
              <button
                key={chapter.key}
                type="button"
                role="tab"
                aria-selected={chapter.key === active}
                className="pv-chapterTab"
                data-active={chapter.key === active}
                onClick={() => setActive(chapter.key)}
              >
                {chapter.label}
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
