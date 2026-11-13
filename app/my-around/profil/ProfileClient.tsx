"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { EMPTY_PROFILE, loadProfile, saveProfile, type Profile } from "@/lib/profile/profile";
import {
  BUDGET_LEVEL, COURSE_PREFERENCES, HANDICAP_BAND, INTERESTS, MONTHS, PLAY_FREQUENCY,
  TRAVEL_MODES, TRAVEL_PARTY, TRIP_EXTRAS, TRIP_LENGTH, WISHLIST_REGIONS, type Option
} from "@/lib/profile/options";
import { getConsent, openConsentSettings, CONSENT_CHANGED_EVENT } from "@/lib/analytics/consent";
import { track } from "@/lib/analytics/track";

type ListKey = "coursePreferences" | "travelModes" | "wishlistRegions" | "tripExtras" | "interests";
type OneKey = "handicapBand" | "playFrequency" | "travelParty" | "tripLength" | "budgetLevel";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="profileBlock">
      <h2>{title}</h2>
      <div className="profileFields">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="profileField">
      <div className="accountLabel profileLabel">{label}</div>
      {children}
      {hint ? <p className="profileHint">{hint}</p> : null}
    </div>
  );
}

export function ProfileClient() {
  const [state, setState] = useState<"loading" | "guest" | "ready" | "error">("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [saved, setSaved] = useState<Profile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<Profile>(EMPTY_PROFILE);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [consent, setConsentState] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState("");

  useEffect(() => {
    loadProfile()
      .then(result => {
        if (!result) return setState("guest");
        setEmail(result.email);
        setSaved(result.profile);
        setDraft(result.profile);
        setState("ready");
      })
      .catch(() => setState("error"));
    setConsentState(getConsent());
    const onConsent = () => setConsentState(getConsent());
    window.addEventListener(CONSENT_CHANGED_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onConsent);
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft(current => ({ ...current, [key]: value }));
    setMessage("");
  }

  function toggleList(key: ListKey, value: string) {
    setDraft(current => {
      const list = current[key];
      return { ...current, [key]: list.includes(value) ? list.filter(item => item !== value) : [...list, value] };
    });
    setMessage("");
  }

  function oneOf(key: OneKey, options: readonly Option[]) {
    return (
      <div className="chipGroup">
        {options.map(option => (
          <button key={option.value} type="button" className="chip" aria-pressed={draft[key] === option.value}
            onClick={() => set(key, draft[key] === option.value ? null : option.value)}>
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  function manyOf(key: ListKey, options: readonly Option[]) {
    return (
      <div className="chipGroup">
        {options.map(option => (
          <button key={option.value} type="button" className="chip" aria-pressed={draft[key].includes(option.value)}
            onClick={() => toggleList(key, option.value)}>
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const patch: Partial<Profile> = { ...draft };
      delete patch.onboardingCompletedAt;
      delete patch.onboardingDismissedAt;
      if (!saved.onboardingCompletedAt) patch.onboardingCompletedAt = new Date().toISOString();
      const next = await saveProfile(patch, saved);
      setSaved(next);
      setDraft(next);
      setMessage("Gespeichert.");
      track("profile_updated");
    } catch {
      setMessage("Speichern hat nicht geklappt. Probier es noch mal.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    if (deleteText !== "LÖSCHEN") return;
    setBusy(true);
    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "LÖSCHEN" })
    });
    if (response.ok) {
      await createClient()?.auth.signOut();
      window.location.assign("/");
      return;
    }
    setBusy(false);
    setMessage("Das Konto konnte nicht gelöscht werden. Schreib uns, wir erledigen das von Hand.");
  }

  if (state === "loading") return <div className="savedLoading">Profil wird geladen …</div>;
  if (state === "error") return <p>Das Profil konnte gerade nicht geladen werden. Bitte später noch einmal versuchen.</p>;
  if (state === "guest") {
    return (
      <div className="myAroundHomeEmpty">
        <div className="eyebrow lime">NUR MIT KONTO</div>
        <h2>ERST ANMELDEN.</h2>
        <p className="serif">Dein Profil liegt in deinem Konto. Anmelden geht mit Google oder einem Code per Mail.</p>
        <div className="myAroundHomeEmptyActions">
          <Link className="primary" href="/account?next=/my-around/profil">ANMELDEN →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profileLayout">
      <Block title="Ich">
        <Field label="Name">
          <input className="profileInput" value={draft.displayName} maxLength={80} onChange={e => set("displayName", e.target.value)} placeholder="Wie sollen wir dich nennen?" />
        </Field>
        <Field label="Wohnregion" hint="Bundesland oder Region reicht. Wir brauchen keine Adresse.">
          <input className="profileInput" value={draft.homeRegion} maxLength={80} onChange={e => set("homeRegion", e.target.value)} placeholder="z. B. Oberbayern" />
        </Field>
        <Field label="Heimatflughafen" hint="Für Ziele, die man gut erreicht.">
          <input className="profileInput" value={draft.homeAirport} maxLength={80} onChange={e => set("homeAirport", e.target.value)} placeholder="z. B. München" />
        </Field>
      </Block>

      <Block title="Golf">
        <Field label="Handicap">{oneOf("handicapBand", HANDICAP_BAND)}</Field>
        <Field label="Wie oft spielst du?">{oneOf("playFrequency", PLAY_FREQUENCY)}</Field>
        <Field label="Heimatclub">
          <input className="profileInput" value={draft.homeClub} maxLength={120} onChange={e => set("homeClub", e.target.value)} placeholder="optional" />
        </Field>
        <Field label="Was zählt am Platz?">{manyOf("coursePreferences", COURSE_PREFERENCES)}</Field>
      </Block>

      <Block title="Reisen">
        <Field label="Mit wem?">{oneOf("travelParty", TRAVEL_PARTY)}</Field>
        <Field label="Wie lange?">{oneOf("tripLength", TRIP_LENGTH)}</Field>
        <Field label="Wann am liebsten?">
          <div className="chipGroup chipGroup--months">
            {MONTHS.map(month => (
              <button key={month.value} type="button" className="chip" aria-pressed={draft.preferredMonths.includes(month.value)}
                onClick={() => set("preferredMonths", draft.preferredMonths.includes(month.value)
                  ? draft.preferredMonths.filter(value => value !== month.value)
                  : [...draft.preferredMonths, month.value])}>
                {month.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Budget">{oneOf("budgetLevel", BUDGET_LEVEL)}</Field>
        <Field label="Anreise">{manyOf("travelModes", TRAVEL_MODES)}</Field>
        <Field label="Wohin als Nächstes?">{manyOf("wishlistRegions", WISHLIST_REGIONS)}</Field>
        <Field label="Was soll die Reise noch haben?">{manyOf("tripExtras", TRIP_EXTRAS)}</Field>
      </Block>

      <Block title="Themen">
        <Field label="Was interessiert dich bei AROUND?">{manyOf("interests", INTERESTS)}</Field>
      </Block>

      <Block title="Einwilligungen">
        <label className="profileCheck">
          <input type="checkbox" checked={draft.consentPartnerOffers} onChange={e => set("consentPartnerOffers", e.target.checked)} />
          <span><strong>Partner-Angebote, die zu mir passen.</strong> AROUND schickt dir gelegentlich Angebote von Hotels, Clubs oder Destinationen, die zu deinem Profil und deinen Saves passen. Partner bekommen deine Adresse nicht.</span>
        </label>
        <label className="profileCheck">
          <input type="checkbox" checked={draft.consentMarketResearch} onChange={e => set("consentMarketResearch", e.target.checked)} />
          <span><strong>Anonyme Marktauswertung.</strong> Deine Profilangaben dürfen zusammengefasst mit anderen in Auswertungen für Partner einfließen, z. B. „30 % der Interessenten reisen zu zweit“. Nie einzeln, nie mit Namen.</span>
        </label>
        <div className="profileField">
          <div className="accountLabel profileLabel">Mitzählen auf dieser Website</div>
          <p className="profileHint">Aktuell: {consent === "full" ? "Einverstanden" : consent === "essential" ? "Nur notwendige" : "Noch nicht entschieden"}</p>
          <button type="button" className="accountTextButton profileDarkLink" onClick={openConsentSettings}>Cookie-Einstellungen ändern</button>
        </div>
        <p className="profileHint">Newsletter und Benachrichtigungen stellst du unter <Link href="/account">Account</Link> ein.</p>
      </Block>

      <div className="profileSaveBar">
        <span>{message || (dirty ? "Ungespeicherte Änderungen" : "Alles gespeichert")}</span>
        <button type="button" className="primary" disabled={busy || !dirty} onClick={save}>{busy ? "Speichern …" : "Speichern"}</button>
      </div>

      <Block title="Konto">
        <Field label="Angemeldet als"><p className="profileValue">{email}</p></Field>
        <Field label="Deine Daten" hint="Alles, was AROUND zu deinem Konto speichert, als Datei.">
          <a className="accountTextButton profileDarkLink" href="/api/account/export">Daten herunterladen</a>
        </Field>
        <Field label="Konto löschen" hint="Löscht Konto, Profil, Saves, Collections und Trips endgültig. Tipp zur Bestätigung LÖSCHEN ein.">
          <div className="profileDeleteRow">
            <input className="profileInput" value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="LÖSCHEN" />
            <button type="button" className="secondary" disabled={busy || deleteText !== "LÖSCHEN"} onClick={deleteAccount}>Endgültig löschen</button>
          </div>
        </Field>
      </Block>
    </div>
  );
}
