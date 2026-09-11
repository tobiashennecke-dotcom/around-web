"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { normalizeContentRole, type ContentRole } from "@/lib/content-role";
import { addItemToTrip, updateTripItem, type TripBookingState, type TripSlot } from "@/lib/supabase/trips";
import type { SavePayload } from "@/lib/supabase/saves";
import type { ContentCard } from "@/lib/types";

type StopRole = Exclude<ContentRole, "stay">;

type Props = {
  open: boolean;
  tripId: string;
  kind: "stay" | "stop";
  dayCount: number;
  startDate?: string;
  existingIds: string[];
  defaultDayIndex?: number;
  defaultStayStartDay?: number;
  defaultStayEndDay?: number;
  onClose: () => void;
  onAdded: () => Promise<void> | void;
};

const stopRoles: StopRole[] = ["play", "eat", "do"];

function roleLabel(role: ContentRole) {
  if (role === "play") return "PLAY";
  if (role === "stay") return "STAY";
  if (role === "eat") return "EAT";
  return "DO";
}

function roleCopy(role: ContentRole) {
  if (role === "play") return "Golfplätze und Runden für deinen Trip.";
  if (role === "stay") return "Unterkünfte direkt in den Reiseplan legen.";
  if (role === "eat") return "Restaurants und Einkehr für deinen Tag.";
  return "Erlebnisse, Kultur und alles nach der Runde.";
}

function toSavePayload(item: ContentCard): SavePayload {
  return {
    sourceId: item.id,
    sourceType: item.type,
    sourceRole: item.type === "place" ? normalizeContentRole(item.placeType) : undefined,
    title: item.title,
    slug: item.slug
  };
}

function fixedDefaults(role: StopRole): { time: string; durationMinutes: number; slot: TripSlot; bookingState: TripBookingState } {
  if (role === "play") return { time: "09:00", durationMinutes: 270, slot: "morning", bookingState: "none" };
  if (role === "eat") return { time: "19:00", durationMinutes: 120, slot: "evening", bookingState: "none" };
  return { time: "14:00", durationMinutes: 120, slot: "afternoon", bookingState: "none" };
}

function dayLabel(startDate: string | undefined, dayIndex: number) {
  if (!startDate) return `Day ${dayIndex + 1}`;
  const date = new Date(`${startDate}T12:00:00`);
  date.setDate(date.getDate() + dayIndex);
  const formatted = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(date);
  return `Day ${dayIndex + 1} · ${formatted}`;
}

function nightSpanLabel(startDate: string | undefined, start?: number, end?: number) {
  if (start === undefined || end === undefined || end <= start) return "Zeitraum auswählen";
  if (!startDate) return `Day ${start + 1} → Day ${end + 1}`;
  const from = new Date(`${startDate}T12:00:00`);
  const to = new Date(`${startDate}T12:00:00`);
  from.setDate(from.getDate() + start);
  to.setDate(to.getDate() + end);
  const fmt = (date: Date) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(date);
  return `${fmt(from)} → ${fmt(to)}`;
}

