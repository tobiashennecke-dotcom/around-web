"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifySaveChange } from "@/lib/supabase/saves";
import { ACCOUNT_DELETE_CONFIRMATION, GUEST_STORAGE_KEYS } from "@/lib/account-deletion";

const ERROR_COPY: Record<string, string> = {
  deletion_unavailable: "Das Löschen ist gerade nicht verfügbar. Schreib uns bitte, dann löschen wir dein Konto von Hand.",
  confirmation_required: `Bitte tippe ${ACCOUNT_DELETE_CONFIRMATION} zur Bestätigung.`,
  unauthorized: "Deine Sitzung ist abgelaufen. Bitte melde dich neu an."
};

/** Self-service account deletion, deliberately tucked away and double-confirmed. */
export function AccountDeletion({ onDeleted }: { onDeleted: () => void }) {
  const [open,setOpen] = useState(false);
  const [confirmation,setConfirmation] = useState("");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");

  const confirmed = confirmation.trim().toUpperCase() === ACCOUNT_DELETE_CONFIRMATION;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!confirmed) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(ERROR_COPY[data.error] || "Das hat nicht geklappt. Bitte versuch es noch einmal.");
        setBusy(false);
        return;
      }
    } catch {
      setMessage("Keine Verbindung. Bitte versuch es noch einmal.");
      setBusy(false);
      return;
    }

    try {
      for (const key of GUEST_STORAGE_KEYS) localStorage.removeItem(key);
    } catch {
      // Storage can be unavailable (private mode); the account is gone either way.
    }
    await createClient()?.auth.signOut().catch(() => undefined);
    notifySaveChange();
    onDeleted();
  }

  if (!open) {
    return (
      <button type="button" className="textLink accountDeleteToggle" onClick={()=>setOpen(true)}>
        Konto löschen
      </button>
    );
  }

  return (
    <form className="accountDelete" onSubmit={submit}>
      <div className="eyebrow">KONTO LÖSCHEN</div>
      <p>
        Dein Konto, deine Saves, Collections, Trips und E-Mail-Einstellungen werden endgültig gelöscht.
        Das lässt sich nicht rückgängig machen.
      </p>
      <label className="accountDeleteLabel" htmlFor="account-delete-confirmation">
        Tippe {ACCOUNT_DELETE_CONFIRMATION} zur Bestätigung
      </label>
      <input
        id="account-delete-confirmation"
        className="searchInput accountDeleteInput"
        autoComplete="off"
        value={confirmation}
        onChange={e=>setConfirmation(e.target.value)}
      />
      <div className="accountActions">
        <button className="secondary accountDeleteButton" disabled={!confirmed || busy}>
          {busy ? "Löschen …" : "Endgültig löschen"}
        </button>
        <button type="button" className="textLink" onClick={()=>{setOpen(false);setConfirmation("");setMessage("");}}>
          Abbrechen
        </button>
      </div>
      {message && <p className="accountMessage">{message}</p>}
    </form>
  );
}
