/**
 * Stable travel facts, computed instead of maintained by hand.
 * - Time difference is derived from an IANA time zone against Germany
 *   (Europe/Berlin) at render time, so DST changes on either side never go
 *   stale in the CMS.
 * - Best travel months are stored as month numbers and compressed into
 *   ranges, wrapping over the new year (Okt – Apr).
 */
const HOME_TZ = "Europe/Berlin";
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

/** UTC offset of a time zone at a given instant, in minutes. */
export function utcOffsetMinutes(timeZone: string, at: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" }).formatToParts(at);
    const name = parts.find(p => p.type === "timeZoneName")?.value || "";
    if (name === "GMT") return 0;
    const m = name.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (!m) return null;
    const minutes = Number(m[2]) * 60 + Number(m[3] || 0);
    return m[1] === "-" ? -minutes : minutes;
  } catch {
    return null;
  }
}

function formatHours(diffMinutes: number): string {
  const sign = diffMinutes > 0 ? "+" : "−";
  const abs = Math.abs(diffMinutes);
  const h = Math.floor(abs / 60);
  const min = abs % 60;
  const value = min ? `${h}:${String(min).padStart(2, "0")}` : String(h);
  return `${sign}${value} Std.`;
}

export type TimeDifference = { label: string; note?: string };

/**
 * "+3 Std." now, plus a note when the difference changes over the year
 * (one side has daylight saving time, the other not).
 */
export function timeDifference(timeZone: string | undefined, now: Date = new Date()): TimeDifference | null {
  if (!timeZone) return null;
  const year = now.getUTCFullYear();
  const diffAt = (at: Date) => {
    const there = utcOffsetMinutes(timeZone, at);
    const home = utcOffsetMinutes(HOME_TZ, at);
    return there === null || home === null ? null : there - home;
  };
  const current = diffAt(now);
  if (current === null) return null;
  const winter = diffAt(new Date(Date.UTC(year, 0, 15, 12)));
  const summer = diffAt(new Date(Date.UTC(year, 6, 15, 12)));
  const label = current === 0 ? "Keine" : formatHours(current);
  if (winter === null || summer === null || winter === summer) return { label };
  const fmt = (d: number) => (d === 0 ? "gleich" : formatHours(d));
  return { label, note: `Winter ${fmt(winter)} · Sommer ${fmt(summer)}` };
}

/** [10,11,12,1,2,3,4] -> "Okt – Apr"; [5,6,9,10] -> "Mai – Jun, Sep – Okt"; all -> "Ganzjährig". */
export function formatMonthRanges(months: number[] | undefined): string | null {
  const set = new Set((months || []).filter(m => Number.isInteger(m) && m >= 1 && m <= 12));
  if (!set.size) return null;
  if (set.size === 12) return "Ganzjährig";
  // start a range at every selected month whose predecessor (cyclic) is not selected
  const starts = [...set].filter(m => !set.has(m === 1 ? 12 : m - 1)).sort((a, b) => a - b);
  const ranges = starts.map(start => {
    let end = start;
    while (set.has(end === 12 ? 1 : end + 1)) end = end === 12 ? 1 : end + 1;
    return start === end ? MONTHS[start - 1] : `${MONTHS[start - 1]} – ${MONTHS[end - 1]}`;
  });
  return ranges.join(", ");
}

export function formatTransfer(minutes: number | undefined): string | null {
  if (typeof minutes !== "number" || minutes <= 0) return null;
  if (minutes < 60) return `ca. ${minutes} Min.`;
  const h = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const rounded = rest === 0 ? `${h}` : rest <= 15 ? `${h}` : rest <= 45 ? `${h},5` : `${h + 1}`;
  return `ca. ${rounded} Std.`;
}
