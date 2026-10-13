"use client";

import { useState } from "react";
import type { EditorialJourney } from "@/lib/types";
import { normalizeContentRole } from "@/lib/content-role";
import { createUserTrip, addItemToTrip, updateTripItem } from "@/lib/supabase/trips";
import { listSaves, toggleSave } from "@/lib/supabase/saves";



export function LisbonTripImport({ destinationId, journey }: { destinationId: string; journey: EditorialJourney }) {
  const resolvedCount = journey.days.reduce((count, day) => count + day.stops.length, 0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function importTrip() {
    if (busy) return;
    const resolved = journey.days.flatMap((day, dayIndex) => day.stops.map(stop => ({ ...stop, dayIndex })));
    if (!resolved.length || resolved.some(stop => !stop.place)) {
      setStatus("Einige Stationen sind noch nicht verfügbar. Bitte versuche es später erneut.");
      return;
    }

    setBusy(true);
    setStatus("");
    let createdTrip = false;
    try {
      const trip = await createUserTrip(`48 HOURS · ${journey.title}`, { destinationSourceId: destinationId });
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
          ? { stayStartDay: stop.dayIndex, stayEndDay: journey.days.length, stayFullTrip: stop.dayIndex === 0 }
          : {});
        await updateTripItem(trip.id, place.id, {
          dayIndex: stop.dayIndex,
          slot: stop.slot,
          note: `AROUND / DAY ${stop.dayIndex + 1}: ${stop.copy || stop.period || ""}`
        });
      }
      setStatus(`Deine neue Reise wurde im Trip Planner angelegt: 48 HOURS · ${journey.title}. Du kannst dort Termine und Stationen flexibel anpassen.`);
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
      {busy ? "Reise wird angelegt …" : "Alle {resolvedCount} Stationen in neuen Trip übernehmen →"}
    </button>
    <p className="destination48ImportHint">Erstellt eine neue, editierbare Reise. Keine Buchungen und keine verbindlichen Zeiten.</p>
    {status && <p role="status" aria-live="polite" className="destination48ImportStatus">{status}</p>}
  </div>;
}
