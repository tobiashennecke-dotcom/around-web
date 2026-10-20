"use client";

import { useEffect, useState } from "react";
import { isSaved, SAVES_CHANGED_EVENT, toggleSave, type SavePayload } from "@/lib/supabase/saves";
import { addItemToTrip, createUserTrip } from "@/lib/supabase/trips";
import { normalizeContentRole } from "@/lib/content-role";
import type { ContentCard } from "@/lib/types";

type Props = {
  places: ContentCard[];
  tripTitle: string;
  destinationSourceId?: string;
};

function toPayload(place: ContentCard): SavePayload {
  return {
    sourceId: place.id,
    sourceType: place.type,
    sourceRole: normalizeContentRole(place.placeType),
    title: place.title,
    slug: place.slug
  };
}

/**
 * Story 2.0 "Daraus wird eine Reise": save every Place of the Story at once,
 * or turn them into a new Trip (status "idea", no dates). Uses only the
 * existing save and trip functions - no new product data structures.
 */
export function StoryTripActions({ places, tripTitle, destinationSourceId }: Props) {
  const [allSaved, setAllSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function sync() {
      try {
        const states = await Promise.all(places.map(place => isSaved(place.id)));
        if (active) setAllSaved(states.every(Boolean));
      } catch {
        // progressive enhancement
      }
    }
    sync();
    window.addEventListener(SAVES_CHANGED_EVENT, sync);
    return () => {
      active = false;
      window.removeEventListener(SAVES_CHANGED_EVENT, sync);
    };
  }, [places]);

  if (places.length < 2) return null;

  async function saveAll() {
    if (busy || allSaved) return;
    setBusy(true);
    setMessage("");
    try {
      for (const place of places) {
        if (!(await isSaved(place.id))) await toggleSave(toPayload(place));
      }
      setAllSaved(true);
      setMessage(`${places.length} Orte gemerkt.`);
    } catch {
      setMessage("Das hat nicht geklappt. Bitte noch einmal versuchen.");
    } finally {
      setBusy(false);
    }
  }

  async function createTrip() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const trip = await createUserTrip(tripTitle, { destinationSourceId });
      for (const place of places) {
        const payload = toPayload(place);
        await addItemToTrip(trip.id, payload, payload.sourceRole === "stay" ? { stayFullTrip: true } : {});
      }
      window.location.href = `/my-around/trips/${trip.id}`;
    } catch {
      setMessage("Der Trip konnte nicht angelegt werden. Bitte noch einmal versuchen.");
      setBusy(false);
    }
  }

  return (
    <div className="storyTripActions">
      <button type="button" className="storyTripActionPrimary" onClick={saveAll} disabled={busy || allSaved}>
        {allSaved ? "Alle gemerkt ✓" : `Alle ${places.length} Orte merken`}
      </button>
      <button type="button" className="storyTripActionSecondary" onClick={createTrip} disabled={busy}>
        Als Trip übernehmen
      </button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
