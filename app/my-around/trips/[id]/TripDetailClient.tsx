"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

const slotOrder: Record<TripSlot, number> = {
  morning: 10,
  midday: 20,
  afternoon: 30,
  evening: 40,
  stay: 50,
  flex: 60
};

const statusLabels: Record<TripStatus, string> = {
  idea: "Idee",
  planning: "Planung",
  booked: "Gebucht",
  completed: "Erlebt"
};

function hrefFor(item: SavePayload) {
  if (item.sourceType === "destination") return `/destinations/${item.slug}`;
  if (item.sourceType === "place") return `/places/${item.slug}`;
  if (item.sourceType === "story") return `/stories/${item.slug}`;
  if (item.sourceType === "person") return `/people/${item.slug}`;
  if (item.sourceType === "product" || item.sourceType === "object") return `/objects/${item.slug}`;
  return "/discover";
}

function plannerType(type: string) {
  if (type === "destination") return { label: "Destination", className: "tripType--destination" };
  if (type === "place") return { label: "Place", className: "tripType--place" };
  if (type === "story") return { label: "Story", className: "tripType--story" };
  if (type === "person") return { label: "People", className: "tripType--person" };
  if (type === "product" || type === "object") return { label: "Object", className: "tripType--object" };
  return { label: type, className: "tripType--default" };
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

function fullDayDate(start: string | undefined, dayIndex: number) {
  if (!start) return "Datum offen";
  const date = new Date(`${start}T12:00:00`);
  date.setDate(date.getDate() + dayIndex);
  return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long" }).format(date);
}

function tripDateRange(start?: string, end?: string) {
  if (!start && !end) return "Termin offen";
  const format = (value: string) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
  if (start && end) return `${format(start)} – ${format(end)}`;
  return start ? `ab ${format(start)}` : `bis ${format(end as string)}`;
}

function sortItems(items: UserTrip["items"]) {
  return [...items].sort((a, b) => {
    const aSlot = slotOrder[(a.slot || "flex") as TripSlot];
    const bSlot = slotOrder[(b.slot || "flex") as TripSlot];
    if (aSlot !== bSlot) return aSlot - bSlot;
    return a.sortOrder - b.sortOrder;
  });
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
  const [mode, setMode] = useState<"guest" | "account">("guest");
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragTargetDay, setDragTargetDay] = useState<number | "open" | null>(null);
  const autosaveReady = useRef(false);

  async function load() {
    setLoading(true);
    try {
      const result = await getUserTrip(id);
      setTrip(result.trip);
      setMode(result.mode);
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

  useEffect(() => {
    autosaveReady.current = false;
    load().finally(() => {
      window.setTimeout(() => { autosaveReady.current = true; }, 0);
    });
  }, [id]);

  const dayCount = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (!autosaveReady.current || !trip || loading || savingMeta || !title.trim()) return;
    if (startDate && endDate && endDate < startDate) return;

    const cleanTitle = title.trim();
    const same = cleanTitle === trip.title
      && (startDate || undefined) === trip.startDate
      && (endDate || undefined) === trip.endDate
      && status === trip.status;
    if (same) return;

    const timer = window.setTimeout(async () => {
      setSaveError("");
      try {
        await updateUserTrip(trip.id, { title: cleanTitle, startDate, endDate, status });
        setTrip(current => current ? {
          ...current,
          title: cleanTitle,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status,
          updatedAt: new Date().toISOString()
        } : current);
        setSaveMessage(mode === "guest" ? "Automatisch auf diesem Gerät gespeichert." : "Automatisch synchronisiert.");
        window.setTimeout(() => setSaveMessage(""), 2200);
      } catch (error) {
        console.error("AROUND trip autosave failed", error);
        setSaveError("Autosave fehlgeschlagen. Bitte 'Plan speichern' verwenden.");
      }
    }, 550);

    return () => window.clearTimeout(timer);
  }, [title, startDate, endDate, status, trip, loading, savingMeta, mode]);

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

  async function moveItem(sourceId: string, currentDay: number | undefined, direction: -1 | 1) {
    if (direction === 1 && currentDay === undefined) {
      await changeItem(sourceId, { dayIndex: 0 });
      return;
    }
    if (currentDay === undefined) return;
    const next = currentDay + direction;
    if (next < 0) {
      await changeItem(sourceId, { dayIndex: undefined });
      return;
    }
    if (next >= dayCount) return;
    await changeItem(sourceId, { dayIndex: next });
  }

  async function dropOnDay(dayIndex: number | undefined) {
    if (!dragSourceId) return;
    const sourceId = dragSourceId;
    setDragSourceId(null);
    setDragTargetDay(null);
    await changeItem(sourceId, { dayIndex });
  }

  if (loading) return <section className="section"><div className="container savedLoading">Trip wird geladen …</div></section>;
  if (!trip) return <section className="section"><div className="container"><h1>Trip nicht gefunden.</h1><Link className="textLink" href="/my-around/trips">Zurück →</Link></div></section>;

  const unplanned = sortItems(trip.items.filter(item => item.dayIndex === undefined));
  const days = Array.from({ length: dayCount }, (_, dayIndex) => ({
    dayIndex,
    items: sortItems(trip.items.filter(item => item.dayIndex === dayIndex))
  }));
  const plannedCount = trip.items.length - unplanned.length;

  return (
    <>
      <section className="tripDetailHero tripDetailHero--v18">
        <div className="container tripDetailHeroGrid tripDetailHeroGrid--v18">
          <div>
            <div className="eyebrow lime">MY AROUND / TRIP</div>
            <h1>{trip.title}</h1>
            <div className="tripHeroMetaLine">
              <span>{tripDateRange(startDate, endDate)}</span>
              <span>{dayCount} {dayCount === 1 ? "Tag" : "Tage"}</span>
              <span>{trip.items.length} {trip.items.length === 1 ? "Fundstück" : "Fundstücke"}</span>
            </div>
          </div>
          <div className="tripHeroAside tripHeroAside--v18">
            <div className="tripHeroStatus"><span>Status</span><strong>{statusLabels[status]}</strong></div>
            <div className="tripHeroProgress"><span>Im Plan</span><strong>{plannedCount}/{trip.items.length}</strong><div><i style={{ width: `${trip.items.length ? Math.round((plannedCount / trip.items.length) * 100) : 0}%` }} /></div></div>
            <p className="serif">Dein Plan muss nicht perfekt sein. Er muss dich nur weiterbringen.</p>
          </div>
        </div>
      </section>

      <section className="section tripMetaSection tripMetaSection--v18 tripMetaSection--v181">
        <div className="container">
          <div className="tripMetaEditor tripMetaEditor--desktop">
            <label><span>Trip</span><input value={title} onChange={event => setTitle(event.target.value)} /></label>
            <label><span>Von</span><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label>
            <label><span>Bis</span><input type="date" value={endDate} min={startDate || undefined} onChange={event => setEndDate(event.target.value)} /></label>
            <label><span>Status</span><select value={status} onChange={event => setStatus(event.target.value as TripStatus)}><option value="idea">Idee</option><option value="planning">Planung</option><option value="booked">Gebucht</option><option value="completed">Erlebt</option></select></label>
            <button type="button" className="primary" onClick={saveMeta} disabled={savingMeta || !title.trim()}>{savingMeta ? "Speichert …" : "Plan speichern →"}</button>
          </div>

          <details className="tripMetaMobile">
            <summary>
              <div>
                <span className="tripMetaMobileKicker">Trip Setup</span>
                <strong>{title || trip.title}</strong>
                <small>{tripDateRange(startDate, endDate)} · {statusLabels[status]}</small>
              </div>
              <b>Bearbeiten +</b>
            </summary>
            <div className="tripMetaMobileFields">
              <label><span>Trip</span><input value={title} onChange={event => setTitle(event.target.value)} /></label>
              <div className="tripMetaMobileDates">
                <label><span>Von</span><input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label>
                <label><span>Bis</span><input type="date" value={endDate} min={startDate || undefined} onChange={event => setEndDate(event.target.value)} /></label>
              </div>
              <label><span>Status</span><select value={status} onChange={event => setStatus(event.target.value as TripStatus)}><option value="idea">Idee</option><option value="planning">Planung</option><option value="booked">Gebucht</option><option value="completed">Erlebt</option></select></label>
              <button type="button" className="secondary tripMetaMobileSave" onClick={saveMeta} disabled={savingMeta || !title.trim()}>{savingMeta ? "Speichert …" : "Jetzt speichern"}</button>
            </div>
          </details>

          <div className={`tripSaveState ${saveError ? "tripSaveState--error" : ""}`} role="status" aria-live="polite">
            <span className="syncDot" />
            {saveError || saveMessage || (mode === "guest"
              ? "Autosave aktiv · dieser Plan bleibt auf diesem Gerät gespeichert."
              : "Autosave aktiv · dieser Plan wird mit deinem Account synchronisiert.")}
          </div>
          <div className="tripDetailToolbar"><Link href="/my-around/trips">← Alle Trips</Link><Link href="/saved">+ Aus MY AROUND hinzufügen</Link></div>

          <nav className="tripDayNav" aria-label="Trip-Tage">
            {unplanned.length ? <a href="#trip-open"><b>00</b><span>Offen</span><small>{unplanned.length}</small></a> : null}
            {days.map(day => <a href={`#trip-day-${day.dayIndex + 1}`} key={day.dayIndex}><b>{String(day.dayIndex + 1).padStart(2, "0")}</b><span>Day {day.dayIndex + 1}{startDate ? <em>{dayDate(startDate, day.dayIndex)}</em> : null}</span><small>{day.items.length}</small></a>)}
          </nav>
        </div>
      </section>

      <section className="tripBoardSection tripBoardSection--v18">
        <div className="container tripBoard tripBoard--v18">
          {unplanned.length ? (
            <TripDayBlock
              id="trip-open"
              dayIndex={undefined}
              displayIndex="00"
              title="NOCH OFFEN."
              dateLabel="Noch keinem Tag zugeordnet"
              items={unplanned}
              dayCount={dayCount}
              isOpen
              isDragTarget={dragTargetDay === "open"}
              onChange={changeItem}
              onRemove={remove}
              onMove={moveItem}
              onDragStart={setDragSourceId}
              onDragEnd={() => { setDragSourceId(null); setDragTargetDay(null); }}
              onDragEnter={() => setDragTargetDay("open")}
              onDrop={() => dropOnDay(undefined)}
            />
          ) : null}

          {days.map(day => (
            <TripDayBlock
              id={`trip-day-${day.dayIndex + 1}`}
              key={day.dayIndex}
              dayIndex={day.dayIndex}
              displayIndex={String(day.dayIndex + 1).padStart(2, "0")}
              title={`DAY ${day.dayIndex + 1}`}
              dateLabel={fullDayDate(startDate, day.dayIndex)}
              items={day.items}
              dayCount={dayCount}
              isDragTarget={dragTargetDay === day.dayIndex}
              onChange={changeItem}
              onRemove={remove}
              onMove={moveItem}
              onDragStart={setDragSourceId}
              onDragEnd={() => { setDragSourceId(null); setDragTargetDay(null); }}
              onDragEnter={() => setDragTargetDay(day.dayIndex)}
              onDrop={() => dropOnDay(day.dayIndex)}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function TripDayBlock({
  id,
  dayIndex,
  displayIndex,
  title,
  dateLabel,
  items,
  dayCount,
  isOpen = false,
  isDragTarget,
  onChange,
  onRemove,
  onMove,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDrop
}: {
  id: string;
  dayIndex: number | undefined;
  displayIndex: string;
  title: string;
  dateLabel: string;
  items: UserTrip["items"];
  dayCount: number;
  isOpen?: boolean;
  isDragTarget: boolean;
  onChange: (sourceId: string, patch: { dayIndex?: number; slot?: TripSlot; note?: string }) => Promise<void>;
  onRemove: (sourceId: string) => Promise<void>;
  onMove: (sourceId: string, currentDay: number | undefined, direction: -1 | 1) => Promise<void>;
  onDragStart: (sourceId: string) => void;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDrop: () => Promise<void>;
}) {
  return (
    <section
      id={id}
      className={`tripDay tripDay--v18 ${isOpen ? "tripDay--unplanned" : ""} ${isDragTarget ? "tripDay--dragTarget" : ""}`}
      onDragOver={event => { event.preventDefault(); onDragEnter(); }}
      onDrop={event => { event.preventDefault(); void onDrop(); }}
    >
      <div className="tripDayHead tripDayHead--v18">
        <div className="tripDayNumber">{displayIndex}</div>
        <div><h2>{title}</h2><p>{dateLabel}</p></div>
        <div className="tripDayCount"><strong>{items.length}</strong><span>{items.length === 1 ? "Stop" : "Stops"}</span></div>
      </div>
      {items.length ? (
        <div className="tripDayItems tripDayItems--v18">
          {items.map(item => (
            <TripItemRow
              key={item.sourceId}
              item={item}
              dayIndex={dayIndex}
              dayCount={dayCount}
              onChange={onChange}
              onRemove={onRemove}
              onMove={onMove}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      ) : (
        <div className="tripDayEmpty tripDayEmpty--v18">
          <span>+</span>
          <div><strong>Noch frei.</strong><p>Zieh einen gespeicherten Ort hierher oder ordne ihn über „Tag“ zu.</p></div>
        </div>
      )}
    </section>
  );
}

function TripItemRow({
  item,
  dayIndex,
  dayCount,
  onChange,
  onRemove,
  onMove,
  onDragStart,
  onDragEnd
}: {
  item: UserTrip["items"][number];
  dayIndex: number | undefined;
  dayCount: number;
  onChange: (sourceId: string, patch: { dayIndex?: number; slot?: TripSlot; note?: string }) => Promise<void>;
  onRemove: (sourceId: string) => Promise<void>;
  onMove: (sourceId: string, currentDay: number | undefined, direction: -1 | 1) => Promise<void>;
  onDragStart: (sourceId: string) => void;
  onDragEnd: () => void;
}) {
  const [note, setNote] = useState(item.note || "");
  const type = plannerType(item.sourceType);
  const itemSlot = (item.slot || "flex") as TripSlot;
  const canMoveBack = dayIndex !== undefined;
  const canMoveForward = dayIndex === undefined || dayIndex < dayCount - 1;

  useEffect(() => {
    setNote(item.note || "");
  }, [item.note]);

  return (
    <article
      className={`tripItemRow tripItemRow--v18 ${type.className}`}
      draggable
      onDragStart={event => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.sourceId);
        onDragStart(item.sourceId);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="tripDragHandle" title="Auf Desktop ziehen, um den Tag zu ändern" aria-hidden="true"><i /><i /><i /></div>
      <div className="tripItemSlotPill"><span>{slotLabels[itemSlot]}</span></div>
      <div className="tripItemIdentity tripItemIdentity--v18">
        <span>{type.label}</span>
        <h3><Link href={hrefFor(item)}>{item.title}</Link></h3>
        {item.note ? <p>{item.note}</p> : null}
      </div>
      <div className="tripItemMove" aria-label="Zwischen Tagen verschieben">
        <button type="button" onClick={() => onMove(item.sourceId, dayIndex, -1)} disabled={!canMoveBack} aria-label="Einen Tag zurück">←</button>
        <button type="button" onClick={() => onMove(item.sourceId, dayIndex, 1)} disabled={!canMoveForward} aria-label="Einen Tag weiter">→</button>
      </div>
      <div className="tripItemEditors">
        <label className="tripItemControl"><span>Tag</span><select value={item.dayIndex === undefined ? "" : String(item.dayIndex)} onChange={event => onChange(item.sourceId, { dayIndex: event.target.value === "" ? undefined : Number(event.target.value) })}><option value="">Offen</option>{Array.from({ length: dayCount }, (_, index) => <option value={index} key={index}>Day {index + 1}</option>)}</select></label>
        <label className="tripItemControl"><span>Zeit</span><select value={itemSlot} onChange={event => onChange(item.sourceId, { slot: event.target.value as TripSlot })}>{Object.entries(slotLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className="tripItemNote"><span>Notiz</span><input value={note} placeholder="Tee Time, Tisch, Idee …" onChange={event => setNote(event.target.value)} onBlur={() => { if (note !== (item.note || "")) onChange(item.sourceId, { note }); }} /></label>
      </div>
      <Link href={hrefFor(item)} className="tripItemOpen" aria-label={`${item.title} öffnen`}>↗</Link>
      <button type="button" className="tripItemRemove" onClick={() => onRemove(item.sourceId)} aria-label={`${item.title} aus Trip entfernen`}>×</button>
    </article>
  );
}
