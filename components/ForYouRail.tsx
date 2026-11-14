"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ContentCard as CardType } from "@/lib/types";
import { ContentCard } from "./ContentCard";
import { SAVES_CHANGED_EVENT } from "@/lib/supabase/saves";

type Item = { card: CardType; reasons: string[] };

/**
 * "Für dich" rail. Renders nothing for guests and for profiles without
 * matches, so the editorial page stays exactly as it was for them.
 */
export function ForYouRail({ title = "Für dich." }: { title?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<string>("loading");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/for-you?limit=6", { cache: "no-store" });
        const data = await response.json();
        if (!active) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setState(data.state || "no_matches");
      } catch {
        if (active) setState("error");
      }
    }
    load();
    window.addEventListener(SAVES_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(SAVES_CHANGED_EVENT, load);
    };
  }, []);

  if (state === "no_profile") {
    return (
      <section className="section forYouSection forYouSection--empty">
        <div className="container forYouPrompt">
          <div>
            <div className="eyebrow lime">FÜR DICH</div>
            <p className="serif">Sag uns, wie du reist, und AROUND zeigt dir, was dazu passt.</p>
          </div>
          <Link className="primary" href="/my-around/profil">Profil ausfüllen →</Link>
        </div>
      </section>
    );
  }
  if (!items.length) return null;

  return (
    <section className="section forYouSection">
      <div className="container">
        <div className="sectionHead compactHead">
          <div>
            <div className="eyebrow lime">FÜR DICH</div>
            <h2 className="sectionTitle">{title}</h2>
          </div>
          <p className="sectionNote serif">Nach deinem Profil ausgewählt. <Link href="/my-around/profil">Profil anpassen →</Link></p>
        </div>
        <div className="cardGrid forYouGrid">
          {items.map(item => (
            <div key={item.card.id} className="forYouItem">
              <ContentCard item={item.card} />
              {item.reasons.length ? <p className="forYouReasons">{item.reasons.join(" · ")}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
