"use client";

import { useEffect, useState } from "react";
import type { SavePayload } from "@/lib/supabase/saves";
import {
  addItemToTrip,
  createUserTrip,
  listUserTrips,
  type UserTrip
} from "@/lib/supabase/trips";

export function TripPicker({ item, compact = false }: { item: SavePayload; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<UserTrip[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const isStay = item.sourceType === "place" && item.sourceRole === "stay";

  async function load() {
    const result = await listUserTrips();
    setTrips(result.trips);
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function add(trip: UserTrip, wholeTrip = false) {
    setBusy(true);
    setMessage("");
    try {
      await addItemToTrip(trip.id, item, isStay ? { stayFullTrip: wholeTrip } : {});
      setMessage(wholeTrip ? `„${item.title}“ für die ganze Reise gesetzt.` : `Zu „${trip.title}“ hinzugefügt.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd() {
    if (!title.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const trip = await createUserTrip(title, {
        destinationSourceId: item.sourceType === "destination" ? item.sourceId : undefined
      });
      await addItemToTrip(trip.id, item, isStay ? { stayFullTrip: true } : {});
      setTitle("");
      setMessage(isStay ? `„${trip.title}“ erstellt · ${item.title} für die ganze Reise gesetzt.` : `„${trip.title}“ erstellt und hinzugefügt.`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`tripPicker ${compact ? "tripPicker--compact" : ""}`}>
      <button type="button" className="tripPickerTrigger" onClick={() => setOpen(value => !value)} aria-expanded={open}>+ Trip</button>
      {open ? (
        <div className="tripPickerPanel">
          <div className="collectionPickerHead">
            <div><div className="eyebrow lime">PLANEN</div><strong>{isStay ? "Stay zu Trip" : "Zu Trip"}</strong></div>
            <button type="button" className="collectionPickerClose" onClick={() => setOpen(false)} aria-label="Schließen">×</button>
          </div>

          {isStay ? <p className="tripPickerStayHint">Unterkünfte laufen über mehrere Nächte. Du kannst sie sofort für die ganze Reise setzen oder den Zeitraum später im Plan festlegen.</p> : null}

          {trips.length ? (
            <div className={`collectionPickerList ${isStay ? "collectionPickerList--stay" : ""}`}>
              {trips.map(trip => {
                const contains = trip.items.some(existing => existing.sourceId === item.sourceId);
                if (!isStay) {
                  return <button type="button" key={trip.id} disabled={busy || contains} onClick={() => add(trip)}><span>{trip.title}</span><small>{contains ? "Enthalten" : `${trip.items.length} Bausteine +`}</small></button>;
                }
                return (
                  <div className="tripPickerStayRow" key={trip.id}>
                    <div><strong>{trip.title}</strong><small>{contains ? "Bereits im Trip" : `${trip.items.length} Bausteine`}</small></div>
                    {contains ? <span className="tripPickerContained">Enthalten</span> : <div className="tripPickerStayActions">
                      <button type="button" disabled={busy} onClick={() => add(trip, true)}>Ganze Reise</button>
                      <button type="button" disabled={busy} onClick={() => add(trip, false)}>Zeitraum offen +</button>
                    </div>}
                  </div>
                );
              })}
            </div>
          ) : <p className="collectionPickerEmpty">Noch kein Trip. Erstelle direkt deinen ersten.</p>}

          <div className="collectionPickerCreate">
            <input value={title} onChange={event => setTitle(event.target.value)} placeholder="z. B. Chiemgau · 5 Nächte" onKeyDown={event => { if (event.key === "Enter") createAndAdd(); }} />
            <button type="button" onClick={createAndAdd} disabled={busy || !title.trim()}>Erstellen +</button>
          </div>
          {message ? <div className="collectionPickerMessage">{message}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
