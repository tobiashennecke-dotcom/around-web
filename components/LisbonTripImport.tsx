"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EditorialJourney } from "@/lib/types";
import { normalizeContentRole } from "@/lib/content-role";
import { createUserTrip, addItemToTrip, updateTripItem } from "@/lib/supabase/trips";
import { listSaves, toggleSave } from "@/lib/supabase/saves";



export function LisbonTripImport({ destinationId, journey }: { destinationId: string; journey: EditorialJourney }) {
  const router = useRouter();
  const resolvedCount = journey.days.reduce((count, day) => count + day.stops.length, 0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [newTripBusy, setNewTripBusy] = useState(false);

  async function startOwnTrip() {
    if (busy || newTripBusy) return;
    setNewTripBusy(true);
    setStatus("");
    try {
      const trip = await createUserTrip(`Meine Reise · ${journey.title}`, { destinationSourceId: destinationId });
      router.push(`/my-around/trips/${trip.id}`);
    } catch {
      setStatus("Deine eigene Reise konnte nicht angelegt werden. Bitte versuche es erneut.");
      setNewTripBusy(false);
    }
  }

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
      const trip = await createUserTrip(`AROUND JOURNEY · ${journey.title}`, { destinationSourceId: destinationId });
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
      setStatus(`Deine neue Reise wurde im Trip Planner angelegt: AROUND JOURNEY · ${journey.title}. Du kannst dort Termine und Stationen flexibel anpassen.`);
    } catch {
      setStatus(createdTrip
        ? "Die Reise konnte nur teilweise angelegt werden. Bitte prüfe den Trip Planner, bevor du erneut importierst."
        : "Die Reise konnte nicht angelegt werden. Bitte versuche es erneut.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="destinationJourneyChoose" aria-label="Deine Reise planen">
    <div className="eyebrow lime">YOUR TRIP. YOUR RULES.</div>
    <h3>SO GEHT DEINE REISE WEITER.</h3>
    <p className="destinationJourneyChooseIntro">Nutze unseren Reisevorschlag als Ausgangspunkt – oder starte mit einem leeren Trip und stelle dir deine eigenen Places zusammen.</p>
    <div className="destinationJourneyChoiceGrid">
      <div className="destinationJourneyChoice destinationJourneyChoice--edit">
        <span className="destinationJourneyChoiceIndex">01 / AROUND EDIT</span>
        <h4>BEISPIELREISE ÜBERNEHMEN.</h4>
        <p>Wir legen dir die ${resolvedCount} kuratierten Stationen mit Tageszuordnung in deinen Trip. Danach kannst du alles ändern.</p>
        <button type="button" className="destinationJourneyChoiceButton" onClick={importTrip} disabled={busy || newTripBusy}>
          {busy ? "Reise wird angelegt …" : "Beispielroute übernehmen →"}
        </button>
      </div>
      <div className="destinationJourneyChoice destinationJourneyChoice--own">
        <span className="destinationJourneyChoiceIndex">02 / YOUR WAY</span>
        <h4>EIGENE REISE PLANEN.</h4>
        <p>Beginne ohne vorgegebene Stationen. Wähle Golfplätze, Hotels, Restaurants und Erlebnisse in deinem Tempo.</p>
        <button type="button" className="destinationJourneyChoiceButton destinationJourneyChoiceButton--outline" onClick={startOwnTrip} disabled={busy || newTripBusy}>
          {newTripBusy ? "Dein Trip wird erstellt …" : "Leeren Trip starten →"}
        </button>
      </div>
    </div>
    <p className="destination48ImportHint">Beide Wege erstellen einen bearbeitbaren Trip. Es werden keine Buchungen vorgenommen.</p>
    {status && <p role="status" aria-live="polite" className="destination48ImportStatus">{status}</p>}
  </section>;
}
