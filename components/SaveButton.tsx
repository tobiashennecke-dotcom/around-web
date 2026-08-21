"use client";

import { useEffect, useState } from "react";
import {
  isSaved,
  SAVES_CHANGED_EVENT,
  toggleSave
} from "@/lib/supabase/saves";

type Props = {
  sourceId: string;
  sourceType: string;
  title: string;
  slug: string;
  label?: string;
};

export function SaveButton({ sourceId, sourceType, title, slug, label }: Props) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function syncState() {
      try {
        const result = await isSaved(sourceId);
        if (active) setSaved(result);
      } catch {
        // Save state is a progressive enhancement; keep the control usable.
      }
    }

    syncState();
    window.addEventListener(SAVES_CHANGED_EVENT, syncState);
    window.addEventListener("storage", syncState);

    return () => {
      active = false;
      window.removeEventListener(SAVES_CHANGED_EVENT, syncState);
      window.removeEventListener("storage", syncState);
    };
  }, [sourceId]);

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await toggleSave({ sourceId, sourceType, title, slug });
      setSaved(result.saved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={label ? "secondary saveLabelButton" : "saveButton saveButtonV14"}
      data-saved={saved}
      data-busy={busy}
      onClick={handleSave}
      aria-pressed={saved}
      disabled={busy}
      aria-label={`${title} ${saved ? "nicht mehr speichern" : "speichern"}`}
    >
      <span className="saveDrop" aria-hidden="true" />
      {label ? <span>{saved ? "Gespeichert" : label}</span> : null}
    </button>
  );
}