export function TripQuickAddDrawer({
  open,
  tripId,
  kind,
  dayCount,
  startDate,
  existingIds,
  defaultDayIndex,
  defaultStayStartDay,
  defaultStayEndDay,
  onClose,
  onAdded
}: Props) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<ContentRole>(kind === "stay" ? "stay" : "play");
  const [results, setResults] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState("");
  const [selectedStayId, setSelectedStayId] = useState("");
  const [stayStartDay, setStayStartDay] = useState<number | undefined>(defaultStayStartDay);
  const [stayEndDay, setStayEndDay] = useState<number | undefined>(defaultStayEndDay);
  const [message, setMessage] = useState("");
  const existing = useMemo(() => new Set(existingIds), [existingIds]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setRole(kind === "stay" ? "stay" : "play");
    setSelectedStayId("");
    setStayStartDay(defaultStayStartDay);
    setStayEndDay(defaultStayEndDay);
    setMessage("");
  }, [open, kind, defaultStayStartDay, defaultStayEndDay]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, type: "all", role });
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => window.clearTimeout(timer);
  }, [open, query, role]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function finishAdd() {
    await onAdded();
    onClose();
  }

  async function addStay(item: ContentCard, mode: "whole" | "range") {
    if (existing.has(item.id)) return;
    setAddingId(item.id);
    setMessage("");
    try {
      if (mode === "whole") {
        await addItemToTrip(tripId, toSavePayload(item), { stayFullTrip: true });
      } else {
        const start = stayStartDay ?? 0;
        const end = stayEndDay ?? Math.max(1, dayCount - 1);
        if (end <= start) {
          setMessage("Check-out muss nach dem Check-in liegen.");
          return;
        }
        await addItemToTrip(tripId, toSavePayload(item), { stayFullTrip: false, stayStartDay: start, stayEndDay: end });
      }
      await finishAdd();
    } finally {
      setAddingId("");
    }
  }

  async function addStop(item: ContentCard, fixed: boolean) {
    if (existing.has(item.id)) return;
    const itemRole = normalizeContentRole(item.placeType);
    if (!itemRole || itemRole === "stay") return;
    setAddingId(item.id);
    setMessage("");
    try {
      await addItemToTrip(tripId, toSavePayload(item));
      if (fixed) {
        const defaults = fixedDefaults(itemRole);
        await updateTripItem(tripId, item.id, {
          dayIndex: defaultDayIndex,
          isFixed: true,
          fixedTime: defaults.time,
          durationMinutes: defaults.durationMinutes,
          bookingState: defaults.bookingState,
          slot: defaults.slot
        });
      } else {
        await updateTripItem(tripId, item.id, { dayIndex: defaultDayIndex, isFixed: false, slot: "flex", bookingState: "none" });
      }
      await finishAdd();
    } finally {
      setAddingId("");
    }
  }

  const visibleResults = results.slice(0, 10);
  const hasSuggestedGap = kind === "stay" && defaultStayStartDay !== undefined && defaultStayEndDay !== undefined;

  return (
    <div className="tripQuickAddOverlay" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="tripQuickAddDrawer" role="dialog" aria-modal="true" aria-labelledby="trip-quick-add-title">
        <header className="tripQuickAddHeader">
          <div>
            <div className="eyebrow lime">QUICK ADD / {kind === "stay" ? "STAY" : "STOP"}</div>
            <h2 id="trip-quick-add-title">{kind === "stay" ? "WO WILLST DU BLEIBEN?" : defaultDayIndex === undefined ? "WAS KOMMT IN DEN TRIP?" : `WAS KOMMT AN DAY ${defaultDayIndex + 1}?`}</h2>
            <p>{roleCopy(role)}</p>
          </div>
          <button type="button" className="tripQuickAddClose" onClick={onClose} aria-label="Quick Add schließen">×</button>
        </header>

        {kind === "stop" ? (
          <div className="tripQuickAddRoles" aria-label="Stop-Typ auswählen">
            {stopRoles.map(itemRole => (
              <button type="button" className={role === itemRole ? "active" : ""} key={itemRole} onClick={() => { setRole(itemRole); setQuery(""); }}>
                {roleLabel(itemRole)}
              </button>
            ))}
          </div>
        ) : null}

        {hasSuggestedGap ? (
          <div className="tripQuickAddGap">
            <span>OFFENE NÄCHTE</span>
            <strong>{nightSpanLabel(startDate, defaultStayStartDay, defaultStayEndDay)}</strong>
            <small>Der Zeitraum ist bereits vorausgewählt. Du kannst ihn unten ändern.</small>
          </div>
        ) : null}

        <div className="tripQuickAddSearch">
          <input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={kind === "stay" ? "Hotel oder Unterkunft suchen …" : `${roleLabel(role)} suchen …`}
          />
          <span>{loading ? "SUCHT …" : `${results.length} TREFFER`}</span>
        </div>

        <div className="tripQuickAddList">
          {visibleResults.map(item => {
            const contained = existing.has(item.id);
            const showRange = kind === "stay" && selectedStayId === item.id;
            return (
              <article className={`tripQuickAddResult ${contained ? "tripQuickAddResult--contained" : ""}`} key={item.id}>
                <div className="tripQuickAddResultMain">
                  {item.image ? <div className="tripQuickAddThumb" style={{ backgroundImage: `url(${item.image})` }} aria-hidden="true" /> : <div className="tripQuickAddThumb tripQuickAddThumb--empty" aria-hidden="true">{roleLabel(role)}</div>}
                  <div>
                    <span>{roleLabel(role)}</span>
                    <h3>{item.title}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                  </div>
                </div>

                {contained ? (
                  <div className="tripQuickAddContained">IM TRIP ✓</div>
                ) : kind === "stay" ? (
                  <div className="tripQuickAddActions">
                    <button type="button" disabled={addingId === item.id} onClick={() => void addStay(item, "whole")}>GANZE REISE</button>
                    <button type="button" className={showRange ? "active" : ""} onClick={() => {
                      setSelectedStayId(showRange ? "" : item.id);
                      setStayStartDay(defaultStayStartDay ?? 0);
                      setStayEndDay(defaultStayEndDay ?? Math.max(1, dayCount - 1));
                    }}>ZEITRAUM</button>
                  </div>
                ) : (
                  <div className="tripQuickAddActions">
                    <button type="button" disabled={addingId === item.id} onClick={() => void addStop(item, false)}>FLEXIBEL +</button>
                    <button type="button" disabled={addingId === item.id} onClick={() => void addStop(item, true)}>FIXPUNKT +</button>
                  </div>
                )}

                {showRange ? (
                  <div className="tripQuickAddRange">
                    <label>
                      <span>Check-in</span>
                      <select value={stayStartDay ?? ""} onChange={event => {
                        const next = event.target.value === "" ? undefined : Number(event.target.value);
                        setStayStartDay(next);
                        if (next !== undefined && (stayEndDay === undefined || stayEndDay <= next)) setStayEndDay(Math.min(dayCount - 1, next + 1));
                      }}>
                        <option value="">Offen</option>
                        {Array.from({ length: dayCount }, (_, index) => <option value={index} key={index}>{dayLabel(startDate, index)}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Check-out</span>
                      <select value={stayEndDay ?? ""} onChange={event => setStayEndDay(event.target.value === "" ? undefined : Number(event.target.value))}>
                        <option value="">Offen</option>
                        {Array.from({ length: Math.max(0, dayCount - 1) }, (_, offset) => offset + 1)
                          .filter(index => stayStartDay === undefined || index > stayStartDay)
                          .map(index => <option value={index} key={index}>{dayLabel(startDate, index)}</option>)}
                      </select>
                    </label>
                    <button type="button" className="primary" disabled={addingId === item.id || stayStartDay === undefined || stayEndDay === undefined} onClick={() => void addStay(item, "range")}>
                      ZEITRAUM HINZUFÜGEN →
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}

          {!loading && !visibleResults.length ? (
            <div className="tripQuickAddEmpty"><strong>NOCH NICHTS DABEI.</strong><p>Versuch einen anderen Suchbegriff oder öffne die komplette AROUND Suche.</p></div>
          ) : null}
        </div>

        {message ? <div className="tripQuickAddMessage" role="status">{message}</div> : null}

        <footer className="tripQuickAddFooter">
          <span>QUICK ADD hält dich im Plan.</span>
          <Link href={`/search?role=${role}&trip=${tripId}`}>KOMPLETTE AROUND SUCHE →</Link>
        </footer>
      </aside>
    </div>
  );
}
