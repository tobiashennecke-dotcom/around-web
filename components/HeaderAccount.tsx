"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifySaveChange } from "@/lib/supabase/saves";

export function HeaderAccount() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setReady(true);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setReady(true);
      if (!session?.user) setOpen(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function logout() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    notifySaveChange();
    setUserEmail(null);
    setOpen(false);
  }

  if (!ready || !userEmail) {
    return <Link className="headerAccount" href="/account">{ready ? "Anmelden" : "Account"}</Link>;
  }

  return (
    <div className="headerAccountWrap" ref={wrapRef}>
      <button
        type="button"
        className="headerAccount headerAccountButton"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Account <span className="accountChevron" aria-hidden="true">{open ? "↑" : "↓"}</span>
      </button>
      {open && (
        <div className="accountMenu" role="menu">
          <div className="accountMenuEyebrow">MY AROUND ACCOUNT</div>
          <div className="accountMenuEmail">{userEmail}</div>
          <Link href="/saved" role="menuitem" onClick={() => setOpen(false)}>MY AROUND öffnen →</Link>
          <Link href="/my-around/collections" role="menuitem" onClick={() => setOpen(false)}>Collections →</Link>
          <Link href="/account" role="menuitem" onClick={() => setOpen(false)}>Account verwalten →</Link>
          <button type="button" role="menuitem" onClick={logout}>Abmelden</button>
        </div>
      )}
    </div>
  );
}
