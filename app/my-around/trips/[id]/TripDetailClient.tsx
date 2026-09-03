"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SavePayload } from "@/lib/supabase/saves";
import {
  getUserTrip,
  removeItemFromTrip,
  updateTripItem,
  updateUserTrip,
  type TripSlot,
  type TripStatus,
  type UserTrip
} from "@/lib/supabase/trips";

const slotLabels: Record<TripSlot, string> = {
  flex: "Flexibel",
  morning: "Morgen",
  midday: "Mittag",
  afternoon: "Nachmittag",
  evening: "Abend",
  stay: "Stay"
};

function hrefFor(item: SavePayload) {
  if (item.sourceType === "destination") return `/destinations/${item.slug}`;
  if (item.sourceType === "place") return `/places/${item.slug}`;
  if (item.sourceType === "story") return `/stories/${item.slug}`;
  if (item.sourceType === "person") return `/people/${item.slug}`;
  if (item.sourceType === "product" || item.sourceType === "object") return `/objects/${item.slug}`;
  return "/discover";
}

function daysBetween(start?: string, end?: string) {
  if (!start || !end) return 3;
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  const difference = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(14, difference));
}

function dayDate(start: string | undefined, dayIndex: number) {
  if (!start) return "";
  const date = new Date(`${start}T12:00:00`);
  date.setDate(date.getDate() + dayIndex);
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(date);
}

