"use client";

import { useEffect, useRef, useState } from "react";
import type { PartnerPreviewContent } from "@/lib/preview-content";
import { PreviewCard } from "./PreviewCard";
import { PreviewSaveButton } from "./PreviewSaveButton";
import { Reveal } from "./Reveal";

type Phase = "idle" | "saved" | "trip";

/**
 * FIND IT. SAVE IT. GO THERE. — plays itself while in view: the place gets
 * saved (count goes up), then lands in a trip. Visitors can still click
 * Save themselves, which stops the autoplay. Reduced motion: static saved state.
 */
export function SaveDemo({ content }: { content: PartnerPreviewContent }) {
  const { eyebrow, headlineLines, body, card, destinationLabel, baseSavedCount } = content.saveDemo;
  const ref = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [inView, setInView] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (manual || !inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("saved");
      return;
    }
    const timers: number[] = [];
    const cycle = () => {
      setPhase("idle");
      timers.push(window.setTimeout(() => setPhase("saved"), 1100));
      timers.push(window.setTimeout(() => setPhase("trip"), 2600));
      timers.push(window.setTimeout(cycle, 6800));
    };
    cycle();
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [inView, manual]);

  const saved = phase !== "idle";
  const count = baseSavedCount + (saved ? 1 : 0);

  return (
    <section className="section pv-section pv-saveDemo">
      <div className="container pv-saveGrid">
        <Reveal className="pv-saveCopy">
          <p className="eyebrow lime">{eyebrow}</p>
          <h2 className="sectionTitle pv-saveHeadline" data-phase={phase}>
            {headlineLines.map((line, i) => (
              <span key={line} className="pv-block pv-saveHeadlineLine" data-step={i}>
                {line}
              </span>
            ))}
          </h2>
          {body.map((paragraph) => (
            <p key={paragraph} className="pv-saveBodyText">
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal className="pv-saveDemoCard" delay={120}>
          <div ref={ref} className="pv-saveDemoStage" data-phase={phase}>
            <PreviewCard
              stamp={card.stamp}
              kicker={card.kicker}
              title={card.title}
              description={card.description}
              accent={card.accent}
              media={card.media}
            />
            <div className="pv-saveActions">
              <PreviewSaveButton
                title={card.title}
                label="Save"
                saved={saved}
                onToggle={(next) => {
                  setManual(true);
                  setPhase(next ? "saved" : "idle");
                }}
              />
              <span className="secondary pv-saveGhost pv-saveTripButton" aria-disabled="true">
                {phase === "trip" ? "In your trip ✓" : "Add to Trip"}
              </span>
              <a href="#around-it" className="pv-saveAroundIt">
                Around it →
              </a>
            </div>
            <p className="pv-saveStatus" aria-live="polite">
              {phase === "trip"
                ? `${card.title} → ${destinationLabel} trip · ${count} saved places`
                : `${saved ? `${card.title} → Saved · ` : ""}${destinationLabel} · ${count} saved places`}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
