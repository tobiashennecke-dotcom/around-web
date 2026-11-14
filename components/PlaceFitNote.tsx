"use client";

import { useEffect, useState } from "react";
import { loadProfile } from "@/lib/profile/profile";
import { hasFitSignals, isRecommendation, scoreFit, type FitItem } from "@/lib/personalization/score";

/** "Passt zu dir" on a Place page, with the reasons. Nothing for guests or non-matches. */
export function PlaceFitNote({ item }: { item: FitItem }) {
  const [reasons, setReasons] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    loadProfile()
      .then(result => {
        if (!active || !result || !hasFitSignals(result.profile)) return;
        const fit = scoreFit(item, result.profile);
        if (isRecommendation(fit)) setReasons(fit.reasons);
      })
      .catch(() => undefined);
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  if (!reasons.length) return null;
  return (
    <p className="placeFitNote">
      <strong>PASST ZU DIR</strong>
      <span>{reasons.join(" · ")}</span>
    </p>
  );
}
