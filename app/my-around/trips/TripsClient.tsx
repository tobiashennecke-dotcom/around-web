"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  createUserTrip,
  deleteUserTrip,
  listUserTrips,
  TRIPS_CHANGED_EVENT,
  type UserTrip
} from "@/lib/supabase/trips";

function dateLabel(trip: UserTrip) {
  if (!trip.startDate && !trip.endDate) return "DATUM OFFEN";
  if (trip.startDate && trip.endDate) return `${trip.startDate} → ${trip.endDate}`;
  return trip.startDate || trip.endDate || "DATUM OFFEN";
}

export function TripsClient() {
  const [trips, setTrips] = useState<UserTrip[]>([]);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"guest" | "account">("guest");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await listUserTrips();
      setTrips(result.trips);
      setMode(result.mode);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    window.addEventListener(TRIPS_CHANGED_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(TRIPS_CHANGED_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  async function create() {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const trip = await createUserTrip(title);
      setTitle("");
      window.location.href = `/my-around/trips/${trip.id}`;
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Trip wirklich löschen? Deine Saves und Collections bleiben erhalten.")) return;
    await deleteUserTrip(id);
    await load();
  }

  return (
    <div className="tripsWorkspace">
      <div className="collectionsStatusBar">
        <div><span className={`syncDot ${mode === "account" ? "syncDot--account" : ""}`} /><strong>{mode === "account" ? "Synchronisiert" : "Auf diesem Gerät"}</strong></div>
        <div className="tripWorkspaceLinks"><Link href="/my-around/collections">Collections →</Link><Link href="/saved">MY AROUND →</Link></div>
      </div>

      <div className="tripCreateBar">
        <div>
          <div className="eyebrow">NEUER TRIP</div>
          <h2>WOHIN ALS NÄCHSTES?</h2>
        </div>
        <div className="collectionCreateControls">
          <input value={title} onChange={event => setTitle(event.target.value)} placeholder="z. B. Lisbon · 4 Tage" onKeyDown={event => { if (event.key === "Enter") create(); }} />
          <button type="button" className="primary" onClick={create} disabled={busy || !title.trim()}>Trip anlegen →</button>
        </div>
      </div>

      {loading ? <div className="savedLoading">Trips werden geladen …</div> : null}

      {!loading && !trips.length ? (
        <div className="collectionsEmpty">
          <div className="collectionEmptyIndex">00</div>
          <div><h3>Noch kein Trip.</h3><p>Starte hier direkt – oder verwandle eine bestehende Collection in einen Reiseplan.</p></div>
          <Link className="textLink" href="/my-around/collections">Collections öffnen →</Link>
        </div>
      ) : null}

      {trips.length ? (
        <div className="tripGrid">
          {trips.map((trip, index) => (
            <article className="tripCard" key={trip.id}>
              <div className="tripCardMeta"><span>{String(index + 1).padStart(2, "0")}</span><span>{trip.status.toUpperCase()}</span></div>
              <div className="tripCardDate">{dateLabel(trip)}</div>
              <h3><Link href={`/my-around/trips/${trip.id}`}>{trip.title}</Link></h3>
              <p>{trip.items.length} Baustein{trip.items.length === 1 ? "" : "e"} im Plan.</p>
              <div className="userCollectionActions">
                <Link href={`/my-around/trips/${trip.id}`}>Plan öffnen →</Link>
                <button type="button" onClick={() => remove(trip.id)}>Löschen</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
