"use client";

import { useEffect, useRef, useState } from "react";
import type { JourneyStep, PartnerPreviewContent } from "@/lib/preview-content";
import { PreviewCard } from "./PreviewCard";
import { PreviewMedia } from "./PreviewMedia";

function StepPreview({ step }: { step: JourneyStep }) {
  if (step.kind === "discover") {
    return (
      <div className="pv-journeyPreview pv-journeyDiscover">
        <div className="pv-discoverBar">Golf und die Lücke danach…</div>
        <div className="pv-discoverFilters">
          {step.filters.map((f) => (
            <span key={f} className="tag pv-discoverTag">
              {f}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (step.kind === "story") {
    return (
      <article className="storyFeature storyFeature--secondary storyFeature--typographic pv-journeyPreview pv-journeyStory">
        <div className="storyFeatureMedia">
          {step.story.media ? (
            <PreviewMedia media={step.story.media} loading="lazy" />
          ) : (
            <div className="storyFeatureTypographic" aria-hidden="true">
              <span>STORY</span>
            </div>
          )}
        </div>
        <div className="storyFeatureBody">
          <div className="storyFeatureKicker">{step.story.kicker}</div>
          <h3 className="storyFeatureTitle">{step.story.title}</h3>
          <p className="storyFeatureDeck">{step.story.deck}</p>
        </div>
      </article>
    );
  }

  return (
    <div className="pv-journeyPreview">
      <PreviewCard
        stamp={step.card.stamp}
        kicker={step.card.kicker}
        title={step.card.title}
        description={step.card.description}
        accent={step.card.accent}
        media={step.card.media}
        withSave={step.kind === "save"}
      />
    </div>
  );
}

export function ProductJourney({ content }: { content: PartnerPreviewContent }) {
  const { eyebrow, headlineLines, closing, steps } = content.productJourney;
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const targets = refs.current.filter((el): el is HTMLDivElement => Boolean(el));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.stepIndex);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="section pv-section pv-dark pv-journey" aria-label="Product journey">
      <div className="container">
        <p className="eyebrow lime">{eyebrow}</p>
        <h2 className="sectionTitle pv-journeyTitle">
          {headlineLines.map((line) => (
            <span key={line} className="pv-block">
              {line}
            </span>
          ))}
        </h2>
      </div>

      <div className="container pv-journeyDesktop">
        <div className="pv-journeySteps">
          {steps.map((step, i) => (
            <div
              key={step.label || i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-step-index={i}
              className="pv-journeyStep"
              data-active={i === active}
            >
              <span className="pv-journeyLabel">{step.label}</span>
              <p className="pv-journeyCopy">{step.copy}</p>
            </div>
          ))}
        </div>
        <div className="pv-journeySticky">
          <div className="pv-journeyStickyInner">
            {steps.map((step, i) => (
              <div key={step.label || i} className="pv-journeyPanel" data-active={i === active} aria-hidden={i !== active}>
                <StepPreview step={step} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container pv-journeyMobile">
        {steps.map((step, i) => (
          <div key={step.label || i} className="pv-journeyMobileStep">
            <span className="pv-journeyLabel">{step.label}</span>
            <p className="pv-journeyCopy">{step.copy}</p>
            <StepPreview step={step} />
          </div>
        ))}
      </div>

      <div className="container pv-journeyClosing">
        <p className="sectionTitle pv-journeyClosingTitle">{closing}</p>
      </div>
    </section>
  );
}
