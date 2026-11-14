"use client";

import { useEffect, useState } from "react";
import { listPlaceMarks, PLACE_MARKS_CHANGED_EVENT, togglePlaceMark, type PlaceMarkPayload } from "@/lib/supabase/place-marks";

/** "Hier gespielt" (AROUND Pass) and "Bucket List" on PLAY pages. */
export function PlaceMarkButtons({ payload }: { payload: PlaceMarkPayload }) {
  const [played, setPlayed] = useState(false);
  const [bucket, setBucket] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stamp, setStamp] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const marks = await listPlaceMarks();
      if (!active || !marks) return;
      setPlayed(marks.some(mark => mark.kind === "played" && mark.sourceId === payload.sourceId));
      setBucket(marks.some(mark => mark.kind === "bucket" && mark.sourceId === payload.sourceId));
    }
    load();
    window.addEventListener(PLACE_MARKS_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(PLACE_MARKS_CHANGED_EVENT, load);
    };
  }, [payload.sourceId]);

  async function toggle(kind: "played" | "bucket") {
    if (busy) return;
    setBusy(true);
    try {
      const result = await togglePlaceMark(kind, payload);
      if (result === null) return;
      if (kind === "played") {
        setPlayed(result);
        if (result) {
          setStamp(true);
          window.setTimeout(() => setStamp(false), 2600);
        }
      } else {
        setBucket(result);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="placeMarks">
      <button type="button" className="placeMarkButton" aria-pressed={played} disabled={busy} onClick={() => toggle("played")}>
        {played ? "✓ Gespielt" : "Hier gespielt"}
      </button>
      <button type="button" className="placeMarkButton" aria-pressed={bucket} disabled={busy} onClick={() => toggle("bucket")}>
        {bucket ? "Auf der Bucket List" : "+ Bucket List"}
      </button>
      {stamp ? (
        <div className="placeMarkStamp" role="status">
          <span>AROUND PASS</span>
          <strong>{payload.title}</strong>
          <span>Gestempelt</span>
        </div>
      ) : null}
    </div>
  );
}
