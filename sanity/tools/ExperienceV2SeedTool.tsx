"use client";

import {useState} from "react";
import {useClient} from "sanity";

const SCHMIEDE_ID = "around-place-grillhaus-alte-schmiede";
const WINKLMOOS_ID = "around-place-winklmoos-alm";

// Geographic reference points used by AROUND relevance.
// Alte Schmiede: actual restaurant location, Hausbergstraße 3, 83242 Reit im Winkl.
// Source cross-check: official Reit im Winkl listing + map/geodata result for the exact address.
const SCHMIEDE_COORDINATES = {
  _type: "geopoint" as const,
  lat: 47.6790975,
  lng: 12.4706601
};

// Winklmoos-Alm: representative central point of the Winklmoos-Alm locality/plateau,
// not a specific restaurant, parking area, hut or lift station.
// Source cross-check: Winklmoos-Alm locality / OSM-Geonames point.
const WINKLMOOS_COORDINATES = {
  _type: "geopoint" as const,
  lat: 47.65765,
  lng: 12.58228
};

const COORDINATES_BY_ID: Record<string, {_type:"geopoint"; lat:number; lng:number}> = {
  [SCHMIEDE_ID]: SCHMIEDE_COORDINATES,
  [WINKLMOOS_ID]: WINKLMOOS_COORDINATES
};

function fact(_key: string, label: string, value: string) {
  return {_type: "fact", _key, label, value};
}

const schmiedePatch = {
  // Editorial
  theFeel: ["Historic", "Warm", "Characterful", "Social"],
  bestFor: ["Dinner night", "After golf", "Couples", "Small groups"],
  aroundMoment: "Nach der Runde ankommen, den ersten Drink bestellen und den Abend bewusst zum Programmpunkt machen – statt nur irgendwo noch essen zu gehen.",
  knowBeforeYouGo: "Die Alte Schmiede funktioniert für AROUND vor allem als geplanter Dinner-Abend. Wer sie fest in den Trip einbauen möchte, sollte den Tisch vorher organisieren.",

  // Planning intelligence - deliberately no suggestedTime: we know dinner is the
  // right daypart, not the user's actual reservation time. Trip Fit Engine works
  // from real trip/reservation context later, never an invented 19:00/19:30 default.
  defaultPlanningMode: "fixed" as const,
  suggestedDurationMinutes: 120,
  suggestedDaypart: "evening" as const,
  compatibleDayparts: ["evening"] as const,
  effortLevel: "low" as const,
  environment: "indoor" as const,
  weatherSensitivity: "low" as const,

  // EAT Details - priceLevel/dietaryNotes intentionally omitted (no manually
  // maintained value to preserve, and not part of this agreed v1.24 patch).
  eatCharacter: "Historic Grill House",
  mealTypes: ["dinner", "drinks"],
  cuisine: ["Grill", "Regional", "International"],
  setting: "Historic house",
  reservationAdvice: "Für einen bewusst geplanten Dinner-Abend Reservierung empfohlen.",

  // Reference cleanup (v1.24a.3): the legacy Charakter/Küche/Planung facts are now
  // fully represented by eatCharacter, cuisine and the planning metadata above -
  // nothing genuinely additive remains, so the array is intentionally empty.
  goodToKnow: [] as ReturnType<typeof fact>[]
};

const winklmoosPatch = {
  // Editorial
  theFeel: ["Alpine", "Open", "Scenic", "Slow", "Expansive"],
  bestFor: ["Half day", "Outdoor days", "Families", "Views", "Slow travel"],
  aroundMoment: "Oben ankommen, die Berge aufmachen lassen und erst dann entscheiden, wie der Tag weitergeht – Richtung Weg, Hütte, Aussicht oder einfach noch ein bisschen bleiben.",
  knowBeforeYouGo: "Die Winklmoos-Alm verändert sich stark mit Wetter und Jahreszeit. AROUND sollte sie deshalb als flexiblen Outdoor-Baustein behandeln, nicht als starren Programmpunkt.",

  // Planning intelligence - no suggestedTime, same reasoning as Alte Schmiede.
  defaultPlanningMode: "flexible" as const,
  suggestedDurationMinutes: 240,
  suggestedDaypart: "morning" as const,
  compatibleDayparts: ["morning", "midday", "afternoon", "all_day"] as const,
  effortLevel: "medium" as const,
  environment: "outdoor" as const,
  weatherSensitivity: "high" as const,

  // EXPERIENCE Details - no live opening hours, lift/toll pricing or operating status.
  experienceType: "Alpine plateau / Outdoor",
  experienceDurationLabel: "Half day / Full day",
  season: "Year-round · access varies by season",
  bookingAdvice: "No booking for the plateau itself · check seasonal access separately",

  // Reference cleanup (v1.24a.3): the legacy "Planung" fact (Halbtag/Ganztag) now
  // duplicates experienceDurationLabel/compatibleDayparts, so it's dropped. Höhe and
  // Charakter stay - altitude and the specific activity list (Wandern/Ski/Dark Sky/
  // Hütten) aren't represented by experienceType or any other structured field.
  goodToKnow: [
    fact("w1", "Höhe", "Almplateau auf rund 1.170 m"),
    fact("w2", "Charakter", "Wandern · Ski · Dark Sky · Hütten")
  ]
};

