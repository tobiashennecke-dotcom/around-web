"use client";

import { useState } from "react";
import type { ContentCard } from "@/lib/types";
import { normalizeContentRole } from "@/lib/content-role";
import { createUserTrip, addItemToTrip, updateTripItem, type TripSlot } from "@/lib/supabase/trips";
import { listSaves, toggleSave } from "@/lib/supabase/saves";

type Stop = { slug: string; dayIndex: number; slot: TripSlot; note: string };

const STOPS: Stop[] = [
  { slug: "boca-do-inferno-cascais", dayIndex: 0, slot: "afternoon", note: "AROUND / DAY 1: Atlantikküste und Felsformation" },
  { slug: "the-albatroz-hotel-cascais", dayIndex: 0, slot: "stay", note: "AROUND / 48 HOURS: vorgeschlagene Unterkunft in Cascais – keine Buchung" },
  { slug: "mar-do-inferno-cascais", dayIndex: 0, slot: "evening", note: "AROUND / DAY 1: Restaurant; Reservierung selbst prüfen" },
  { slug: "oitavos-dunes", dayIndex: 1, slot: "morning", note: "AROUND / DAY 2: Golfrunde; Tee Time separat reservieren" },
  { slug: "casa-das-historias-paula-rego", dayIndex: 1, slot: "afternoon", note: "AROUND / DAY 2: Kunst und Architektur; Öffnungszeiten prüfen" },
  { slug: "prado-lissabon", dayIndex: 1, slot: "evening", note: "AROUND / DAY 2: Abendessen in Lissabon; Reservierung prüfen" }
];

export function LisbonTripImport({ destinationId, places }: { destinationId: string; places: ContentCard[] }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function importTrip() {
    if (busy) return;
    const resolved = STOPS.map(stop => ({ ...stop, place: places.find(place => place.slug === stop.slug) }));
    if (resolved.some(stop => !stop.place)) {
      setStatus("Einige Stationen sind noch nicht verfügbar. Bitte versuche es später erneut.");
      return;
    }

    setBusy(true);
    setStatus("");
    let createdTrip = false;
    try {
      const trip = await createUserTrip("48 HOURS · Lissabon & Cascais", { destinationSourceId: destinationId });
      createdTrip = true;
      const existing = new Set((await listSaves()).items.map(item => item.sourceId));
      for (const stop of resolved) {
        const place = stop.place!;
        const payload = {
          sourceId: place.id,
          sourceType: "place",
          sourceRole: normalizeContentRole(place.placeType),
          title: place.title,
          slug: place.slug
        };
        // The Trip Planner resolves titles/slugs from saved_items for account users.
        if (!existing.has(place.id)) {
          await toggleSave(payload);
          existing.add(place.id);
        }
        await addItemToTrip(trip.id, payload, place.placeType === "stay"
          ? { stayStartDay: 0, stayEndDay: 2, stayFullTrip: true }
          : {});
        await updateTripItem(trip.id, place.id, {
          dayIndex: stop.dayIndex,
          slot: stop.slot,
          note: stop.note
        });
      }
      setStatus("Deine neue Reise wurde im Trip Planner angelegt: 48 HOURS · Lissabon & Cascais. Du kannst dort Termine und Stationen flexibel anpassen.");
    } catch {
      setStatus(createdTrip
        ? "Die Reise konnte nur teilweise angelegt werden. Bitte prüfe den Trip Planner, bevor du erneut importierst."
        : "Die Reise konnte nicht angelegt werden. Bitte versuche es erneut.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="destination48Import">
    <button type="button" className="primary" onClick={importTrip} disabled={busy}>
      {busy ? "Reise wird angelegt …" : "Alle 6 Stationen in neuen Trip übernehmen →"}
    </button>
    <p className="destination48ImportHint">Erstellt eine neue, editierbare Reise. Keine Buchungen und keine verbindlichen Zeiten.</p>
    {status && <p role="status" aria-live="polite" className="destination48ImportStatus">{status}</p>}
  </div>;
}
