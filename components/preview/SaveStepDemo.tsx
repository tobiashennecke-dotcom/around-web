"use client";

import { useEffect, useRef, useState } from "react";
import type { ResolvedCard } from "@/lib/preview-content";
import { AroundMark } from "@/components/AroundLogo";
import { PreviewCard } from "./PreviewCard";

type Phase = "idle" | "tap" | "saved";

/**
 * Animated SAVE step: a tap lands on the save button, the AROUND mark fills
 * lime and a "Saved to My AROUND" note slides in, so partners see what the
 * Bildmarke means. Loops while the step is visible/active; with
 * prefers-reduced-motion it simply shows the saved state.
 */
export function SaveStepDemo({ card, active = true }: { card: ResolvedCard; active?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = active && inView;

  useEffect(() => {
    if (!running) {
      setPhase("idle");
      return;
    }
    if (reduced) {
      setPhase("saved");
      return;
    }
    const timers: number[] = [];
    const cycle = () => {
      setPhase("idle");
      timers.push(window.setTimeout(() => setPhase("tap"), 900));
      timers.push(window.setTimeout(() => setPhase("saved"), 1450));
      timers.push(window.setTimeout(cycle, 5600));
    };
    cycle();
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [running, reduced]);

  const saved = phase === "saved";

  return (
    <div ref={ref} className="pv-saveStep" data-phase={phase}>
      <PreviewCard
        stamp={card.stamp}
        kicker={card.kicker}
        title={card.title}
        description={card.description}
        accent={card.accent}
        media={card.media}
        withSave
        saved={saved}
        saveHint={saved ? "SAVED" : "SAVE"}
      />
      <div className="pv-saveToast" role="status" aria-live="polite">
        <span className="pv-saveToastBadge">
          <AroundMark className="pv-saveToastMark" />
        </span>
        <span>
          <strong>Saved to My AROUND.</strong> Ready for your next trip.
        </span>
      </div>
    </div>
  );
}
