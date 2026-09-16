"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_COMMUNICATION_PREFERENCES, type CommunicationPreferences as Preferences } from "@/lib/communication/preferences";

const FIELDS: { key: keyof Preferences; label: string; description: string; commercial?: boolean }[] = [
  {
    key: "aroundJournal",
    label: "AROUND JOURNAL",
    description: "Editorial Stories, Destinations und neue Ausgaben."
  },
  {
    key: "myAroundUpdates",
    label: "MY AROUND UPDATES",
    description: "Relevante Updates zu Inhalten, die du gespeichert hast."
  },
  {
    key: "tripIntelligence",
    label: "TRIP INTELLIGENCE",
    description: "Briefings und nützliche Informationen zu Trips, die du tatsächlich planst."
  },
  {
    key: "aroundDrops",
    label: "AROUND DROPS",
    description: "Ausgewählte Angebote, Partner-Drops und kommerzielle Empfehlungen.",
    commercial: true
  }
];

type LoadStatus = "checking" | "guest" | "loading" | "ready" | "error";

/**
 * Signed-in-only. Guests never see this - there is nothing to authenticate
 * a consent write against, and account creation must never imply marketing
 * consent. Self-checks auth so app/account/page.tsx can render it
 * unconditionally.
 *
 * v1.26e.1: the form only ever becomes editable after a SUCCESSFUL
 * canonical GET. A failed read shows a restrained retry state instead of
 * four unchecked toggles - those would look like real opt-outs and let the
 * user overwrite existing consent with a fabricated all-false save.
 */
export function CommunicationPreferences() {
  const [status, setStatus] = useState<LoadStatus>("checking");
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_COMMUNICATION_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/communication-preferences");
      if (!response.ok) {
        setStatus("error");
        return;
      }
      const body = await response.json();
      if (!body?.preferences) {
        setStatus("error");
        return;
      }
      setPreferences(body.preferences);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    if (!supabase) {
      setStatus("guest");
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) {
        setStatus("guest");
        return;
      }
      load();
    });

    return () => {
      active = false;
    };
  }, [load]);

  function toggle(key: keyof Preferences) {
    setPreferences(current => ({ ...current, [key]: !current[key] }));
    setMessage("");
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/communication-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences)
      });
      const body = await response.json();
      if (!response.ok || !body?.preferences) {
        setMessage("Speichern fehlgeschlagen. Bitte noch einmal versuchen.");
        return;
      }
      setPreferences(body.preferences);
      setMessage(
        body.providerSync === "failed"
          ? "Gespeichert. Die Kommunikations-Synchronisierung wird später erneut versucht."
          : "Preferences saved."
      );
    } catch {
      setMessage("Speichern fehlgeschlagen. Bitte noch einmal versuchen.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "checking" || status === "guest") return null;

  if (status === "error") {
    return (
      <section className="communicationPreferences" aria-labelledby="communication-preferences-title">
        <div className="eyebrow lime">MY AROUND / COMMUNICATION</div>
        <h2 id="communication-preferences-title">WHAT SHOULD AROUND SEND YOU?</h2>
        <p className="communicationPreferencesError">Kommunikationseinstellungen konnten gerade nicht geladen werden.</p>
        <button type="button" className="secondary" onClick={load}>RETRY →</button>
      </section>
    );
  }

  if (status === "loading") return null;

  return (
    <section className="communicationPreferences" aria-labelledby="communication-preferences-title">
      <div className="eyebrow lime">MY AROUND / COMMUNICATION</div>
      <h2 id="communication-preferences-title">WHAT SHOULD AROUND SEND YOU?</h2>
      <div className="communicationPreferencesList">
        {FIELDS.map(field => (
          <label className="communicationPreferenceRow" key={field.key}>
            <div>
              <strong>
                {field.label}
                {field.commercial ? <span className="communicationPreferenceCommercial">Kommerziell</span> : null}
              </strong>
              <p>{field.description}</p>
            </div>
            <input
              type="checkbox"
              checked={preferences[field.key]}
              onChange={() => toggle(field.key)}
              aria-label={field.label}
            />
          </label>
        ))}
      </div>
      <div className="communicationPreferencesActions">
        <button type="button" className="primary" onClick={save} disabled={saving}>
          {saving ? "Speichert …" : "SAVE PREFERENCES →"}
        </button>
        {message ? <p className="communicationPreferencesMessage" role="status">{message}</p> : null}
      </div>
    </section>
  );
}
