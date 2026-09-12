"use client";

import {useState} from "react";
import {useClient} from "sanity";

const GOLFCLUB_ID = "around-place-golfclub-reit-im-winkl-koessen";

const playV2Patch = {
  theFeel: ["Alpine", "Strategic", "Scenic", "Hilly", "Border-crossing"],
  bestFor: ["Mountain golf", "Golf weekends", "Scenery hunters", "Course collectors", "Players who like variety"],
  aroundMoment: "Loch 12. Vom erhöhten Abschlag liegt Reit im Winkl unter dir. Vor dir wartet ein langes Par 3 steil bergab – einer dieser Schläge, bei denen Landschaft, Topografie und Golf für einen Moment perfekt zusammenpassen.",
  knowBeforeYouGo: "Das ist keine flache Resort-Runde. Höhenunterschiede und Hanglagen gehören zum Charakter des Platzes, dazu kommen an mehreren Bahnen Biotope, Gräben und Ausgrenzen ins Spiel. Wer den Platz zum ersten Mal spielt, profitiert deshalb mehr von einer guten Strategie als von maximaler Länge.",
  whyWeLikeIt: "Die Besonderheit ist nicht nur die Grenze. Reit im Winkl-Kössen fühlt sich wie eine echte Berg-Runde an: Höhenwechsel, schräge Lagen, Biotope und Gräben sorgen dafür, dass man selten einfach nur den Driver zieht und geradeaus spielt. Zwölf Bahnen liegen in Bayern, sechs in Tirol – doch die Runde lebt weniger vom Gimmick als davon, dass sie immer wieder Entscheidungen verlangt. Angriff oder Position? Länge oder Winkel? Risiko oder noch ein Schlag? Dazu öffnet sich ständig der Blick auf die Chiemgauer Alpen und das Kaisergebirge.",
  aroundTake: "Ein Platz mit Story und Substanz: zwei Länder, alpines Gelände, starke Bilder – und genug strategische Fragen, damit die Kulisse nicht zum einzigen Grund für die Runde wird.",

  holes: 18,
  par: 70,
  courseCharacter: "Alpin · Strategisch",
  walkability: "Hügelig",
  cartAvailability: "E-Carts verfügbar",
  practiceFacilities: ["Driving Range", "Putting Green", "Übungsbunker"],
  guestPlay: "Gastspiel möglich · aktuelle Bedingungen vor der Runde auf der offiziellen Clubseite prüfen",
  season: "April–Anfang November",

  suggestedDurationMinutes: 270,
  suggestedDaypart: "morning" as const,
  defaultPlanningMode: "fixed" as const,

  commercialPartner: false,

  editorialStatus: "researched" as const
};

export function PlayV2SeedTool() {
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
        `*[_id == $id][0]{
          _id, title, "slug": slug.current,
          "hasDestination": defined(destination),
          "hasHero": defined(heroImage),
          "galleryCount": count(gallery),
          address, bookingUrl
        }`,
        {id: GOLFCLUB_ID}
      );
      if (!doc?._id) {
        throw new Error(`Dokument ${GOLFCLUB_ID} wurde nicht gefunden. Bitte zuerst den Bayern Seed / Reit im Winkl Seed ausführen.`);
      }
      addLog(`✓ Dokument gefunden: „${doc.title}“ (${doc._id}, Slug: ${doc.slug || "—"}).`);

      const now = new Date().toISOString();
      const patch = {
        ...playV2Patch,
        lastEditorialReviewAt: now,
        operatorStatus: {source: "around" as const, lastVerifiedAt: now}
      };

      await client.patch(GOLFCLUB_ID).set(patch).commit();
      addLog("✓ PLAY-V2-Felder gepatcht: Editorial (theFeel, bestFor, aroundMoment, knowBeforeYouGo, whyWeLikeIt, aroundTake), PLAY Details (holes, par, courseCharacter, walkability, cartAvailability, practiceFacilities, guestPlay, season), Planning (suggestedDurationMinutes, suggestedDaypart, defaultPlanningMode), Commercial (commercialPartner), Internal (editorialStatus, lastEditorialReviewAt), Operator Status.");
      addLog(
        `✓ Bestehende Inhalte unverändert erhalten: _id, Slug (${doc.slug || "—"}), Destination-Relation (${doc.hasDestination ? "vorhanden" : "fehlt"}), Hero-Bild (${doc.hasHero ? "vorhanden" : "fehlt"}), Gallery (${doc.galleryCount ?? 0} Bilder), Adresse (${doc.address || "—"}).`
      );
      addLog(
        doc.bookingUrl
          ? `ℹ bookingUrl war bereits gesetzt (${doc.bookingUrl}) und wurde nicht verändert.`
          : "ℹ bookingUrl wurde bewusst nicht gesetzt (keine verifizierte URL im Dokument vorhanden)."
      );
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
        <div style={{fontSize: 12, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 18}}>AROUND · PLAY V2 SEED</div>
        <h1 style={{fontSize: "clamp(36px,6vw,68px)", lineHeight: .96, letterSpacing: "-.05em", margin: "0 0 24px"}}>GOLFCLUB REIT IM WINKL-KÖSSEN<br/>PLAY V2 UPDATE.</h1>
        <p style={{fontSize: 18, lineHeight: 1.5, maxWidth: 700, margin: "0 0 28px"}}>
          Patched genau ein bestehendes Dokument (<code>{GOLFCLUB_ID}</code>) mit den neuen PLAY-V2-Feldern.
          Verwendet <code>client.patch(...).set(...).commit()</code> – keine Neuanlage, keine unveränderten Felder werden angefasst.
        </p>

        <button
          onClick={runUpdate}
          disabled={running}
          style={{border: 0, background: "#d6ea2a", color: "#212322", fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", padding: "16px 22px", fontSize: 14, cursor: running ? "wait" : "pointer"}}
        >
          {running ? "AKTUALISIERT …" : done ? "NOCHMAL AKTUALISIEREN" : "REIT IM WINKL PLAY V2 AKTUALISIEREN"}
        </button>

        {error && <div style={{marginTop: 20, padding: 16, background: "#f55096", fontWeight: 800}}>Fehler: {error}</div>}

        <div style={{marginTop: 28, background: "#212322", color: "#f5f3ee", padding: 20, minHeight: 150, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.7}}>
          {log.length ? log.map((line, i) => <div key={`${i}-${line}`}>{line}</div>) : <div style={{opacity: .65}}>Bereit. Noch nicht aktualisiert.</div>}
        </div>
      </div>
    </div>
  );
}
