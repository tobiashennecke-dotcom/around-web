import { getAnonId, getConsent } from "./consent";
import { ANALYTICS_EVENT_NAMES, type AnalyticsEventName } from "./events";

export type { AnalyticsEventName } from "./events";

export type TrackProps = {
  sourceId?: string;
  sourceType?: string;
  sourceRole?: string | null;
  slug?: string;
  query?: string;
  value?: number;
  tripId?: string;
};

const UTM_KEY = "around-utm-v1";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign"] as const;
type Utm = Partial<Record<(typeof UTM_FIELDS)[number], string>>;

function currentUtm(): Utm {
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utm = {};
  for (const field of UTM_FIELDS) {
    const value = params.get(field);
    if (value) fromUrl[field] = value.slice(0, 80);
  }
  const full = getConsent() === "full";
  try {
    if (Object.keys(fromUrl).length) {
      if (full) window.sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
    // Only with full consent does the campaign follow the visitor through the session.
    if (full) return JSON.parse(window.sessionStorage.getItem(UTM_KEY) || "{}");
  } catch {
    // ignore storage errors
  }
  return {};
}

function referrerHost(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).host;
    return host && host !== window.location.host ? host : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Fire-and-forget product analytics event. Never throws, never blocks.
 * Without full consent the event is anonymous: no browser ID, no account.
 */
export function track(name: AnalyticsEventName, props: TrackProps = {}): void {
  if (typeof window === "undefined") return;
  if (!ANALYTICS_EVENT_NAMES.includes(name)) return;
  try {
    const consent = getConsent() === "full" ? "full" : "anonymous";
    const body = {
      name,
      consent,
      anonId: getAnonId(),
      path: window.location.pathname,
      referrerHost: referrerHost(),
      ...currentUtm(),
      ...props
    };
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(() => undefined);
  } catch {
    // Analytics must never break the product.
  }
}
