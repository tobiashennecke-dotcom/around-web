"use client";

import { useState } from "react";
import type { PartnerPreviewContent } from "@/lib/preview-content";
import { PreviewCard } from "./PreviewCard";
import { PreviewSaveButton } from "./PreviewSaveButton";
import { Reveal } from "./Reveal";

export function SaveDemo({ content }: { content: PartnerPreviewContent }) {
  const { eyebrow, headlineLines, body, card, destinationLabel, baseSavedCount } = content.saveDemo;
  const [saved, setSaved] = useState(false);
  const count = baseSavedCount + (saved ? 1 : 0);

  return (
    <section className="section pv-section pv-saveDemo">
      <div className="container pv-saveGrid">
        <Reveal className="pv-saveCopy">
          <p className="eyebrow lime">{eyebrow}</p>
          <h2 className="sectionTitle">
            {headlineLines.map((line) => (
              <span key={line} className="pv-block">
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
          <PreviewCard stamp={card.stamp} kicker={card.kicker} title={card.title} description={card.description} accent={card.accent} />
          <div className="pv-saveActions">
            <PreviewSaveButton title={card.title} label="Save" saved={saved} onToggle={setSaved} />
            <span className="secondary pv-saveGhost" aria-disabled="true">
              Add to Trip
            </span>
            <a href="#around-it" className="pv-saveAroundIt">
              Around it →
            </a>
          </div>
          <p className="pv-saveStatus" aria-live="polite">
            {saved ? `${card.title} → Gespeichert · ` : ""}
            {destinationLabel} · {count} saved places
          </p>
        </Reveal>
      </div>
    </section>
  );
}
