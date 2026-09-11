"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SavePayload } from "@/lib/supabase/saves";
import { contentTypeLabel, normalizeContentRole } from "@/lib/content-role";
import {
  getUserTrip,
  removeItemFromTrip,
  updateTripItem,
  updateUserTrip,
  type TripBookingState,
  type TripItemPatch,
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

const slotMinutes: Record<TripSlot, number> = {
  morning: 9 * 60,
  midday: 12 * 60 + 30,
  afternoon: 15 * 60 + 30,
  evening: 19 * 60 + 30,
  stay: 22 * 60,
  flex: 24 * 60
};

const durationOptions = [30, 60, 90, 120, 180, 240, 270, 300, 360];

function minutesFromTime(value?: string) {
  if (!value || !/^\d{2}:\d{2}/.test(value)) return undefined;
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return undefined;
  return hours * 60 + minutes;
}

function slotForTime(value?: string): TripSlot {
  const minutes = minutesFromTime(value);
  if (minutes === undefined) return "flex";
  if (minutes < 11 * 60) return "morning";
  if (minutes < 14 * 60) return "midday";
  if (minutes < 18 * 60) return "afternoon";
  return "evening";
}

function formatDuration(minutes?: number) {
  if (!minutes) return "Dauer offen";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} Min`;
  if (!rest) return `${hours} Std`;
  return `${hours} Std ${rest} Min`;
}

function fixpointCopy(item: SavePayload) {
  const role = item.sourceType === "place" ? normalizeContentRole(item.sourceRole) : undefined;
  if (role === "play") return { label: "Tee Time", defaultTime: "09:00", defaultDuration: 270, requested: "Angefragt", confirmed: "Gebucht" };
  if (role === "eat") return { label: "Reservierung", defaultTime: "19:00", defaultDuration: 120, requested: "Angefragt", confirmed: "Reserviert" };
  if (role === "do") return { label: "Termin", defaultTime: "14:00", defaultDuration: 120, requested: "Angefragt", confirmed: "Gebucht" };
  return { label: "Uhrzeit", defaultTime: "10:00", defaultDuration: 60, requested: "Angefragt", confirmed: "Bestätigt" };
}

function bookingStateLabel(item: SavePayload, state?: TripBookingState) {
  const copy = fixpointCopy(item);
  if (state === "requested") return copy.requested;
  if (state === "confirmed") return copy.confirmed;
  return "Offen";
}

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

function plannerType(item: SavePayload) {
  const role = item.sourceType === "place" ? normalizeContentRole(item.sourceRole) : undefined;
  if (item.sourceType === "place" && role) {
    return { label: contentTypeLabel("place", role), className: `tripType--${role}` };
  }
  if (item.sourceType === "destination") return { label: "DESTINATION", className: "tripType--destination" };
  if (item.sourceType === "place") return { label: "PLACE", className: "tripType--place" };
  if (item.sourceType === "story") return { label: "STORY", className: "tripType--story" };
  if (item.sourceType === "person") return { label: "PEOPLE", className: "tripType--person" };
  if (item.sourceType === "product" || item.sourceType === "object") return { label: "OBJECT", className: "tripType--object" };
  return { label: contentTypeLabel(item.sourceType), className: "tripType--default" };
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
    const aMinute = a.isFixed ? minutesFromTime(a.fixedTime) : undefined;
    const bMinute = b.isFixed ? minutesFromTime(b.fixedTime) : undefined;
    const aKey = aMinute ?? slotMinutes[(a.slot || "flex") as TripSlot];
    const bKey = bMinute ?? slotMinutes[(b.slot || "flex") as TripSlot];
    if (aKey !== bKey) return aKey - bKey;
    return a.sortOrder - b.sortOrder;
  });
}

function fixedPointConflicts(items: UserTrip["items"]) {
  const scheduled = items
    .filter(item => item.isFixed && item.fixedTime)
    .map(item => ({
      item,
      start: minutesFromTime(item.fixedTime) as number,
      end: (minutesFromTime(item.fixedTime) as number) + (item.durationMinutes || 60)
    }))
    .sort((a, b) => a.start - b.start);

  const conflicts: Array<[string, string]> = [];
  for (let index = 0; index < scheduled.length; index += 1) {
    for (let next = index + 1; next < scheduled.length; next += 1) {
      if (scheduled[next].start >= scheduled[index].end) break;
      conflicts.push([scheduled[index].item.sourceId, scheduled[next].item.sourceId]);
    }
  }
  return conflicts;
}

function isStayItem(item: UserTrip["items"][number]) {
  return item.sourceType === "place" && normalizeContentRole(item.sourceRole) === "stay";
}

function effectiveStayRange(item: UserTrip["items"][number], dayCount: number) {
  if (item.stayFullTrip) return { start: 0, end: Math.max(0, dayCount - 1) };
  return { start: item.stayStartDay, end: item.stayEndDay };
}

function stayCoverage(items: UserTrip["items"], dayCount: number, exemptNights: number[] = []) {
  const nights = Math.max(0, dayCount - 1);
  const coverage = Array.from({ length: nights }, () => 0);
  for (const item of items) {
    const range = effectiveStayRange(item, dayCount);
    if (range.start === undefined || range.end === undefined || range.end <= range.start) continue;
    for (let night = Math.max(0, range.start); night < Math.min(nights, range.end); night += 1) coverage[night] += 1;
  }
  const exemptions = new Set(exemptNights.filter(index => index >= 0 && index < nights));
  const uncoveredNightIndexes = coverage
    .map((value, index) => ({ value, index }))
    .filter(entry => entry.value === 0 && !exemptions.has(entry.index))
    .map(entry => entry.index);
  const overlapNightIndexes = coverage
    .map((value, index) => ({ value, index }))
    .filter(entry => entry.value > 1)
    .map(entry => entry.index);
  return {
    nights,
    uncovered: uncoveredNightIndexes.length,
    overlaps: overlapNightIndexes.length,
    uncoveredNightIndexes,
    overlapNightIndexes,
    exempt: exemptions.size,
    coverage
  };
}

function nightLabel(start: string | undefined, nightIndex: number) {
  if (!start) return `Nacht ${nightIndex + 1}`;
  const from = new Date(`${start}T12:00:00`);
  const to = new Date(`${start}T12:00:00`);
  from.setDate(from.getDate() + nightIndex);
  to.setDate(to.getDate() + nightIndex + 1);
  const fmt = (date: Date) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(date);
  return `${fmt(from)} → ${fmt(to)}`;
}

function firstGapSpan(indexes: number[]) {
  if (!indexes.length) return null;
  const sorted = [...indexes].sort((a,b) => a-b);
  let end = sorted[0] + 1;
  for (let i = 1; i < sorted.length && sorted[i] === end; i += 1) end += 1;
  return { start: sorted[0], end };
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
  const [showReadiness, setShowReadiness] = useState(false);
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
        const datesChanged = (startDate || undefined) !== trip.startDate || (endDate || undefined) !== trip.endDate;
        await updateUserTrip(trip.id, { title: cleanTitle, startDate, endDate, status, ...(datesChanged ? { planReady: false, stayExemptNights: [] } : {}) });
        setTrip(current => current ? {
          ...current,
          title: cleanTitle,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status,
          ...(datesChanged ? { planReady: false, stayExemptNights: [] } : {}),
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
      const datesChanged = (startDate || undefined) !== trip.startDate || (endDate || undefined) !== trip.endDate;
      await updateUserTrip(trip.id, { title: cleanTitle, startDate, endDate, status, ...(datesChanged ? { planReady: false, stayExemptNights: [] } : {}) });
      setTrip(current => current ? {
        ...current,
        title: cleanTitle,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
        ...(datesChanged ? { planReady: false, stayExemptNights: [] } : {}),
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

  async function changeItem(sourceId: string, patch: TripItemPatch) {
    if (!trip) return;
    setSaveError("");

    const previous = trip;
    setTrip(current => current ? {
      ...current,
      planReady: false,
      updatedAt: new Date().toISOString(),
      items: current.items.map(item => item.sourceId === sourceId ? {
        ...item,
        dayIndex: "dayIndex" in patch ? patch.dayIndex : item.dayIndex,
        slot: patch.slot ?? item.slot,
        note: patch.note ?? item.note,
        stayStartDay: "stayStartDay" in patch ? patch.stayStartDay : item.stayStartDay,
        stayEndDay: "stayEndDay" in patch ? patch.stayEndDay : item.stayEndDay,
        stayFullTrip: "stayFullTrip" in patch ? Boolean(patch.stayFullTrip) : item.stayFullTrip,
        isFixed: "isFixed" in patch ? Boolean(patch.isFixed) : item.isFixed,
        fixedTime: "fixedTime" in patch ? (patch.fixedTime || undefined) : item.fixedTime,
        durationMinutes: "durationMinutes" in patch ? patch.durationMinutes : item.durationMinutes,
        bookingState: "bookingState" in patch ? patch.bookingState : item.bookingState
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

  async function finalizePlan() {
    if (!trip) return;
    if (!startDate || !endDate) {
      setSaveError("Lege zuerst Von- und Bis-Datum fest, damit AROUND die Nächte prüfen kann.");
      return;
    }
    const staysNow = trip.items.filter(isStayItem);
    const coverage = stayCoverage(staysNow, dayCount, trip.stayExemptNights || []);
    if (coverage.uncovered > 0 || coverage.overlaps > 0) {
      setShowReadiness(true);
      return;
    }
    await updateUserTrip(trip.id, { planReady: true });
    setTrip(current => current ? { ...current, planReady: true, updatedAt: new Date().toISOString() } : current);
    setSaveMessage("Plan abgeschlossen · alle Übernachtungen sind geklärt.");
  }

  async function reopenPlan() {
    if (!trip) return;
    await updateUserTrip(trip.id, { planReady: false });
    setTrip(current => current ? { ...current, planReady: false, updatedAt: new Date().toISOString() } : current);
    setSaveMessage("Plan wieder geöffnet.");
  }

  async function markOpenNightsAsNoStay() {
    if (!trip) return;
    const staysNow = trip.items.filter(isStayItem);
    const coverage = stayCoverage(staysNow, dayCount, trip.stayExemptNights || []);
    const next = [...new Set([...(trip.stayExemptNights || []), ...coverage.uncoveredNightIndexes])].sort((a,b) => a-b);
    await updateUserTrip(trip.id, { stayExemptNights: next, planReady: coverage.overlaps === 0 });
    setTrip(current => current ? { ...current, stayExemptNights: next, planReady: coverage.overlaps === 0, updatedAt: new Date().toISOString() } : current);
    setShowReadiness(coverage.overlaps > 0);
    setSaveMessage(coverage.overlaps === 0 ? "Plan abgeschlossen · offene Nächte bewusst ohne Unterkunft markiert." : "Offene Nächte markiert. Bitte noch die STAY-Überschneidung prüfen.");
  }

  async function clearStayExemptions() {
    if (!trip) return;
    await updateUserTrip(trip.id, { stayExemptNights: [], planReady: false });
    setTrip(current => current ? { ...current, stayExemptNights: [], planReady: false, updatedAt: new Date().toISOString() } : current);
    setSaveMessage("Ohne-Unterkunft-Markierungen zurückgesetzt.");
  }

  async function extendStayAcrossFirstGap() {
    if (!trip) return;
    const staysNow = trip.items.filter(isStayItem);
    const coverage = stayCoverage(staysNow, dayCount, trip.stayExemptNights || []);
    const gap = firstGapSpan(coverage.uncoveredNightIndexes);
    if (!gap) return;
    const candidate = staysNow.find(item => {
      const range = effectiveStayRange(item, dayCount);
      return !item.stayFullTrip && range.end === gap.start;
    });
    if (!candidate) return;
    await changeItem(candidate.sourceId, { stayFullTrip: false, stayEndDay: gap.end });
    setShowReadiness(false);
    setSaveMessage(`${candidate.title} wurde bis Day ${gap.end + 1} verlängert.`);
  }

  if (loading) return <section className="section"><div className="container savedLoading">Trip wird geladen …</div></section>;
  if (!trip) return <section className="section"><div className="container"><h1>Trip nicht gefunden.</h1><Link className="textLink" href="/my-around/trips">Zurück →</Link></div></section>;

  const stays = trip.items.filter(isStayItem);
  const regularItems = trip.items.filter(item => !isStayItem(item));
  const unplanned = sortItems(regularItems.filter(item => item.dayIndex === undefined));
  const days = Array.from({ length: dayCount }, (_, dayIndex) => ({
    dayIndex,
    items: sortItems(regularItems.filter(item => item.dayIndex === dayIndex))
  }));
  const stayPlannedCount = stays.filter(item => {
    const range = effectiveStayRange(item, dayCount);
    return item.stayFullTrip || (range.start !== undefined && range.end !== undefined && range.end > range.start);
  }).length;
  const fixedPointCount = regularItems.filter(item => item.isFixed && item.fixedTime && item.dayIndex !== undefined).length;
  const plannedCount = (regularItems.length - unplanned.length) + stayPlannedCount;
  const coverage = stayCoverage(stays, dayCount, trip.stayExemptNights || []);
  const gap = firstGapSpan(coverage.uncoveredNightIndexes);
  const extendCandidate = gap ? stays.find(item => {
    const range = effectiveStayRange(item, dayCount);
    return !item.stayFullTrip && range.end === gap.start;
  }) : undefined;

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
              {fixedPointCount ? <span>{fixedPointCount} {fixedPointCount === 1 ? "Fixpunkt" : "Fixpunkte"}</span> : null}
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
          <div className="tripDetailToolbar"><Link href="/my-around/trips">← Alle Trips</Link><div className="tripDetailToolbarActions"><Link href={`/search?trip=${trip.id}`}>+ AROUND DURCHSUCHEN</Link><Link href="/saved">+ AUS MY AROUND</Link></div></div>

          <div className={`tripReadinessBar ${trip.planReady ? "tripReadinessBar--ready" : ""}`}>
            <div>
              <span>PLANSTATUS</span>
              <strong>{trip.planReady ? "BEREIT." : "IN ARBEIT."}</strong>
              <small>{coverage.nights === 0 ? "Keine Übernachtung nötig." : coverage.overlaps ? `${coverage.overlaps} ${coverage.overlaps === 1 ? "Nacht überschneidet sich" : "Nächte überschneiden sich"}.` : coverage.uncovered ? `${coverage.uncovered} ${coverage.uncovered === 1 ? "Nacht noch offen" : "Nächte noch offen"}.` : coverage.exempt ? `Alle Nächte geklärt · ${coverage.exempt} bewusst ohne Unterkunft.` : "Alle Nächte sind mit STAY abgedeckt."}</small>
            </div>
            {trip.planReady ? (
              <button type="button" className="secondary" onClick={() => void reopenPlan()}>Plan wieder öffnen</button>
            ) : (
              <button type="button" className="primary" onClick={() => void finalizePlan()}>Plan abschließen →</button>
            )}
          </div>

          {(dayCount > 1 || stays.length > 0) ? (
            <StayLane
              tripId={trip.id}
              items={stays}
              dayCount={dayCount}
              startDate={startDate}
              exemptNights={trip.stayExemptNights || []}
              onChange={changeItem}
              onRemove={remove}
              onClearExemptions={clearStayExemptions}
            />
          ) : null}

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

      {showReadiness ? (
        <div className="tripReadinessOverlay" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) setShowReadiness(false); }}>
          <section className="tripReadinessDialog" role="dialog" aria-modal="true" aria-labelledby="trip-readiness-title">
            <button className="tripReadinessClose" type="button" onClick={() => setShowReadiness(false)} aria-label="Schließen">×</button>
            <div className="eyebrow lime">AROUND / PLAN CHECK</div>
            <h2 id="trip-readiness-title">{coverage.overlaps ? "STAYS PRÜFEN." : `${coverage.uncovered} ${coverage.uncovered === 1 ? "NACHT IST" : "NÄCHTE SIND"} NOCH OFFEN.`}</h2>
            {coverage.overlaps ? (
              <p>{coverage.overlaps} {coverage.overlaps === 1 ? "Nacht ist" : "Nächte sind"} aktuell durch mehrere STAYs gleichzeitig belegt. Das kann Absicht sein – für einen abgeschlossenen Plan sollte aber klar sein, wo du tatsächlich bleibst.</p>
            ) : (
              <>
                <p>Für {coverage.uncoveredNightIndexes.map(index => nightLabel(startDate,index)).join(", ")} ist noch keine Unterkunft hinterlegt.</p>
                <div className="tripReadinessNightList">{coverage.uncoveredNightIndexes.map(index => <span key={index}>{nightLabel(startDate,index)}</span>)}</div>
              </>
            )}
            <div className="tripReadinessActions">
              {!coverage.overlaps ? <Link className="primary" href="/saved">STAY HINZUFÜGEN →</Link> : null}
              {!coverage.overlaps && extendCandidate ? <button type="button" className="secondary" onClick={() => void extendStayAcrossFirstGap()}>{extendCandidate.title} verlängern</button> : null}
              {!coverage.overlaps ? <button type="button" className="secondary" onClick={() => void markOpenNightsAsNoStay()}>Keine Unterkunft nötig</button> : null}
              {coverage.overlaps ? <a className="primary" href="#trip-stays" onClick={() => setShowReadiness(false)}>STAYS PRÜFEN →</a> : null}
              <button type="button" className="textLink tripReadinessLater" onClick={() => setShowReadiness(false)}>{coverage.overlaps ? "Als Optionen behalten & weiter planen" : "Später entscheiden"}</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function StayLane({
  tripId,
  items,
  dayCount,
  startDate,
  exemptNights,
  onChange,
  onRemove,
  onClearExemptions
}: {
  tripId: string;
  items: UserTrip["items"];
  dayCount: number;
  startDate: string;
  exemptNights: number[];
  onChange: (sourceId: string, patch: TripItemPatch) => Promise<void>;
  onRemove: (sourceId: string) => Promise<void>;
  onClearExemptions: () => Promise<void>;
}) {
  const coverage = stayCoverage(items, dayCount, exemptNights);
  const coverageLabel = coverage.nights === 0
    ? "Noch keine Übernachtung im gewählten Zeitraum."
    : coverage.overlaps > 0
      ? `${coverage.overlaps} ${coverage.overlaps === 1 ? "Nacht überschneidet sich" : "Nächte überschneiden sich"}.`
      : coverage.uncovered > 0
        ? `${coverage.uncovered} ${coverage.uncovered === 1 ? "Nacht noch offen" : "Nächte noch offen"}.`
        : coverage.exempt > 0
          ? `Alle Nächte geklärt · ${coverage.exempt} bewusst ohne Unterkunft.`
          : "Alle Nächte sind abgedeckt.";

  return (
    <section className="tripStayLane" id="trip-stays" aria-label="Unterkünfte">
      <div className="tripStayLaneHead">
        <div>
          <div className="eyebrow lime">STAY / ÜBERNACHTEN</div>
          <h2>WO DU BLEIBST.</h2>
        </div>
        <div className={`tripStayCoverage ${coverage.overlaps || coverage.uncovered ? "tripStayCoverage--open" : "tripStayCoverage--complete"}`}>
          <strong>{items.length}</strong>
          <span>{items.length === 1 ? "Stay" : "Stays"}</span>
          <small>{coverageLabel}</small>
        </div>
      </div>

      {coverage.exempt > 0 ? (
        <div className="tripStayExemptNote">
          <span>{coverage.exempt} {coverage.exempt === 1 ? "Nacht" : "Nächte"} ohne Unterkunft markiert.</span>
          <button type="button" onClick={() => void onClearExemptions()}>Zurücksetzen</button>
        </div>
      ) : null}

      {!items.length ? (
        <div className="tripStayEmpty">
          <div><strong>Noch kein STAY im Trip.</strong><p>Füge eine Unterkunft aus MY AROUND hinzu oder markiere offene Nächte beim Plan-Check bewusst als ohne Unterkunft.</p></div>
          <Link className="secondary" href={`/search?role=stay&trip=${tripId}`}>+ STAY FINDEN</Link>
        </div>
      ) : null}

      <div className="tripStaySegments">
        {items.map(item => {
          const range = effectiveStayRange(item, dayCount);
          const nights = range.start !== undefined && range.end !== undefined && range.end > range.start
            ? range.end - range.start
            : undefined;
          return (
            <article className={`tripStaySegment ${item.stayFullTrip ? "tripStaySegment--full" : ""}`} key={item.sourceId}>
              <div className="tripStaySegmentTop">
                <div>
                  <span className="tripStayRole">STAY</span>
                  <h3><Link href={hrefFor(item)}>{item.title}</Link></h3>
                  <p>{item.stayFullTrip ? "Für die ganze Reise" : nights !== undefined ? `${nights} ${nights === 1 ? "Nacht" : "Nächte"}` : "Zeitraum noch offen"}</p>
                </div>
                <div className="tripStaySegmentActions">
                  <Link href={hrefFor(item)} aria-label={`${item.title} öffnen`}>↗</Link>
                  <button type="button" onClick={() => onRemove(item.sourceId)} aria-label={`${item.title} aus Trip entfernen`}>×</button>
                </div>
              </div>

              <div className="tripStayControls">
                <label>
                  <span>Check-in</span>
                  <select
                    value={range.start === undefined ? "" : String(range.start)}
                    disabled={item.stayFullTrip}
                    onChange={event => {
                      const nextStart = event.target.value === "" ? undefined : Number(event.target.value);
                      let nextEnd = item.stayEndDay;
                      if (nextStart !== undefined && (nextEnd === undefined || nextEnd <= nextStart)) {
                        nextEnd = nextStart < dayCount - 1 ? nextStart + 1 : undefined;
                      }
                      void onChange(item.sourceId, { stayFullTrip: false, stayStartDay: nextStart, stayEndDay: nextEnd });
                    }}
                  >
                    <option value="">Offen</option>
                    {Array.from({ length: dayCount }, (_, index) => <option value={index} key={index}>Day {index + 1}{startDate ? ` · ${dayDate(startDate,index)}` : ""}</option>)}
                  </select>
                </label>
                <label>
                  <span>Check-out</span>
                  <select
                    value={range.end === undefined ? "" : String(range.end)}
                    disabled={item.stayFullTrip || dayCount < 2}
                    onChange={event => void onChange(item.sourceId, { stayFullTrip: false, stayEndDay: event.target.value === "" ? undefined : Number(event.target.value) })}
                  >
                    <option value="">Offen</option>
                    {Array.from({ length: Math.max(0,dayCount - 1) }, (_, offset) => offset + 1)
                      .filter(index => range.start === undefined || index > range.start)
                      .map(index => <option value={index} key={index}>Day {index + 1}{startDate ? ` · ${dayDate(startDate,index)}` : ""}</option>)}
                  </select>
                </label>
                <div className="tripStayModeRow">
                  <button
                    type="button"
                    className={`tripStayWholeTrip ${item.stayFullTrip ? "tripStayWholeTrip--active" : ""}`}
                    onClick={() => void onChange(item.sourceId, item.stayFullTrip
                      ? { stayFullTrip: false, stayStartDay: 0, stayEndDay: Math.max(1, dayCount - 1) }
                      : { stayFullTrip: true, stayStartDay: undefined, stayEndDay: undefined })}
                  >
                    {item.stayFullTrip ? "✓ Ganze Reise" : "Ganze Reise"}
                  </button>
                  <button
                    type="button"
                    className={!item.stayFullTrip && range.start !== undefined && range.end !== undefined ? "tripStayModeActive" : ""}
                    onClick={() => void onChange(item.sourceId, { stayFullTrip: false, stayStartDay: range.start ?? 0, stayEndDay: range.end ?? Math.max(1, dayCount - 1) })}
                  >Zeitraum</button>
                  <button
                    type="button"
                    className={!item.stayFullTrip && range.start === undefined && range.end === undefined ? "tripStayModeActive" : ""}
                    onClick={() => void onChange(item.sourceId, { stayFullTrip: false, stayStartDay: undefined, stayEndDay: undefined })}
                  >Noch offen</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
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
  onChange: (sourceId: string, patch: TripItemPatch) => Promise<void>;
  onRemove: (sourceId: string) => Promise<void>;
  onMove: (sourceId: string, currentDay: number | undefined, direction: -1 | 1) => Promise<void>;
  onDragStart: (sourceId: string) => void;
  onDragEnd: () => void;
  onDragEnter: () => void;
  onDrop: () => Promise<void>;
}) {
  const fixedCount = items.filter(item => item.isFixed && item.fixedTime).length;
  const conflicts = fixedPointConflicts(items);
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
        <div className="tripDayCount"><strong>{items.length}</strong><span>{items.length === 1 ? "Stop" : "Stops"}</span>{fixedCount ? <em>{fixedCount} fix</em> : null}</div>
      </div>
      {conflicts.length ? <div className="tripDayConflict">ZEITKONFLIKT · {conflicts.length} {conflicts.length === 1 ? "Überschneidung" : "Überschneidungen"} prüfen</div> : null}
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
  onChange: (sourceId: string, patch: TripItemPatch) => Promise<void>;
  onRemove: (sourceId: string) => Promise<void>;
  onMove: (sourceId: string, currentDay: number | undefined, direction: -1 | 1) => Promise<void>;
  onDragStart: (sourceId: string) => void;
  onDragEnd: () => void;
}) {
  const [note, setNote] = useState(item.note || "");
  const type = plannerType(item);
  const itemSlot = (item.slot || "flex") as TripSlot;
  const canMoveBack = dayIndex !== undefined;
  const canMoveForward = dayIndex === undefined || dayIndex < dayCount - 1;
  const fixedCopy = fixpointCopy(item);
  const bookingState = item.bookingState || "none";

  useEffect(() => {
    setNote(item.note || "");
  }, [item.note]);

  function setFixedMode(nextFixed: boolean) {
    if (!nextFixed) {
      void onChange(item.sourceId, { isFixed: false, bookingState: "none" });
      return;
    }
    const time = item.fixedTime || fixedCopy.defaultTime;
    void onChange(item.sourceId, {
      isFixed: true,
      fixedTime: time,
      durationMinutes: item.durationMinutes || fixedCopy.defaultDuration,
      bookingState,
      slot: slotForTime(time)
    });
  }

  return (
    <article
      className={`tripItemRow tripItemRow--v18 tripItemRow--v15 ${item.isFixed ? "tripItemRow--fixed" : "tripItemRow--flex"} ${type.className}`}
      draggable
      onDragStart={event => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.sourceId);
        onDragStart(item.sourceId);
      }}
      onDragEnd={onDragEnd}
    >
      <div className="tripDragHandle" title="Auf Desktop ziehen, um den Tag zu ändern" aria-hidden="true"><i /><i /><i /></div>
      <div className={`tripItemSlotPill ${item.isFixed ? "tripItemSlotPill--fixed" : ""}`}>
        {item.isFixed ? (
          <>
            <strong>{item.fixedTime || "--:--"}</strong>
            <small>{fixedCopy.label}</small>
          </>
        ) : (
          <span>{slotLabels[itemSlot]}</span>
        )}
      </div>
      <div className="tripItemIdentity tripItemIdentity--v18">
        <span>{type.label}{item.isFixed ? " · FIXPUNKT" : ""}</span>
        <h3><Link href={hrefFor(item)}>{item.title}</Link></h3>
        {item.isFixed ? (
          <p className="tripFixedMeta">
            {bookingStateLabel(item, bookingState)} · {formatDuration(item.durationMinutes)}
            {item.dayIndex === undefined ? " · Tag noch offen" : ""}
          </p>
        ) : item.note ? <p>{item.note}</p> : null}
      </div>
      <div className="tripItemMove" aria-label="Zwischen Tagen verschieben">
        <button type="button" onClick={() => onMove(item.sourceId, dayIndex, -1)} disabled={!canMoveBack} aria-label="Einen Tag zurück">←</button>
        <button type="button" onClick={() => onMove(item.sourceId, dayIndex, 1)} disabled={!canMoveForward} aria-label="Einen Tag weiter">→</button>
      </div>
      <div className={`tripItemEditors tripItemEditors--v15 ${item.isFixed ? "tripItemEditors--fixed" : ""}`}>
        <label className="tripItemControl">
          <span>Tag</span>
          <select value={item.dayIndex === undefined ? "" : String(item.dayIndex)} onChange={event => onChange(item.sourceId, { dayIndex: event.target.value === "" ? undefined : Number(event.target.value) })}>
            <option value="">Offen</option>
            {Array.from({ length: dayCount }, (_, index) => <option value={index} key={index}>Day {index + 1}</option>)}
          </select>
        </label>

        <label className="tripItemControl">
          <span>Planung</span>
          <select value={item.isFixed ? "fixed" : "flex"} onChange={event => setFixedMode(event.target.value === "fixed")}>
            <option value="flex">Flexibel</option>
            <option value="fixed">Fixpunkt</option>
          </select>
        </label>

        {item.isFixed ? (
          <>
            <label className="tripItemControl">
              <span>{fixedCopy.label}</span>
              <input
                type="time"
                value={item.fixedTime || ""}
                onChange={event => {
                  const time = event.target.value;
                  void onChange(item.sourceId, { fixedTime: time || undefined, slot: slotForTime(time) });
                }}
              />
            </label>
            <label className="tripItemControl">
              <span>Dauer</span>
              <select value={item.durationMinutes || ""} onChange={event => onChange(item.sourceId, { durationMinutes: event.target.value ? Number(event.target.value) : undefined })}>
                <option value="">Offen</option>
                {durationOptions.map(minutes => <option value={minutes} key={minutes}>{formatDuration(minutes)}</option>)}
              </select>
            </label>
            <label className="tripItemControl">
              <span>Status</span>
              <select value={bookingState} onChange={event => onChange(item.sourceId, { bookingState: event.target.value as TripBookingState })}>
                <option value="none">Offen</option>
                <option value="requested">{fixedCopy.requested}</option>
                <option value="confirmed">{fixedCopy.confirmed}</option>
              </select>
            </label>
          </>
        ) : (
          <label className="tripItemControl">
            <span>Zeitfenster</span>
            <select value={itemSlot} onChange={event => onChange(item.sourceId, { slot: event.target.value as TripSlot })}>
              {Object.entries(slotLabels).filter(([value]) => value !== "stay").map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
        )}

        <label className="tripItemNote">
          <span>Notiz</span>
          <input value={note} placeholder="Tee Time, Tisch, Idee …" onChange={event => setNote(event.target.value)} onBlur={() => { if (note !== (item.note || "")) onChange(item.sourceId, { note }); }} />
        </label>
      </div>
      <Link href={hrefFor(item)} className="tripItemOpen" aria-label={`${item.title} öffnen`}>↗</Link>
      <button type="button" className="tripItemRemove" onClick={() => onRemove(item.sourceId)} aria-label={`${item.title} aus Trip entfernen`}>×</button>
    </article>
  );
}

