"use client";

import { useEffect, useState } from "react";
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

/**
 * Signed-in-only. Guests never see this - there is nothing to authenticate
 * a consent write against, and account creation must never imply marketing
 * consent. Self-checks auth so app/account/page.tsx can render it
 * unconditionally.
 */
export function CommunicationPreferences() {
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_COMMUNICATION_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (!data.user) {
        setSignedIn(false);
        setReady(true);
        return;
      }
      setSignedIn(true);
      try {
        const response = await fetch("/api/communication-preferences");
        const body = await response.json();
        if (active && response.ok && body?.preferences) setPreferences(body.preferences);
      } finally {
        if (active) setReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

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

  if (!ready || !signedIn) return null;

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
