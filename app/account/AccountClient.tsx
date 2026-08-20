"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AccountClient() {
  const [email,setEmail] = useState("");
  const [message,setMessage] = useState("");
  const [userEmail,setUserEmail] = useState<string | null>(null);
  const [busy,setBusy] = useState(false);

  const supabase = createClient();

  useEffect(()=>{
    if (!supabase) return;
    supabase.auth.getUser().then(({data})=>setUserEmail(data.user?.email ?? null));
  },[]);

  async function submit(event: FormEvent) {
    event.preventDefault();
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
    setMessage(error ? error.message : "Magic Link ist unterwegs. Bitte E-Mail prüfen.");
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserEmail(null);
    setMessage("Abgemeldet.");
  }

  if (userEmail) {
    return (
      <div className="featureCard" style={{minHeight:320}}>
        <div>
          <div className="eyebrow lime">MY AROUND ACCOUNT</div>
          <h2 style={{fontSize:48}}>Angemeldet.</h2>
          <p>{userEmail}</p>
        </div>
        <button className="secondary" onClick={logout}>Abmelden</button>
      </div>
    );
  }

  return (
    <form className="featureCard dark" style={{minHeight:380}} onSubmit={submit}>
      <div>
        <div className="eyebrow lime">MY AROUND ACCOUNT</div>
        <h2 style={{fontSize:48}}>Merken.<br/>Überall.</h2>
        <p className="serif" style={{fontSize:22}}>
          Ein Magic Link genügt. Kein Passwort, kein Signup-Funnel.
        </p>
      </div>

      <div>
        <input
          className="searchInput"
          style={{color:"#F5F3EE",borderColor:"#F5F3EE",fontSize:28}}
          type="email"
          required
          placeholder="deine@email.de"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
        <button className="primary" disabled={busy} style={{marginTop:18}}>
          {busy ? "Senden …" : "Magic Link senden →"}
        </button>
        {message && <p style={{marginTop:15}}>{message}</p>}
      </div>
    </form>
  );
}
