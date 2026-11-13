"use client";

import { GoogleMark } from "@/components/GoogleMark";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifySaveChange } from "@/lib/supabase/saves";

type Step = "email" | "code";

const RESEND_SECONDS = 60;

const AUTH_ERRORS: Record<string, string> = {
  magic_link_failed: "Der Link ist abgelaufen oder wurde schon benutzt. Hol dir einfach einen neuen.",
  oauth_failed: "Die Anmeldung mit Google hat nicht geklappt. Probier es noch mal oder nimm deine E-Mail."
};

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/my-around";
}

function friendlyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) {
    return "Google-Login ist noch nicht freigeschaltet. Nimm vorerst deine E-Mail.";
  }
  if (m.includes("rate limit") || m.includes("security purposes")) {
    return "Zu viele Versuche. Warte kurz und probier es dann noch mal.";
  }
  if (m.includes("expired") || m.includes("invalid")) {
    return "Der Code stimmt nicht oder ist abgelaufen. Prüf ihn oder hol dir einen neuen.";
  }
  return message;
}

export function AccountClient() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [next, setNext] = useState("/my-around");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(safeNext(params.get("next")));
    const authError = params.get("auth_error");
    if (authError) setMessage(AUTH_ERRORS[authError] ?? "Die Anmeldung hat nicht geklappt. Probier es noch mal.");

    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function callbackUrl() {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase ist noch nicht verbunden.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl(), shouldCreateUser: true }
    });
    setBusy(false);
    if (error) {
      setMessage(friendlyError(error.message));
      return;
    }
    setStep("code");
    setCode("");
    setCooldown(RESEND_SECONDS);
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.replace(/\s/g, ""),
      type: "email"
    });
    setBusy(false);
    if (error) {
      setMessage(friendlyError(error.message));
      return;
    }
    notifySaveChange();
    window.location.assign(next);
  }

  async function google() {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase ist noch nicht verbunden.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() }
    });
    if (error) {
      setBusy(false);
      setMessage(friendlyError(error.message));
    }
  }

  async function logout() {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    notifySaveChange();
    setUserEmail(null);
    setStep("email");
    setMessage("Du bist jetzt abgemeldet.");
  }

  if (userEmail) {
    return (
      <div className="featureCard accountSignedInCard">
        <div>
          <div className="eyebrow lime">MY AROUND ACCOUNT</div>
          <h2>Synchronisiert.</h2>
          <div className="accountIdentity">
            <span>Eingeloggt als</span>
            <strong>{userEmail}</strong>
          </div>
          <p className="serif accountSyncCopy">Deine Saves, Collections und Trips liegen jetzt in deinem Account. Auf jedem Gerät.</p>
        </div>
        <div className="accountActions">
          <a className="primary" href="/my-around">MY AROUND öffnen →</a>
          <button className="secondary accountLogout" disabled={busy} onClick={logout}>
            {busy ? "Abmelden …" : "Abmelden"}
          </button>
        </div>
        {message && <p className="accountMessage">{message}</p>}
      </div>
    );
  }

  if (step === "code") {
    return (
      <form className="featureCard dark accountLoginCard" onSubmit={verifyCode}>
        <div>
          <div className="eyebrow lime">FAST DRIN</div>
          <h2>Check dein<br/>Postfach.</h2>
          <p className="serif accountSyncCopy">
            Wir haben dir eine Mail an <strong>{email}</strong> geschickt. Klick auf den Link oder tipp den Code hier ein.
          </p>
        </div>

        <div>
          <label className="accountLabel" htmlFor="account-code">Code aus der Mail</label>
          <input
            id="account-code"
            className="searchInput accountEmailInput accountCodeInput"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,10}"
            required
            placeholder="123456"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button className="primary" disabled={busy || code.replace(/\s/g, "").length < 6} style={{ marginTop: 18 }}>
            {busy ? "Prüfen …" : "Anmelden →"}
          </button>
          <div className="accountSecondaryRow">
            <button type="button" className="accountTextButton" disabled={busy || cooldown > 0} onClick={() => sendCode()}>
              {cooldown > 0 ? `Neuer Code in ${cooldown} s` : "Neuen Code schicken"}
            </button>
            <button type="button" className="accountTextButton" onClick={() => { setStep("email"); setMessage(""); }}>
              Andere Adresse
            </button>
          </div>
          {message && <p className="accountMessage" role="alert">{message}</p>}
        </div>
      </form>
    );
  }

  return (
    <form className="featureCard dark accountLoginCard" onSubmit={sendCode}>
      <div>
        <div className="eyebrow lime">MY AROUND ACCOUNT</div>
        <h2>Merken.<br/>Überall.</h2>
        <p className="serif accountSyncCopy">
          Speichern geht auch ohne Account. Mit Account liegen deine Saves, Collections und Trips auf jedem Gerät. Kein Passwort nötig.
        </p>
      </div>

      <div>
        <button type="button" className="accountGoogle" disabled={busy} onClick={google}>
          <GoogleMark />
          Mit Google weiter
        </button>

        <div className="accountDivider"><span>oder mit E-Mail</span></div>

        <label className="accountLabel" htmlFor="account-email">E-Mail</label>
        <input
          id="account-email"
          className="searchInput accountEmailInput"
          type="email"
          autoComplete="email"
          required
          placeholder="deine@email.de"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button className="primary" disabled={busy} style={{ marginTop: 18 }}>
          {busy ? "Senden …" : "Link & Code schicken →"}
        </button>
        <p className="accountFinePrint">Neu hier? Dann legen wir deinen Account automatisch an.</p>
        {message && <p className="accountMessage" role="alert">{message}</p>}
      </div>
    </form>
  );
}