const PATCHED_FIELD_SUMMARY: Record<string, string> = {
  [SCHMIEDE_ID]: "Editorial (theFeel, bestFor, aroundMoment, knowBeforeYouGo), Planning (defaultPlanningMode, suggestedDurationMinutes, suggestedDaypart, compatibleDayparts, effortLevel, environment, weatherSensitivity - suggestedTime NOT touched), EAT Details (eatCharacter, mealTypes, cuisine, setting, reservationAdvice), goodToKnow cleaned up to [] (Charakter/Küche/Planung now fully covered by structured fields), Geo coordinates via setIfMissing, Internal (lastEditorialReviewAt, editorialStatus via setIfMissing).",
  [WINKLMOOS_ID]: "Editorial (theFeel, bestFor, aroundMoment, knowBeforeYouGo), Planning (defaultPlanningMode, suggestedDurationMinutes, suggestedDaypart, compatibleDayparts, effortLevel, environment, weatherSensitivity - suggestedTime NOT touched), EXPERIENCE Details (experienceType, experienceDurationLabel, season, bookingAdvice), goodToKnow cleaned up to Höhe + Charakter only (legacy Planung fact removed as duplicate), Geo coordinates via setIfMissing, Internal (lastEditorialReviewAt, editorialStatus via setIfMissing)."
};

type RunConfig = {
  id: string;
  expectedPlaceType: string;
  label: string;
  patch: Record<string, unknown>;
};

