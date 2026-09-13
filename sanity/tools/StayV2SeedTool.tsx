"use client";

import {useState} from "react";
import {useClient} from "sanity";

const GUT_STEINBACH_SLUG = "gut-steinbach";

// Verified property coordinates (Steinbachweg 10, 83242 Reit im Winkl). Only
// applied via setIfMissing below, so a coordinate a human already set in
// Studio is never overwritten.
const GUT_STEINBACH_COORDINATES = {_type: "geopoint" as const, lat: 47.6671046, lng: 12.4814630};

const stayV2Patch = {
  whyWeLikeIt: "Das Gut Steinbach funktioniert weniger wie ein klassisches Golfhotel als wie ein Rückzugsort, um den sich eine Chiemgau-Reise bauen lässt. Zimmer, Suiten und freistehende Chalets liegen auf einem weitläufigen Gut; dazu kommen Spa und Restaurant direkt auf dem Gelände. Für AROUND ist vor allem die Kombination interessant: tagsüber Golf und Berge, danach muss man kein zweites Programm mehr suchen. Man kommt zurück und bleibt.",
  aroundTake: "Keine Golfanlage mit angeschlossenem Hotel – sondern eine starke alpine Base, von der aus Golf, Chiemgau und Kaiserwinkl zusammen funktionieren.",
  theFeel: ["Alpine", "Quiet", "Natural", "Refined", "Secluded"],
  bestFor: ["Golf weekends", "Couples", "Spa after 18", "Slow travel", "Chalet stays"],
  aroundMoment: "Nach der Runde zurück aufs Gut, noch einmal in den Spa und danach zum Abendessen – ohne wieder ins Auto zu steigen.",
  knowBeforeYouGo: "Für eine Golfreise ist ein Auto die praktischste Lösung. Hunde sind zwar in fast allen Zimmern und Chalets willkommen, aber nicht in allen öffentlichen Bereichen, darunter der SPA.",

  stayCharacter: "Alpine Retreat",
  accommodationTypes: ["Rooms", "Suites", "Chalets"],
  roomSummary: "50 Zimmer & Suiten im Haupthaus · 3 Suiten im Steinbacher Hof · 7 freistehende Chalets",
  spaSummary: "2.000 m² Heimat & Natur SPA · Indoorpool · Saunen · Dampfbad · Treatments",
  foodSummary: "Restaurant HEIMAT direkt auf dem Gut",
  breakfastSummary: "Frühstück im Haupthaus · Chalet-Frühstück auf Wunsch im Chalet",
  parkingSummary: "Parken auf dem Gut · E-Lademöglichkeiten vorhanden",
  dogPolicy: "Hunde in fast allen Zimmern und Chalets willkommen · Einschränkungen im SPA und einzelnen öffentlichen Bereichen",
  checkIn: "Ab 15:00",
  checkOut: "Bis 12:00",
  openAllYear: true,
  recommendedNightsMin: 3,
  recommendedNightsMax: 5,
  golfBaseWhy: "Die Lage zwischen Chiemgau und Kaiserwinkl macht Gut Steinbach zu einer interessanten Base für mehrere Golftage. Entscheidend ist dabei nicht nur die Nähe zu verschiedenen Plätzen: Nach der Runde funktionieren Spa, Restaurant und Rückzug direkt am Hotel – genau das macht eine Base für AROUND stärker als nur eine Adresse zum Schlafen.",

  editorialStatus: "researched" as const
};

