"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifySaveChange } from "@/lib/supabase/saves";

export function AccountClient() {
  const [email,setEmail] = useState("");
  const [message,setMessage] = useState("");
  const [userEmail,setUserEmail] = useState<string | null>(null);
  const [busy,setBusy] = useState(false);

  useEffect(()=>{
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({data})=>setUserEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session)=>{
      setUserEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  },[]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage("Supabase ist noch nicht verbunden.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    setBusy(false);
    setMessage(error ? error.message : "Magic Link ist unterwegs. Danach landen deine Gast-Saves automatisch in MY AROUND.");
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
          <p className="serif accountSyncCopy">Deine Saves werden geräteübergreifend in MY AROUND gespeichert.</p>
        </div>
        <div className="accountActions">
          <a className="primary" href="/saved">MY AROUND öffnen →</a>
          <button className="secondary accountLogout" disabled={busy} onClick={logout}>
            {busy ? "Abmelden …" : "Abmelden"}
          </button>
        </div>
        {message && <p className="accountMessage">{message}</p>}
      </div>
    );
  }

  return (
    <form className="featureCard dark accountLoginCard" onSubmit={submit}>
      <div>
        <div className="eyebrow lime">MY AROUND ACCOUNT</div>
        <h2>Merken.<br/>Überall.</h2>
        <p className="serif accountSyncCopy">
          Speichern funktioniert sofort ohne Login. Der Magic Link synchronisiert deine Auswahl über Geräte hinweg.
        </p>
      </div>

      <div>
        <input
          className="searchInput accountEmailInput"
          type="email"
          required
          placeholder="deine@email.de"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <button className="primary" disabled={busy} style={{marginTop:18}}>
          {busy ? "Senden …" : "Magic Link senden →"}
        </button>
        {message && <p className="accountMessage">{message}</p>}
      </div>
    </form>
  );
}