export function ExperienceV2SeedTool() {
  const client = useClient({apiVersion: "2026-03-01"}).withConfig({useCdn: false});
  const [runningId, setRunningId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const addLog = (line: string) => setLog(prev => [...prev, line]);

  async function runUpdate(config: RunConfig) {
    if (runningId) return;
    setRunningId(config.id); setError(""); setLog([]);
    try {
      const doc = await client.fetch(
        `*[_id == $id][0]{
          _id, title, placeType, "slug": slug.current,
          "hasDestination": defined(destination),
          "hasHero": defined(heroImage),
          "galleryCount": count(gallery),
          "hasCoordinates": defined(coordinates),
          coordinates,
          bookingUrl, commercialPartner, aroundSelected, editorialStatus
        }`,
        {id: config.id}
      );

      if (!doc?._id) {
        throw new Error(`NOT FOUND: Dokument ${config.id} existiert nicht. Es wird kein Ersatzdokument angelegt - bitte zuerst prüfen, ob der Reit im Winkl Seed gelaufen ist.`);
      }
      addLog(`✓ Dokument gefunden: „${doc.title}“ (${doc._id}, Slug: ${doc.slug || "—"}).`);

      if (doc.placeType !== config.expectedPlaceType) {
        throw new Error(`placeType-Mismatch: erwartet "${config.expectedPlaceType}", gefunden "${doc.placeType || "—"}". Patch abgebrochen, um kein falsches Dokument zu verändern.`);
      }
      addLog(`✓ placeType stimmt überein: "${doc.placeType}".`);

      const now = new Date().toISOString();
      const fallbackCoordinates = COORDINATES_BY_ID[config.id];
      if (!fallbackCoordinates) throw new Error(`Keine freigegebenen Geo-Koordinaten für ${config.id} konfiguriert.`);

      await client
        .patch(config.id)
        .set({...config.patch, lastEditorialReviewAt: now})
        .setIfMissing({editorialStatus: "researched", coordinates: fallbackCoordinates})
        .commit();

      addLog(`✓ v1.24-Felder gepatcht: ${PATCHED_FIELD_SUMMARY[config.id]}`);
      addLog(`✓ Destination-Relation: ${doc.hasDestination ? "vorhanden" : "fehlt"} (unverändert).`);
      addLog(`✓ Hero-Bild: ${doc.hasHero ? "vorhanden" : "fehlt"} (unverändert).`);
      addLog(`✓ Gallery: ${doc.galleryCount ?? 0} Bilder (unverändert).`);
      addLog(
        doc.hasCoordinates
          ? `✓ Koordinaten: bereits vorhanden (${doc.coordinates?.lat ?? "?"}, ${doc.coordinates?.lng ?? "?"}) und wegen setIfMissing NICHT überschrieben.`
          : `✓ Koordinaten: fehlten und wurden per setIfMissing gesetzt (${fallbackCoordinates.lat}, ${fallbackCoordinates.lng}).`
      );
      addLog(
        doc.bookingUrl
          ? `ℹ bookingUrl: vorhanden (${doc.bookingUrl}), unverändert.`
          : "ℹ bookingUrl: nicht gesetzt, unverändert."
      );
      addLog(`✓ commercialPartner erhalten: ${String(Boolean(doc.commercialPartner))} (nicht angefasst).`);
      addLog(`✓ aroundSelected erhalten: ${String(Boolean(doc.aroundSelected))} (nicht angefasst).`);
      addLog(
        doc.editorialStatus
          ? `ℹ editorialStatus war bereits "${doc.editorialStatus}" und wurde NICHT überschrieben (setIfMissing).`
          : `✓ editorialStatus war leer und wurde auf "researched" gesetzt (setIfMissing).`
      );
      addLog("✓ operatorStatus nicht angefasst - dies ist ein editorial/Planning-Patch, kein Operator-Verification-Event.");
      addLog(`✓ Fertig: ${config.label}.`);
      setDoneIds(prev => new Set(prev).add(config.id));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message); addLog(`✕ ${message}`);
    } finally {
      setRunningId(null);
    }
  }

  const running = Boolean(runningId);

  return (
    <div style={{minHeight: "100%", background: "#f5f3ee", color: "#212322", padding: "48px 24px", fontFamily: "Inter, Arial, sans-serif"}}>
      <div style={{maxWidth: 860, margin: "0 auto"}}>
        <div style={{fontSize: 12, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 18}}>AROUND · EXPERIENCE V2 SEED</div>
        <h1 style={{fontSize: "clamp(36px,6vw,64px)", lineHeight: .96, letterSpacing: "-.05em", margin: "0 0 24px"}}>EAT + DO<br/>REFERENCE INTELLIGENCE.</h1>
        <p style={{fontSize: 18, lineHeight: 1.5, maxWidth: 700, margin: "0 0 28px"}}>
          Patched zwei bestehende Dokumente (<code>{SCHMIEDE_ID}</code>, <code>{WINKLMOOS_ID}</code>) mit den v1.24-Feldern.
          Verwendet <code>client.patch(id).set(...).setIfMissing(...).commit()</code> - keine Neuanlage, kein Überschreiben von
          vorhandenen Koordinaten, bookingUrl, commercialPartner, aroundSelected oder einem bereits gesetzten editorialStatus.
        </p>

        <div style={{display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20}}>
          <button
            onClick={() => runUpdate({id: SCHMIEDE_ID, expectedPlaceType: "eat", label: "Alte Schmiede EAT V2", patch: schmiedePatch})}
            disabled={running}
            style={{border: 0, background: "#d6ea2a", color: "#212322", fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", padding: "16px 22px", fontSize: 13, cursor: running ? "wait" : "pointer"}}
          >
            {runningId === SCHMIEDE_ID ? "AKTUALISIERT …" : doneIds.has(SCHMIEDE_ID) ? "ALTE SCHMIEDE NOCHMAL AKTUALISIEREN" : "ALTE SCHMIEDE EAT V2 AKTUALISIEREN"}
          </button>
          <button
            onClick={() => runUpdate({id: WINKLMOOS_ID, expectedPlaceType: "do", label: "Winklmoos-Alm DO V2", patch: winklmoosPatch})}
            disabled={running}
            style={{border: 0, background: "#d6ea2a", color: "#212322", fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", padding: "16px 22px", fontSize: 13, cursor: running ? "wait" : "pointer"}}
          >
            {runningId === WINKLMOOS_ID ? "AKTUALISIERT …" : doneIds.has(WINKLMOOS_ID) ? "WINKLMOOS-ALM NOCHMAL AKTUALISIEREN" : "WINKLMOOS-ALM DO V2 AKTUALISIEREN"}
          </button>
        </div>

        {error && <div style={{marginTop: 4, marginBottom: 20, padding: 16, background: "#f55096", fontWeight: 800}}>Fehler: {error}</div>}

        <div style={{background: "#212322", color: "#f5f3ee", padding: 20, minHeight: 150, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.7}}>
          {log.length ? log.map((line, i) => <div key={`${i}-${line}`}>{line}</div>) : <div style={{opacity: .65}}>Bereit. Noch nicht aktualisiert.</div>}
        </div>
      </div>
    </div>
  );
}
