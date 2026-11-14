"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOGIN_REQUIRED_EVENT, SAVE_HINT_EVENT, type LoginReason } from "@/lib/account-gate";
import { track } from "@/lib/analytics/track";
import { GoogleMark } from "./GoogleMark";

const COPY: Record<LoginReason, { eyebrow: string; title: string; text: string }> = {
  save_limit: {
    eyebrow: "FÜNF SIND VOLL",
    title: "Mit Konto merkt sich AROUND alles.",
    text: "Ohne Konto ist nach fünf Saves Schluss. Mit Konto speicherst du unbegrenzt, auf jedem Gerät. Was du gerade speichern wolltest, ist danach schon drin."
  },
  pass: {
    eyebrow: "AROUND PASS",
    title: "Sammle deine Plätze.",
    text: "Gespielte Plätze und deine Bucket List liegen in deinem Konto. Jeder Platz gibt einen Stempel im AROUND Pass. Kein Passwort, nur Google oder ein Code per Mail."
  },
  trip: {
    eyebrow: "TRIPS BRAUCHEN EIN KONTO",
    title: "Damit dein Plan nicht im Browser hängen bleibt.",
    text: "Trips liegen in deinem Konto und sind auf jedem Gerät da. Deine Saves kommen mit. Kein Passwort, nur Google oder ein Code per Mail."
  }
};

/**
 * Bottom sheet that turns a guest limit into an account. Opened via
 * requestLogin() (lib/account-gate.ts); also shows the soft hint before the
 * last free save.
 */
export function LoginGate() {
  const pathname = usePathname() || "/";
  const [reason, setReason] = useState<LoginReason | null>(null);
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onLogin(event: Event) {
      const next = (event as CustomEvent<{ reason: LoginReason }>).detail?.reason || "save_limit";
      setHint(false);
      setReason(next);
      track("login_prompt_shown", { slug: next });
    }
    function onHint() {
      setHint(true);
      track("save_limit_hint");
    }
    window.addEventListener(LOGIN_REQUIRED_EVENT, onLogin);
    window.addEventListener(SAVE_HINT_EVENT, onHint);
    return () => {
      window.removeEventListener(LOGIN_REQUIRED_EVENT, onLogin);
      window.removeEventListener(SAVE_HINT_EVENT, onHint);
    };
  }, []);

  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(false), 7000);
    return () => window.clearTimeout(timer);
  }, [hint]);

  useEffect(() => {
    if (!reason) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reason]);

  function close() {
    if (reason) track("login_prompt_dismissed", { slug: reason });
    setReason(null);
  }

  async function google() {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(pathname)}` }
    });
    if (error) setBusy(false);
  }

  const accountHref = `/account?next=${encodeURIComponent(pathname)}`;

  return (
    <>
      {hint && !reason ? (
        <div className="saveHint" role="status">
          <span>Noch ein Platz frei. Mit Konto speicherst du unbegrenzt.</span>
          <Link href={accountHref} onClick={() => setHint(false)}>Anmelden →</Link>
          <button type="button" aria-label="Hinweis schließen" onClick={() => setHint(false)}>×</button>
        </div>
      ) : null}

      {reason ? (
        <div className="loginGate" role="dialog" aria-modal="true" aria-labelledby="login-gate-title">
          <button type="button" className="loginGateBackdrop" aria-label="Schließen" onClick={close} />
          <div className="loginGateSheet">
            <div className="eyebrow lime">{COPY[reason].eyebrow}</div>
            <h2 id="login-gate-title">{COPY[reason].title}</h2>
            <p>{COPY[reason].text}</p>
            <button type="button" className="accountGoogle" disabled={busy} onClick={google}>
              <GoogleMark />
              Mit Google weiter
            </button>
            <Link className="loginGateMail" href={accountHref} onClick={() => setReason(null)}>Mit E-Mail-Code anmelden →</Link>
            <button type="button" className="accountTextButton" onClick={close}>Später</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
