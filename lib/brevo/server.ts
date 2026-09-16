import "server-only";

/**
 * AROUND v1.26e - minimal typed fetch adapter for the Brevo v3 REST API.
 *
 * This is the ONLY file that ever reads BREVO_API_KEY. No SDK: a small
 * fetch wrapper is enough for the handful of endpoints this feature needs,
 * and it keeps the dependency surface (and the blast radius of a provider
 * change) small. Never logs the API key or a full user email.
 *
 * Brevo is a best-effort communication layer, never the source of truth -
 * every call here resolves to a typed ok/error result and never throws, so
 * a provider outage can never break the product action it's attached to.
 */

const BREVO_API_BASE = "https://api.brevo.com/v3";

export type BrevoResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

export type BrevoRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

/** True only when BREVO_API_KEY is actually configured for this environment. */
export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

export async function brevoRequest<T = unknown>(
  path: string,
  options: BrevoRequestOptions = {}
): Promise<BrevoResult<T>> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 0, error: "provider_disabled" };
  }

  try {
    const response = await fetch(`${BREVO_API_BASE}${path}`, {
      method: options.method || "GET",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });

    if (response.status === 204) {
      return { ok: true, status: response.status, data: undefined as T };
    }

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }

    if (!response.ok) {
      const message =
        parsed && typeof parsed === "object" && typeof (parsed as any).message === "string"
          ? (parsed as any).message
          : `brevo_http_${response.status}`;
      return { ok: false, status: response.status, error: message };
    }

    return { ok: true, status: response.status, data: parsed as T };
  } catch {
    return { ok: false, status: 0, error: "brevo_request_failed" };
  }
}