export function TripDetailClient({ id }: { id: string }) {
  const [trip, setTrip] = useState<UserTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<TripStatus>("idea");
  const [savingMeta, setSavingMeta] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const result = await getUserTrip(id);
      setTrip(result.trip);
      if (result.trip) {
        setTitle(result.trip.title);
        setStartDate(result.trip.startDate || "");
        setEndDate(result.trip.endDate || "");
        setStatus(result.trip.status);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const dayCount = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  async function saveMeta() {
    if (!trip || !title.trim()) return;
    if (startDate && endDate && endDate < startDate) {
      setSaveMessage("");
      setSaveError("Das Bis-Datum liegt vor dem Von-Datum.");
      return;
    }

    setSavingMeta(true);
    setSaveMessage("");
    setSaveError("");
    try {
      const cleanTitle = title.trim();
      await updateUserTrip(trip.id, { title: cleanTitle, startDate, endDate, status });
      setTrip(current => current ? {
        ...current,
        title: cleanTitle,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
        updatedAt: new Date().toISOString()
      } : current);
      setTitle(cleanTitle);
      setSaveMessage("Plan gespeichert.");
      window.setTimeout(() => setSaveMessage(""), 2600);
    } catch (error) {
      console.error("AROUND trip save failed", error);
      setSaveError("Speichern fehlgeschlagen. Bitte noch einmal versuchen.");
    } finally {
      setSavingMeta(false);
    }
  }

  async function changeItem(sourceId: string, patch: { dayIndex?: number; slot?: TripSlot; note?: string }) {
    if (!trip) return;
    setSaveError("");

    const previous = trip;
    setTrip(current => current ? {
      ...current,
      updatedAt: new Date().toISOString(),
      items: current.items.map(item => item.sourceId === sourceId ? {
        ...item,
        dayIndex: "dayIndex" in patch ? patch.dayIndex : item.dayIndex,
        slot: patch.slot ?? item.slot,
        note: patch.note ?? item.note
      } : item)
    } : current);

    try {
      await updateTripItem(trip.id, sourceId, patch);
      setSaveMessage("Änderung gespeichert.");
      window.setTimeout(() => setSaveMessage(""), 1800);
    } catch (error) {
      console.error("AROUND trip item save failed", error);
      setTrip(previous);
      setSaveError("Änderung konnte nicht gespeichert werden.");
    }
  }

  async function remove(sourceId: string) {
    if (!trip) return;
    await removeItemFromTrip(trip.id, sourceId);
    await load();
  }

  if (loading) return <section className="section"><div className="container savedLoading">Trip wird geladen …</div></section>;
  if (!trip) return <section className="section"><div className="container"><h1>Trip nicht gefunden.</h1><Link className="textLink" href="/my-around/trips">Zurück →</Link></div></section>;

  const unplanned = trip.items.filter(item => item.dayIndex === undefined);
  const days = Array.from({ length: dayCount }, (_, dayIndex) => ({
    dayIndex,
    items: trip.items.filter(item => item.dayIndex === dayIndex)
  }));

  return (
    <>
      <section className="tripDetailHero">
        <div className="container tripDetailHeroGrid">
          <div>
            <div className="eyebrow lime">MY AROUND / TRIP</div>
            <h1>{trip.title}</h1>
          </div>
          <div className="tripHeroAside">
            <div className="drop drop--trip" aria-hidden="true" />
            <p className="serif">Aus Fundstücken wird Timing. Aus Timing wird eine Reise.</p>
          </div>
        </div>
      </section>

      <section className="section tripMetaSection">
        <div className="container">
          <div className="tripMetaEditor">
            <label><span>Trip</span><input value={title} onChange={event => setTitle(event.target.value)} /></label>
            <label><span>Von</span><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label>
            <label><span>Bis</span><input type="date" value={endDate} min={startDate || undefined} onChange={event => setEndDate(event.target.value)} /></label>
            <label><span>Status</span><select value={status} onChange={event => setStatus(event.target.value as TripStatus)}><option value="idea">Idee</option><option value="planning">Planung</option><option value="booked">Gebucht</option><option value="completed">Erlebt</option></select></label>
            <button type="button" className="primary" onClick={saveMeta} disabled={savingMeta || !title.trim()}>{savingMeta ? "Speichert …" : "Plan speichern →"}</button>
          </div>
          <div className="collectionPickerMessage" role="status" aria-live="polite">
            {saveError || saveMessage || "Tag, Zeit und Notizen werden automatisch gespeichert."}
          </div>
          <div className="tripDetailToolbar"><Link href="/my-around/trips">← Alle Trips</Link><Link href="/saved">+ Aus MY AROUND hinzufügen</Link></div>
        </div>
      </section>

      <section className="tripBoardSection">
        <div className="container tripBoard">
          {unplanned.length ? (
            <div className="tripDay tripDay--unplanned">
              <div className="tripDayHead"><span>00</span><h2>NOCH OFFEN.</h2><small>{unplanned.length} Items</small></div>
              <div className="tripDayItems">
                {unplanned.map(item => <TripItemRow key={item.sourceId} item={item} dayCount={dayCount} onChange={changeItem} onRemove={remove} />)}
              </div>
            </div>
          ) : null}

          {days.map(day => (
            <div className="tripDay" key={day.dayIndex}>
              <div className="tripDayHead"><span>{String(day.dayIndex + 1).padStart(2, "0")}</span><h2>DAY {day.dayIndex + 1}</h2><small>{dayDate(startDate, day.dayIndex)}</small></div>
              {day.items.length ? (
                <div className="tripDayItems">{day.items.map(item => <TripItemRow key={item.sourceId} item={item} dayCount={dayCount} onChange={changeItem} onRemove={remove} />)}</div>
              ) : <div className="tripDayEmpty">Noch frei. Gut so.</div>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function TripItemRow({
  item,
  dayCount,
  onChange,
  onRemove
}: {
  item: UserTrip["items"][number];
  dayCount: number;
  onChange: (sourceId: string, patch: { dayIndex?: number; slot?: TripSlot; note?: string }) => Promise<void>;
  onRemove: (sourceId: string) => Promise<void>;
}) {
  const [note, setNote] = useState(item.note || "");

  useEffect(() => {
    setNote(item.note || "");
  }, [item.note]);

  return (
    <article className="tripItemRow">
      <div className="tripItemIdentity"><span>{item.sourceType}</span><h3><Link href={hrefFor(item)}>{item.title}</Link></h3></div>
      <label className="tripItemControl"><span>Tag</span><select value={item.dayIndex === undefined ? "" : String(item.dayIndex)} onChange={event => onChange(item.sourceId, { dayIndex: event.target.value === "" ? undefined : Number(event.target.value) })}><option value="">Offen</option>{Array.from({ length: dayCount }, (_, index) => <option value={index} key={index}>Day {index + 1}</option>)}</select></label>
      <label className="tripItemControl"><span>Zeit</span><select value={item.slot || "flex"} onChange={event => onChange(item.sourceId, { slot: event.target.value as TripSlot })}>{Object.entries(slotLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label className="tripItemNote"><span>Notiz</span><input value={note} placeholder="Tee Time, Tisch, Idee …" onChange={event => setNote(event.target.value)} onBlur={() => { if (note !== (item.note || "")) onChange(item.sourceId, { note }); }} /></label>
      <button type="button" className="tripItemRemove" onClick={() => onRemove(item.sourceId)} aria-label={`${item.title} aus Trip entfernen`}>×</button>
    </article>
  );
}
