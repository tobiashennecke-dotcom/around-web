"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadProfile, saveProfile, type Profile } from "@/lib/profile/profile";
import { TRAVEL_COMPANIONS, TRIP_EXTRAS, TRIP_PURPOSES, type Option } from "@/lib/profile/options";
import { track } from "@/lib/analytics/track";

const HIDDEN_ON = ["/account", "/auth", "/studio", "/preview", "/admin", "/my-around/profil", "/datenschutz", "/impressum"];

/**
 * Three quick questions right after the first login. Skippable, never
 * asked again once answered or skipped. Everything else lives on the
 * profile page (/my-around/profil).
 */
export function ProfileOnboarding() {
  const pathname = usePathname() || "/";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<{ tripPurposes: string[]; travelCompanions: string[]; tripExtras: string[] }>({
    tripPurposes: [], travelCompanions: [], tripExtras: []
  });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let active = true;

    async function check() {
      try {
        const result = await loadProfile();
        if (!active || !result) return;
        setProfile(result.profile);
        if (!result.profile.onboardingCompletedAt && !result.profile.onboardingDismissedAt) setOpen(true);
      } catch {
        // Columns not migrated yet or offline: simply don't show onboarding.
      }
    }

    check();
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_IN") check();
      if (event === "SIGNED_OUT") setOpen(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!open || !profile || HIDDEN_ON.some(prefix => pathname.startsWith(prefix))) return null;

  async function finish(skipped: boolean) {
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const patch: Partial<Profile> = skipped
        ? { onboardingDismissedAt: now }
        : { ...answers, onboardingCompletedAt: now };
      await saveProfile(patch, profile || undefined);
      track(skipped ? "onboarding_skipped" : "onboarding_completed", { value: step + 1 });
    } catch {
      // Don't trap the user in the sheet if saving fails.
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  type Key = keyof typeof answers;
  const steps: { key: Key; question: string; options: readonly Option[] }[] = [
    { key: "tripPurposes", question: "Wofür planst du Golfreisen?", options: TRIP_PURPOSES },
    { key: "travelCompanions", question: "Wer kommt mit?", options: TRAVEL_COMPANIONS },
    { key: "tripExtras", question: "Was gehört neben Golf dazu?", options: TRIP_EXTRAS }
  ];
  const current = steps[step];

  function toggle(key: Key, value: string) {
    setAnswers(a => ({
      ...a,
      [key]: a[key].includes(value) ? a[key].filter(item => item !== value) : [...a[key], value]
    }));
  }

  return (
    <div className="loginGate" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="loginGateBackdrop" aria-hidden="true" />
      <div className="loginGateSheet onboardingSheet">
        <div className="eyebrow lime">DEIN AROUND · {step + 1}/{steps.length}</div>
        <h2 id="onboarding-title">{current.question}</h2>
        <p>Mehrere Antworten möglich. Damit wir dir passende Plätze, Hotels und Stories zeigen.</p>
        <div className="chipGroup">
          {current.options.map(option => (
            <button key={option.value} type="button" className="chip" aria-pressed={answers[current.key].includes(option.value)}
              onClick={() => toggle(current.key, option.value)}>
              {option.label}
            </button>
          ))}
        </div>
        <div className="onboardingActions">
          {step > 0 ? <button type="button" className="accountTextButton" onClick={() => setStep(s => s - 1)}>← Zurück</button> : <span />}
          {step < steps.length - 1 ? (
            <button type="button" className="primary" onClick={() => setStep(s => s + 1)}>Weiter →</button>
          ) : (
            <button type="button" className="primary" disabled={busy} onClick={() => finish(false)}>Fertig →</button>
          )}
        </div>
        <div className="onboardingFoot">
          <button type="button" className="accountTextButton" disabled={busy} onClick={() => finish(true)}>Überspringen</button>
          <Link className="accountTextButton" href="/my-around/profil" onClick={() => setOpen(false)}>Ganzes Profil ausfüllen</Link>
        </div>
      </div>
    </div>
  );
}
