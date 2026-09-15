"use client";

import {useState} from "react";
import {useClient} from "sanity";

/**
 * AROUND — Stories Hub Seed (v1.25b)
 *
 * Manages exactly one document: the around-stories-hub singleton. Does NOT
 * create, edit or touch any Story or Destination - it only references their
 * existing, already-live deterministic ids.
 *
 * Safety model: createIfNotExists() so a rerun never duplicates the
 * singleton, then .patch(id).set(...) to keep the curation fields in sync -
 * safe to rerun any number of times.
 */

const STORIES_HUB_ID = "around-stories-hub";

const LEAD_STORY_ID = "around-story-golfclub-reit-im-winkl-two-countries"; // "EIN GOLFPLATZ. ZWEI LÄNDER."
const SECONDARY_STORY_IDS = [
  "around-story-estonia-48-hours", // "TALLINN. PÄRNU. LINKS GOLF. REPEAT."
  "around-story-soma-bay-worth-the-trip" // "ZWISCHEN WÜSTE UND ROTEM MEER."
];
const FEATURED_DESTINATION_IDS = [
  "around-destination-reit-im-winkl",
  "around-destination-soma-bay",
  "around-destination-portugal-silver-coast",
  "around-destination-parnu"
];

function ref(_ref: string, _key: string) {
  return {_type: "reference", _ref, _key};
}

const storiesHubDoc = {
  _id: STORIES_HUB_ID,
  _type: "storiesHub",
  editionLabel: "AROUND / ISSUE 01 · SEPTEMBER 2026",
  leadStory: ref(LEAD_STORY_ID, "lead"),
  secondaryStories: SECONDARY_STORY_IDS.map((id, index) => ref(id, `secondary-${index}`)),
  featuredDestinations: FEATURED_DESTINATION_IDS.map((id, index) => ref(id, `dest-${index}`))
};

type LogFn = (line: string) => void;

export function StoriesHubSeedTool() {
  const client = useClient({apiVersion: "2026-03-01"}).withConfig({useCdn: false});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [summary, setSummary] = useState<{lead?: string; secondary: string[]; destinations: string[]} | null>(null);
  const addLog: LogFn = line => setLog(prev => [...prev, line]);

  async function runSeed() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setError("");
    setLog([]);
    setSummary(null);
    try {
      addLog(`→ Prüfe referenzierte Dokumente …`);
      const referencedIds = [LEAD_STORY_ID, ...SECONDARY_STORY_IDS, ...FEATURED_DESTINATION_IDS];
      const existing = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: referencedIds});
      const missing = referencedIds.filter(id => !existing.includes(id));
      if (missing.length) {
        throw new Error(`Referenzierte Dokumente fehlen: ${missing.join(", ")}. Bitte zuerst den Editorial Pilot Pack Seed ausführen.`);
      }
      addLog(`✓ Alle ${referencedIds.length} referenzierten Story-/Destination-Dokumente gefunden.`);

      await client.createIfNotExists(storiesHubDoc as any);
      const {_id, _type, ...fields} = storiesHubDoc;
      await client.patch(STORIES_HUB_ID).set(fields).commit();
      addLog(`✓ ${STORIES_HUB_ID} angelegt/aktualisiert.`);

      const resolved = await client.fetch<{
        editionLabel?: string;
        lead?: {title?: string};
        secondary?: {title?: string}[];
        destinations?: {title?: string}[];
      }>(`*[_id == $id][0]{
        editionLabel,
        "lead": leadStory->{title},
        "secondary": secondaryStories[]->{title},
        "destinations": featuredDestinations[]->{title}
      }`, {id: STORIES_HUB_ID});

      setSummary({
        lead: resolved?.lead?.title,
        secondary: (resolved?.secondary || []).map(s => s.title || "—"),
        destinations: (resolved?.destinations || []).map(d => d.title || "—")
      });
      addLog(`✓ Fertig.`);
      setDone(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      addLog(`✕ ${message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{minHeight: "100%", background: "#f5f3ee", color: "#212322", padding: "48px 24px", fontFamily: "Inter, Arial, sans-serif"}}>
      <div style={{maxWidth: 860, margin: "0 auto"}}>
        <div style={{fontSize: 12, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 18}}>AROUND · STORIES HUB SEED</div>
        <h1 style={{fontSize: "clamp(36px,6vw,68px)", lineHeight: .96, letterSpacing: "-.05em", margin: "0 0 24px"}}>ISSUE 01.<br/>CURATED.</h1>
        <p style={{fontSize: 18, lineHeight: 1.5, maxWidth: 700, margin: "0 0 28px"}}>
          Legt genau ein Dokument an/aktualisiert es: <code>{STORIES_HUB_ID}</code>. Erstellt oder verändert keine Story
          und keine Destination - referenziert nur ihre bestehenden IDs.
        </p>

        <button
          onClick={runSeed}
          disabled={running}
          style={{border: 0, background: "#d6ea2a", color: "#212322", fontWeight: 900, letterSpacing: ".06em", textTransform: "uppercase", padding: "16px 22px", fontSize: 14, cursor: running ? "wait" : "pointer"}}
        >
          {running ? "AKTUALISIERT …" : done ? "NOCHMAL AKTUALISIEREN" : "STORIES HUB SEEDEN"}
        </button>

        {error && <div style={{marginTop: 20, padding: 16, background: "#f55096", fontWeight: 800}}>Fehler: {error}</div>}

        <div style={{marginTop: 28, background: "#212322", color: "#f5f3ee", padding: 20, minHeight: 120, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.7}}>
          {log.length ? log.map((line, i) => <div key={`${i}-${line}`}>{line}</div>) : <div style={{opacity: .65}}>Bereit. Noch nicht ausgeführt.</div>}
        </div>

        {summary && (
          <div style={{marginTop: 24, border: "1px solid #212322", padding: 20, display: "grid", gap: 14}}>
            <div>
              <strong>Lead</strong>
              <div>{summary.lead || "—"}</div>
            </div>
            <div>
              <strong>Secondary Stories</strong>
              <div>{summary.secondary.join(" · ") || "—"}</div>
            </div>
            <div>
              <strong>Featured Destinations</strong>
              <div>{summary.destinations.join(" · ") || "—"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