export function StayV2SeedTool() {
  const client = useClient({apiVersion: "2026-03-01"}).withConfig({useCdn: false});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const addLog = (line: string) => setLog(prev => [...prev, line]);

  async function runUpdate() {
    if (running) return;
    setRunning(true); setDone(false); setError(""); setLog([]);
    try {
      const doc = await client.fetch(
        `*[_type == "place" && placeType == "stay" && slug.current == $slug][0]{
          _id, title, "slug": slug.current,
          "hasDestination": defined(destination),
          "hasHero": defined(heroImage),
          "galleryCount": count(gallery),
          "hasCoordinates": defined(coordinates),
          address, bookingUrl, bookingLabel, commercialPartner
        }`,
        {slug: GUT_STEINBACH_SLUG}
      );
      if (!doc?._id) {
        throw new Error(`Kein Place-Dokument mit placeType "stay" und Slug "${GUT_STEINBACH_SLUG}" gefunden. Es wird kein neues Dokument angelegt - bitte zuerst das Basis-Dokument in Sanity anlegen.`);
      }
      addLog(`✓ Dokument gefunden: „${doc.title}“ (${doc._id}, Slug: ${doc.slug || "—"}).`);

      const now = new Date().toISOString();

      await client
        .patch(doc._id)
        .set({
          ...stayV2Patch,
          lastEditorialReviewAt: now,
          operatorStatus: {source: "around" as const, lastVerifiedAt: now}
        })
        .setIfMissing({bookingLabel: "Verfügbarkeit prüfen", coordinates: GUT_STEINBACH_COORDINATES})
        .commit();

      addLog("✓ STAY-V2-Felder gepatcht: Editorial (whyWeLikeIt, aroundTake, theFeel, bestFor, aroundMoment, knowBeforeYouGo), STAY Details (stayCharacter, accommodationTypes, roomSummary, spaSummary, foodSummary, breakfastSummary, parkingSummary, dogPolicy, checkIn, checkOut, openAllYear, recommendedNightsMin/Max, golfBaseWhy), Internal (editorialStatus, lastEditorialReviewAt), Operator Status.");
      addLog(
        `✓ Bestehende Inhalte unverändert erhalten: _id, Slug (${doc.slug || "—"}), Destination-Relation (${doc.hasDestination ? "vorhanden" : "fehlt"}), Hero-Bild (${doc.hasHero ? "vorhanden" : "fehlt"}), Gallery (${doc.galleryCount ?? 0} Bilder), Adresse (${doc.address || "—"}), commercialPartner (${String(Boolean(doc.commercialPartner))}, unverändert).`
      );
      addLog(
        doc.bookingUrl
          ? `ℹ bookingUrl war bereits gesetzt (${doc.bookingUrl}) und wurde nicht verändert.`
          : "ℹ bookingUrl wurde bewusst nicht gesetzt (keine verifizierte URL im Dokument vorhanden)."
      );
      addLog(
        doc.bookingLabel
          ? `ℹ bookingLabel war bereits gesetzt (${doc.bookingLabel}) und wurde nicht verändert.`
          : "✓ bookingLabel war leer und wurde auf „Verfügbarkeit prüfen“ gesetzt (setIfMissing)."
      );
      addLog(
        doc.hasCoordinates
          ? "ℹ Koordinaten waren bereits gesetzt und wurden nicht verändert."
          : "✓ Koordinaten waren leer und wurden auf die verifizierte Position gesetzt (setIfMissing, Steinbachweg 10, 83242 Reit im Winkl)."
      );
      addLog("✓ Keine Live-Preise, keine erfundenen Fahrzeiten gesetzt.");
      addLog("✓ Fertig.");
      setDone(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message); addLog(`✕ ${message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{minHeight: "100%", background: "#f5f3ee", color: "#212322", padding: "48px 24px", fontFamily: "Inter, Arial, sans-serif"}}>
      <div style={{maxWidth: 860, margin: "0 auto"}}>
        <div style={{fontSize: 12, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 18}}>AROUND · STAY V2 SEED</div>
        <h1 style={{fontSize: "clamp(36px,6vw,68px)", lineHeight: .96, letterSpacing: "-.05em", margin: "0 0 24px"}}>GUT STEINBACH<br/>STAY V2 UPDATE.</h1>
        <p style={{fontSize: 18, lineHeight: 1.5, maxWidth: 700, margin: "0 0 28px"}}>
          Findet das bestehende Place-Dokument mit <code>placeType == "stay"</code> und Slug <code>{GUT_STEINBACH_SLUG}</code> und patched es mit
          den STAY-V2-Feldern. Verwendet <code>client.patch(id).set(...).setIfMissing(...).commit()</code> – keine Neuanlage
          (<code>createOrReplace</code>), kein Überschreiben von <code>bookingUrl</code> oder <code>commercialPartner</code>. Existiert das Dokument
          nicht unter genau diesem Slug, wird nichts angelegt und stattdessen ein Hinweis angezeigt.
        </p>

        <button
          onClick={runUpdate}
          disabled={running}
          style={{border: 0, background: "#d6ea2a", color: "#212322", fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", padding: "16px 22px", fontSize: 14, cursor: running ? "wait" : "pointer"}}
        >
          {running ? "AKTUALISIERT …" : done ? "NOCHMAL AKTUALISIEREN" : "GUT STEINBACH STAY V2 AKTUALISIEREN"}
        </button>

        {error && <div style={{marginTop: 20, padding: 16, background: "#f55096", fontWeight: 800}}>Fehler: {error}</div>}

        <div style={{marginTop: 28, background: "#212322", color: "#f5f3ee", padding: 20, minHeight: 150, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.7}}>
          {log.length ? log.map((line, i) => <div key={`${i}-${line}`}>{line}</div>) : <div style={{opacity: .65}}>Bereit. Noch nicht aktualisiert.</div>}
        </div>
      </div>
    </div>
  );
}
