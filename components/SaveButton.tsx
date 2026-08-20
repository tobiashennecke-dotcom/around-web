"use client";

import { useState } from "react";
import { toggleSave } from "@/lib/supabase/saves";

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

  async function handleSave() {
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
      className={label ? "secondary" : "saveButton"}
      data-saved={saved}
      onClick={handleSave}
      aria-pressed={saved}
      disabled={busy}
      aria-label={`${title} ${saved ? "nicht mehr speichern" : "speichern"}`}
    >
      {label && <span className="drop" />}
      {label ? (saved ? "Gespeichert" : label) : null}
    </button>
  );
}
