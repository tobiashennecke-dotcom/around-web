"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadProfile, saveProfile, type Profile } from "@/lib/profile/profile";
import { PLAY_FREQUENCY, TRAVEL_PARTY, TRIP_EXTRAS } from "@/lib/profile/options";
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
  const [answers, setAnswers] = useState<{ playFrequency: string | null; travelParty: string | null; tripExtras: string[] }>({
    playFrequency: null, travelParty: null, tripExtras: []
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

  const steps = [
    {
      question: "Wie oft spielst du?",
      body: (
        <div className="chipGroup">
          {PLAY_FREQUENCY.map(option => (
            <button key={option.value} type="button" className="chip" aria-pressed={answers.playFrequency === option.value}
              onClick={() => { setAnswers(a => ({ ...a, playFrequency: option.value })); setStep(1); }}>
              {option.label}
            </button>
          ))}
        </div>
      )
    },
    {
      question: "Mit wem bist du unterwegs?",
      body: (
        <div className="chipGroup">
          {TRAVEL_PARTY.map(option => (
            <button key={option.value} type="button" className="chip" aria-pressed={answers.travelParty === option.value}
              onClick={() => { setAnswers(a => ({ ...a, travelParty: option.value })); setStep(2); }}>
              {option.label}
            </button>
          ))}
        </div>
      )
    },
    {
      question: "Was soll eine Reise neben Golf noch haben?",
      body: (
        <div className="chipGroup">
          {TRIP_EXTRAS.map(option => {
            const selected = answers.tripExtras.includes(option.value);
            return (
              <button key={option.value} type="button" className="chip" aria-pressed={selected}
                onClick={() => setAnswers(a => ({
                  ...a,
                  tripExtras: selected ? a.tripExtras.filter(value => value !== option.value) : [...a.tripExtras, option.value]
                }))}>
                {option.label}
              </button>
            );
          })}
        </div>
      )
    }
  ];

  return (
    <div className="loginGate" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="loginGateBackdrop" aria-hidden="true" />
      <div className="loginGateSheet onboardingSheet">
        <div className="eyebrow lime">DEIN AROUND · {step + 1}/3</div>
        <h2 id="onboarding-title">{steps[step].question}</h2>
        <p>Damit wir dir passende Plätze, Hotels und Stories zeigen. Dauert zehn Sekunden.</p>
        {steps[step].body}
        <div className="onboardingActions">
          {step > 0 ? <button type="button" className="accountTextButton" onClick={() => setStep(s => s - 1)}>← Zurück</button> : <span />}
          {step === 2 ? (
            <button type="button" className="primary" disabled={busy} onClick={() => finish(false)}>Fertig →</button>
          ) : null}
        </div>
        <div className="onboardingFoot">
          <button type="button" className="accountTextButton" disabled={busy} onClick={() => finish(true)}>Überspringen</button>
          <Link className="accountTextButton" href="/my-around/profil" onClick={() => setOpen(false)}>Ganzes Profil ausfüllen</Link>
        </div>
      </div>
    </div>
  );
}
