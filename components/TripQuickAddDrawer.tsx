"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { normalizeContentRole, type ContentRole } from "@/lib/content-role";
import {
  addItemToTrip,
  updateTripItem,
  type TripBookingState,
  type TripItem,
  type TripSlot
} from "@/lib/supabase/trips";
import type { SavePayload } from "@/lib/supabase/saves";
import type { ContentCard, PlanningDaypart, PlanningMode } from "@/lib/types";

type StopRole = Exclude<ContentRole, "stay">;

type FixedDraft = {
  itemId: string;
  time: string;
  durationMinutes: number;
  autoAdjusted: boolean;
};

type Props = {
  open: boolean;
  tripId: string;
  kind: "stay" | "stop";
  dayCount: number;
  startDate?: string;
  existingIds: string[];
  scheduledItems: TripItem[];
  tripDestinationId?: string;
  defaultDayIndex?: number;
  defaultStayStartDay?: number;
  defaultStayEndDay?: number;
  onClose: () => void;
  onAdded: () => Promise<void> | void;
};

const stopRoles: StopRole[] = ["play", "eat", "do"];
const durationOptions = [30, 60, 90, 120, 180, 240, 270, 300, 360, 405, 480];

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

function roleDefaults(role: StopRole): {
  mode: PlanningMode;
  time: string;
  durationMinutes: number;
  daypart: PlanningDaypart;
  slot: TripSlot;
  bookingState: TripBookingState;
} {
  if (role === "play") return { mode: "fixed", time: "09:00", durationMinutes: 270, daypart: "morning", slot: "morning", bookingState: "none" };
  if (role === "eat") return { mode: "fixed", time: "19:00", durationMinutes: 120, daypart: "evening", slot: "evening", bookingState: "none" };
  return { mode: "flexible", time: "14:00", durationMinutes: 120, daypart: "afternoon", slot: "afternoon", bookingState: "none" };
}

function planningDefaults(item: ContentCard, role: StopRole) {
  const fallback = roleDefaults(role);
  return {
    mode: item.defaultPlanningMode || fallback.mode,
    time: item.suggestedTime || fallback.time,
    durationMinutes: item.suggestedDurationMinutes || fallback.durationMinutes,
    daypart: item.suggestedDaypart || fallback.daypart,
    slot: slotForDaypart(item.suggestedDaypart || fallback.daypart, fallback.slot),
    bookingState: fallback.bookingState
  };
}

function slotForDaypart(daypart: PlanningDaypart | undefined, fallback: TripSlot): TripSlot {
  if (daypart === "morning") return "morning";
  if (daypart === "midday") return "midday";
  if (daypart === "afternoon") return "afternoon";
  if (daypart === "evening") return "evening";
  return fallback;
}

function daypartLabel(daypart?: PlanningDaypart) {
  if (daypart === "morning") return "MORGEN";
  if (daypart === "midday") return "MITTAG";
  if (daypart === "afternoon") return "NACHMITTAG";
  if (daypart === "evening") return "ABEND";
  if (daypart === "all_day") return "GANZER TAG";
  return "FLEXIBEL";
}

