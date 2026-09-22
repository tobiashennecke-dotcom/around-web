"use client";

import { useState } from "react";

type Props = {
  title: string;
  label?: string;
  saved?: boolean;
  onToggle?: (saved: boolean) => void;
};

/**
 * Presentation-only clone of components/SaveButton.tsx: same markup/CSS
 * contract (.saveButton/.saveButtonV14, .saveDrop, data-saved) so it looks
 * identical, but state is local useState only — it never imports
 * lib/supabase/saves.ts and never touches auth or a real account.
 */
export function PreviewSaveButton({ title, label, saved: controlledSaved, onToggle }: Props) {
  const [localSaved, setLocalSaved] = useState(false);
  const saved = controlledSaved ?? localSaved;

  function handleClick() {
    const next = !saved;
    if (controlledSaved === undefined) setLocalSaved(next);
    onToggle?.(next);
  }

  return (
    <button
      type="button"
      className={label ? "secondary saveLabelButton" : "saveButton saveButtonV14"}
      data-saved={saved}
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={`${title} ${saved ? "nicht mehr speichern (Demo)" : "speichern (Demo)"}`}
    >
      <span className="saveDrop" aria-hidden="true" />
      {label ? <span>{saved ? "Gespeichert" : label}</span> : null}
    </button>
  );
}
