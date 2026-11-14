"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listPlaceMarks, PLACE_MARKS_CHANGED_EVENT, setPlayedOn, togglePlaceMark, type PlaceMark } from "@/lib/supabase/place-marks";
import { listUserTrips } from "@/lib/supabase/trips";
import { loadProfile, type Profile } from "@/lib/profile/profile";
import { computeBadges, passStats } from "@/lib/profile/badges";

function formatDate(value?: string) {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
}

export function PassClient() {
  const [state, setState] = useState<"loading" | "guest" | "ready">("loading");
  const [marks, setMarks] = useState<PlaceMark[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tripCount, setTripCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      const [nextMarks, nextProfile, trips] = await Promise.all([
        listPlaceMarks(),
        loadProfile().catch(() => null),
        listUserTrips().catch(() => null)
      ]);
      if (!active) return;
      if (!nextMarks) return setState("guest");
      setMarks(nextMarks);
      setProfile(nextProfile?.profile ?? null);
      setTripCount(trips?.mode === "account" ? trips.trips.length : 0);
      setState("ready");
    }
    load();
    window.addEventListener(PLACE_MARKS_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(PLACE_MARKS_CHANGED_EVENT, load);
    };
  }, []);

  const played = useMemo(() => marks.filter(mark => mark.kind === "played"), [marks]);
  const bucket = useMemo(() => marks.filter(mark => mark.kind === "bucket"), [marks]);
  const playedIds = useMemo(() => new Set(played.map(mark => mark.sourceId)), [played]);
  const stats = passStats(marks);
  const badges = profile ? computeBadges({ profile, marks, tripCount }) : [];

  if (state === "loading") return <div className="savedLoading">Pass wird geladen …</div>;
  if (state === "guest") {
    return (
      <div className="myAroundHomeEmpty">
        <div className="eyebrow lime">NUR MIT KONTO</div>
        <h2>DEIN PASS WARTET.</h2>
        <p className="serif">Melde dich an, dann sammelst du für jeden gespielten Platz einen Stempel.</p>
        <div className="myAroundHomeEmptyActions">
          <Link className="primary" href="/account?next=/my-around/pass">ANMELDEN →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="passLayout">
      <div className="passCounters">
        <div><span>{stats.courses}</span>Plätze</div>
        <div><span>{stats.countries}</span>Länder</div>
        <div><span>{stats.destinations}</span>Destinationen</div>
        <div><span>{stats.bucketDone}/{stats.bucketTotal}</span>Bucket List</div>
      </div>

      <section className="passBlock">
        <h2>Stempel</h2>
        {played.length === 0 ? (
          <p className="profileHint">Noch kein Stempel. Auf jeder PLAY-Seite gibt es den Knopf „Hier gespielt“. <Link href="/discover">Plätze entdecken →</Link></p>
        ) : (
          <div className="passStamps">
            {played.map((mark, index) => (
              <div key={mark.sourceId} className={`passStamp passStamp--${index % 4}`}>
                <div className="passStampInner">
                  <span className="passStampTop">{(mark.country || mark.destinationTitle || "AROUND").toUpperCase()}</span>
                  <Link href={mark.slug ? `/places/${mark.slug}` : "#"} className="passStampTitle">{mark.title}</Link>
                  <span className="passStampDate">{formatDate(mark.playedOn) || "GESPIELT"}</span>
                </div>
                <label className="passStampEdit">
                  <span className="visuallyHidden">Datum für {mark.title}</span>
                  <input type="date" value={mark.playedOn || ""} onChange={e => setPlayedOn(mark.sourceId, e.target.value || null)} />
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="passBlock">
        <h2>Bucket List</h2>
        {bucket.length === 0 ? (
          <p className="profileHint">Leer. Auf PLAY-Seiten mit „+ Bucket List“ füllen.</p>
        ) : (
          <>
            <div className="passProgress" aria-label={`${stats.bucketDone} von ${stats.bucketTotal} gespielt`}>
              <div style={{ width: `${stats.bucketTotal ? Math.round((stats.bucketDone / stats.bucketTotal) * 100) : 0}%` }} />
            </div>
            <ul className="passBucket">
              {bucket.map(mark => {
                const done = playedIds.has(mark.sourceId);
                return (
                  <li key={mark.sourceId} data-done={done}>
                    <span className="passBucketCheck" aria-hidden="true">{done ? "✓" : ""}</span>
                    <Link href={mark.slug ? `/places/${mark.slug}` : "#"}>{mark.title}</Link>
                    <span className="passBucketMeta">{mark.destinationTitle || ""}</span>
                    {!done ? (
                      <button type="button" className="accountTextButton profileDarkLink" onClick={() => togglePlaceMark("played", mark)}>Gespielt</button>
                    ) : <span />}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section className="passBlock">
        <h2>Abzeichen</h2>
        <div className="passBadges">
          {badges.map(badge => (
            <div key={badge.id} className="passBadge" data-earned={badge.earned}>
              <strong>{badge.label}</strong>
              <span>{badge.description}</span>
            </div>
          ))}
        </div>
      </section>

      <nav className="profileQuickNav">
        <Link href="/my-around/steckbrief">STECKBRIEF TEILEN →</Link>
        <Link href="/my-around/profil">PROFIL →</Link>
      </nav>
    </div>
  );
}