function durationLabel(minutes?: number) {
  if (!minutes) return "DAUER OFFEN";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} MIN`;
  if (!rest) return `${hours} STD`;
  return `${hours} STD ${rest} MIN`;
}

function minutesFromTime(value?: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return undefined;
  return hours * 60 + minutes;
}

function timeFromMinutes(value: number) {
  const safe = Math.max(0, Math.min(23 * 60 + 45, value));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function ceilQuarter(value: number) {
  return Math.ceil(value / 15) * 15;
}

function conflictsWithDay(items: TripItem[], dayIndex: number | undefined, time: string, durationMinutes: number) {
  if (dayIndex === undefined) return false;
  const start = minutesFromTime(time);
  if (start === undefined) return false;
  const end = start + durationMinutes;
  return items.some(item => {
    if (!item.isFixed || item.dayIndex !== dayIndex || !item.fixedTime) return false;
    const otherStart = minutesFromTime(item.fixedTime);
    if (otherStart === undefined) return false;
    const otherEnd = otherStart + (item.durationMinutes || 60);
    return start < otherEnd && end > otherStart;
  });
}

function nextFreeTime(items: TripItem[], dayIndex: number | undefined, preferredTime: string, durationMinutes: number) {
  if (dayIndex === undefined) return { time: preferredTime, adjusted: false };
  const preferred = minutesFromTime(preferredTime) ?? 14 * 60;
  if (!conflictsWithDay(items, dayIndex, preferredTime, durationMinutes)) return { time: preferredTime, adjusted: false };

  const fixed = items
    .filter(item => item.isFixed && item.dayIndex === dayIndex && item.fixedTime)
    .map(item => {
      const start = minutesFromTime(item.fixedTime) as number;
      return { start, end: start + (item.durationMinutes || 60) };
    })
    .sort((a, b) => a.start - b.start);

  let candidate = preferred;
  for (let guard = 0; guard < 40; guard += 1) {
    const hit = fixed.find(entry => candidate < entry.end && candidate + durationMinutes > entry.start);
    if (!hit) break;
    candidate = ceilQuarter(hit.end + 15);
  }

  if (candidate + durationMinutes <= 23 * 60) return { time: timeFromMinutes(candidate), adjusted: true };

  candidate = Math.max(6 * 60, preferred - 15);
  for (let guard = 0; guard < 64; guard += 1) {
    const time = timeFromMinutes(candidate);
    if (!conflictsWithDay(items, dayIndex, time, durationMinutes)) return { time, adjusted: true };
    candidate -= 15;
    if (candidate < 6 * 60) break;
  }
  return { time: preferredTime, adjusted: false };
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
  scheduledItems,
  tripDestinationId,
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
  const [fixedDraft, setFixedDraft] = useState<FixedDraft | null>(null);
  const [message, setMessage] = useState("");
  const existing = useMemo(() => new Set(existingIds), [existingIds]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setRole(kind === "stay" ? "stay" : "play");
    setSelectedStayId("");
    setStayStartDay(defaultStayStartDay);
    setStayEndDay(defaultStayEndDay);
    setFixedDraft(null);
    setMessage("");
  }, [open, kind, defaultStayStartDay, defaultStayEndDay]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, type: "all", role });
        const anchorPlaceIds = scheduledItems.filter(item => item.sourceType === "place").map(item => item.sourceId);
        if (anchorPlaceIds.length) params.set("anchorPlaceIds", anchorPlaceIds.join(","));
        if (tripDestinationId) params.set("destinationId", tripDestinationId);
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
    setFixedDraft(null);
  }, [query, role]);

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

  function openFixedDraft(item: ContentCard) {
    const itemRole = normalizeContentRole(item.placeType);
    if (!itemRole || itemRole === "stay") return;
    const defaults = planningDefaults(item, itemRole);
    const suggestion = nextFreeTime(scheduledItems, defaultDayIndex, defaults.time, defaults.durationMinutes);
    setFixedDraft({
      itemId: item.id,
      time: suggestion.time,
      durationMinutes: defaults.durationMinutes,
      autoAdjusted: suggestion.adjusted
    });
    setMessage("");
  }

  async function addStop(item: ContentCard, fixed: boolean, draft?: FixedDraft) {
    if (existing.has(item.id)) return;
    const itemRole = normalizeContentRole(item.placeType);
    if (!itemRole || itemRole === "stay") return;
    const defaults = planningDefaults(item, itemRole);
    setAddingId(item.id);
    setMessage("");
    try {
      await addItemToTrip(tripId, toSavePayload(item));
      if (fixed) {
        const time = draft?.time || defaults.time;
        const durationMinutes = draft?.durationMinutes || defaults.durationMinutes;
        await updateTripItem(tripId, item.id, {
          dayIndex: defaultDayIndex,
          isFixed: true,
          fixedTime: time,
          durationMinutes,
          bookingState: defaults.bookingState,
          slot: slotForTime(time)
        });
      } else {
        await updateTripItem(tripId, item.id, {
          dayIndex: defaultDayIndex,
          isFixed: false,
          durationMinutes: defaults.durationMinutes,
          slot: defaults.slot === "stay" ? "flex" : defaults.slot,
          bookingState: "none"
        });
      }
      await finishAdd();
    } finally {
      setAddingId("");
    }
  }

  function slotForTime(value: string): TripSlot {
    const minutes = minutesFromTime(value);
    if (minutes === undefined) return "flex";
    if (minutes < 11 * 60) return "morning";
    if (minutes < 14 * 60) return "midday";
    if (minutes < 18 * 60) return "afternoon";
    return "evening";
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
            const itemRole = kind === "stop" ? normalizeContentRole(item.placeType) : undefined;
            const defaults = itemRole && itemRole !== "stay" ? planningDefaults(item, itemRole) : undefined;
            const showFixpoint = fixedDraft?.itemId === item.id;
            const draftConflict = showFixpoint && fixedDraft
              ? conflictsWithDay(scheduledItems, defaultDayIndex, fixedDraft.time, fixedDraft.durationMinutes)
              : false;
            const recommendedFixed = defaults?.mode === "fixed";

            return (
              <article className={`tripQuickAddResult ${contained ? "tripQuickAddResult--contained" : ""}`} key={item.id}>
                <div className="tripQuickAddResultMain">
                  {item.image ? <div className="tripQuickAddThumb" style={{ backgroundImage: `url(${item.image})` }} aria-hidden="true" /> : <div className="tripQuickAddThumb tripQuickAddThumb--empty" aria-hidden="true">{roleLabel(role)}</div>}
                  <div>
                    <span>{roleLabel(role)}</span>
                    <h3>{item.title}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                    {defaults ? (
                      <div className="tripQuickAddPlanningHint">
                        <b>EMPFOHLEN</b>
                        <strong>{defaults.mode === "fixed" ? "FIXPUNKT" : "FLEXIBEL"}</strong>
                        <em>{daypartLabel(defaults.daypart)} · {durationLabel(defaults.durationMinutes)}{defaults.mode === "fixed" && item.suggestedTime ? ` · ${item.suggestedTime}` : ""}</em>
                      </div>
                    ) : null}
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
                  <div className="tripQuickAddActions tripQuickAddActions--planning">
                    <button
                      type="button"
                      className={!recommendedFixed ? "recommended" : ""}
                      disabled={addingId === item.id}
                      onClick={() => void addStop(item, false)}
                    >FLEXIBEL +{!recommendedFixed ? <small>EMPFOHLEN</small> : null}</button>
                    <button
                      type="button"
                      className={`${recommendedFixed ? "recommended" : ""} ${showFixpoint ? "active" : ""}`.trim()}
                      disabled={addingId === item.id}
                      onClick={() => showFixpoint ? setFixedDraft(null) : openFixedDraft(item)}
                    >FIXPUNKT +{recommendedFixed ? <small>EMPFOHLEN</small> : null}</button>
                  </div>
                )}

                {showFixpoint && fixedDraft ? (
                  <div className="tripQuickAddFixpoint">
                    <div className="tripQuickAddFixpointHead">
                      <div><span>FIXPUNKT PLANEN</span><strong>{fixedDraft.autoAdjusted ? "KONFLIKTFREI VORGESCHLAGEN" : "ZEIT FESTLEGEN"}</strong></div>
                      {fixedDraft.autoAdjusted ? <small>AROUND hat die Standardzeit verschoben, weil dort bereits etwas liegt.</small> : <small>Du entscheidest die Zeit, bevor der Stop im Plan landet.</small>}
                    </div>
                    <label>
                      <span>Uhrzeit</span>
                      <input type="time" step={900} value={fixedDraft.time} onChange={event => setFixedDraft(current => current ? { ...current, time: event.target.value, autoAdjusted: false } : current)} />
                    </label>
                    <label>
                      <span>Dauer</span>
                      <select value={fixedDraft.durationMinutes} onChange={event => setFixedDraft(current => current ? { ...current, durationMinutes: Number(event.target.value), autoAdjusted: false } : current)}>
                        {durationOptions.map(value => <option value={value} key={value}>{durationLabel(value)}</option>)}
                      </select>
                    </label>
                    <button type="button" className="primary" disabled={addingId === item.id || !fixedDraft.time} onClick={() => void addStop(item, true, fixedDraft)}>FIXPUNKT HINZUFÜGEN →</button>
                    {draftConflict ? <div className="tripQuickAddDraftConflict"><b>!</b><span>Diese Zeit überschneidet sich mit einem vorhandenen Fixpunkt. Du kannst sie trotzdem verwenden oder anpassen.</span></div> : null}
                  </div>
                ) : null}

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
