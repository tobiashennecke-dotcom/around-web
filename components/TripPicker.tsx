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

  async function load() {
    const result = await listUserTrips();
    setTrips(result.trips);
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function add(trip: UserTrip) {
    setBusy(true);
    setMessage("");
    try {
      await addItemToTrip(trip.id, item);
      setMessage(`Zu „${trip.title}“ hinzugefügt.`);
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
      await addItemToTrip(trip.id, item);
      setTitle("");
      setMessage(`„${trip.title}“ erstellt und hinzugefügt.`);
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
            <div><div className="eyebrow lime">PLANEN</div><strong>Zu Trip</strong></div>
            <button type="button" className="collectionPickerClose" onClick={() => setOpen(false)} aria-label="Schließen">×</button>
          </div>

          {trips.length ? (
            <div className="collectionPickerList">
              {trips.map(trip => {
                const contains = trip.items.some(existing => existing.sourceId === item.sourceId);
                return <button type="button" key={trip.id} disabled={busy || contains} onClick={() => add(trip)}><span>{trip.title}</span><small>{contains ? "Enthalten" : `${trip.items.length} Bausteine +`}</small></button>;
              })}
            </div>
          ) : <p className="collectionPickerEmpty">Noch kein Trip. Erstelle direkt deinen ersten.</p>}

          <div className="collectionPickerCreate">
            <input value={title} onChange={event => setTitle(event.target.value)} placeholder="z. B. Lisbon · 4 Tage" onKeyDown={event => { if (event.key === "Enter") createAndAdd(); }} />
            <button type="button" onClick={createAndAdd} disabled={busy || !title.trim()}>Erstellen +</button>
          </div>
          {message ? <div className="collectionPickerMessage">{message}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
