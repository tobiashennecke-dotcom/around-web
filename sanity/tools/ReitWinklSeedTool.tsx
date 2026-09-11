"use client";

import {useState} from "react";
import {useClient} from "sanity";

const DESTINATION_ID = "around-destination-reit-im-winkl";

const PLACE_IDS = {
  unterwirt: "around-place-hotel-unterwirt",
  sonnenalm: "around-place-winklmoos-sonnenalm",
  schmiede: "around-place-grillhaus-alte-schmiede",
  sonneck: "around-place-hotel-restaurant-sonneck",
  seegatterl: "around-place-seegatterl-alm",
  winklmoos: "around-place-winklmoos-alm",
  nostalgiebahn: "around-place-duerrnbachhorn-nostalgie-sesselbahn",
  sternenpark: "around-place-sternenpark-platzl",
  taubensee: "around-place-taubensee-rundweg",
  triassic: "around-place-triassic-park-steinplatte",
} as const;

function ref(_ref:string, _key:string) { return {_type:"reference", _ref, _key}; }
function fact(_key:string, label:string, value:string) { return {_type:"fact", _key, label, value}; }

const places = [
  {
    _id: PLACE_IDS.unterwirt,
    _type: "place",
    title: "Hotel Unterwirt",
    slug: {_type:"slug", current:"hotel-unterwirt"},
    kicker: "STAY",
    summary: "Traditionshaus im Ortskern mit Spa, Restaurant und genau dem Basecamp-Gefühl, das einen Reit-im-Winkl-Trip unkompliziert macht.",
    placeType: "stay",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Wer mitten im Ort wohnen und trotzdem nicht auf Ruhe, Sauna und gutes Essen verzichten will, landet hier richtig. Der Unterwirt funktioniert als durchgehender Stay genauso gut wie als erste Station vor einem Wechsel auf die Winklmoos-Alm.",
    aroundTake: "Der klassische Basecamp-Case für AROUND: zentral, unkompliziert und vielseitig genug für Anreise, Dinner, Spa und einen spontanen Abend im Ort.",
    goodToKnow: [
      fact("u1","Lage","Direkt im Ortskern von Reit im Winkl"),
      fact("u2","Spa","Saunen, Dampfbäder und Anwendungen im Haus"),
      fact("u3","Trip-Logik","Sehr gut als ganzer Stay oder Split-Stay")
    ],
    address: "Kirchplatz 2, 83242 Reit im Winkl",
    website: "https://www.unterwirt.de/",
    featured: false, aroundSelected: false, priority: 74,
    seoTitle: "Hotel Unterwirt Reit im Winkl | AROUND",
    seoDescription: "Hotel Unterwirt in Reit im Winkl: zentraler STAY mit Spa und Restaurant – ein vielseitiges Basecamp für Golf- und Chiemgau-Trips."
  },
  {
    _id: PLACE_IDS.sonnenalm,
    _type: "place",
    title: "Winklmoos SonnenAlm",
    slug: {_type:"slug", current:"winklmoos-sonnenalm"},
    kicker: "STAY",
    summary: "Direkt oben auf der Alm: Suiten, Zimmer, Wellness und maximale Bergnähe – ein Stay, der selbst schon Teil der Reise ist.",
    placeType: "stay",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Die SonnenAlm ist der starke Kontrast zum Tal. Weniger Dorf, mehr Höhe. Weniger Durchgang, mehr Rückzug. Besonders spannend wird sie als zweite Station eines Split-Stays.",
    aroundTake: "Rauf auf die Alm und plötzlich verändert sich der ganze Trip. Genau dieser Szenenwechsel macht die SonnenAlm für AROUND interessanter als nur ein weiteres Hotel.",
    goodToKnow: [
      fact("s1","Lage","Direkt auf der Winklmoos-Alm"),
      fact("s2","Zimmer","Suiten und Doppelzimmer mit Bergbezug"),
      fact("s3","Trip-Logik","Ideal für 1–3 Nächte als zweite Stay-Station")
    ],
    address: "Klammweg 2, 83242 Reit im Winkl",
    website: "https://www.sonnenalm.de/",
    featured: false, aroundSelected: false, priority: 79,
    seoTitle: "Winklmoos SonnenAlm | AROUND",
    seoDescription: "STAY auf der Winklmoos-Alm: Suiten, Bergblick, Wellness und ein starker Split-Stay-Case oberhalb von Reit im Winkl."
  },
  {
    _id: PLACE_IDS.schmiede,
    _type: "place",
    title: "Grillhaus Alte Schmiede",
    slug: {_type:"slug", current:"grillhaus-alte-schmiede"},
    kicker: "EAT",
    summary: "Historisches Haus, klare Handschrift und regionaler Genuss mit modernem Dreh – für den Abend, der bewusst gesetzt werden soll.",
    placeType: "eat",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Die Alte Schmiede ist der Dinner-Case im Ort: charaktervolles Setting, hochwertige Grillküche und genug Eigenständigkeit, um als echter Fixpunkt im Trip zu funktionieren.",
    aroundTake: "Nicht bloß irgendwo essen. Hier macht die Reservierung Sinn – genau deshalb ist die Alte Schmiede ein guter EAT-Fixpunkt für den Planner.",
    goodToKnow: [
      fact("a1","Charakter","Historisches Gebäude im Ortskern"),
      fact("a2","Küche","Grill, regionale Produkte, internationaler Einschlag"),
      fact("a3","Planung","Am besten als Dinner-Fixpunkt mit Reservierungszeit")
    ],
    address: "Hausbergstraße 3, 83242 Reit im Winkl",
    website: "http://www.alteschmiede.de/",
    featured: false, aroundSelected: false, priority: 72,
    seoTitle: "Grillhaus Alte Schmiede | AROUND",
    seoDescription: "EAT in Reit im Winkl: Die Alte Schmiede verbindet historisches Ambiente, Grillküche und regionale Produkte zu einem starken Dinner-Fixpunkt."
  },
  {
    _id: PLACE_IDS.sonneck,
    _type: "place",
    title: "Hotel Restaurant Sonneck",
    slug: {_type:"slug", current:"hotel-restaurant-sonneck"},
    kicker: "EAT",
    summary: "Familiengeführt, regional gedacht und angenehm bodenständig – ein entspannter Gegenpol zum großen Dinner-Moment.",
    placeType: "eat",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Das Sonneck bringt eine wichtige andere Tonlage in den Trip: herzlich, saisonal, familienfreundlich und ohne unnötige Inszenierung. Genau solche Optionen machen Discovery glaubwürdig.",
    aroundTake: "Ein guter Allrounder für Lunch oder Dinner, wenn der Tag nicht nach Tasting-Menü, sondern nach unkomplizierter regionaler Küche verlangt.",
    goodToKnow: [
      fact("so1","Betrieb","Familiengeführt in dritter Generation"),
      fact("so2","Küche","Regional, saisonal und handwerklich"),
      fact("so3","Best for","Familien · Lunch · entspannter Abend")
    ],
    address: "Blindauer Straße 5, 83242 Reit im Winkl",
    website: "https://www.hotelsonneck.de/",
    featured: false, aroundSelected: false, priority: 67,
    seoTitle: "Hotel Restaurant Sonneck | AROUND",
    seoDescription: "Familiengeführtes EAT in Reit im Winkl: regional, saisonal und unkompliziert – ideal für Lunch, Familie oder einen entspannten Abend."
  },
  {
    _id: PLACE_IDS.seegatterl,
    _type: "place",
    title: "Seegatterl Alm",
    slug: {_type:"slug", current:"seegatterl-alm"},
    kicker: "EAT",
    summary: "Urig, großzügig und genau die richtige Adresse für den Alm-Moment – besonders dann, wenn der Tag draußen stattfindet.",
    placeType: "eat",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Die Seegatterl Alm ist bewusst kein Fine-Dining-Case. Sie gibt dem Trip eine andere Textur: Aktivität, Hütteneinkehr, regionale Küche und ein klarer Bezug zur Landschaft.",
    aroundTake: "Starker EAT-Stop für einen Outdoor-Tag. Wichtig dabei: Saison und Öffnung immer vorab prüfen – genau solche Realitäten sollte AROUND transparent zeigen.",
    goodToKnow: [
      fact("sg1","Typ","Berggasthof / Alm"),
      fact("sg2","Küche","Regional und vegetarische Optionen"),
      fact("sg3","Hinweis","Saisonale Öffnung vor dem Trip prüfen")
    ],
    address: "Seegatterl 4b, 83242 Reit im Winkl",
    website: "https://www.seegatterlalm.de/",
    featured: false, aroundSelected: false, priority: 64,
    seoTitle: "Seegatterl Alm | AROUND",
    seoDescription: "Alm-Einkehr in Reit im Winkl: regionale Küche, Outdoor-Bezug und ein rustikaler EAT-Stop rund um Seegatterl und Winklmoos."
  },
  {
    _id: PLACE_IDS.winklmoos,
    _type: "place",
    title: "Winklmoos-Alm",
    slug: {_type:"slug", current:"winklmoos-alm"},
    kicker: "DO",
    summary: "Die große Bühne für Alm, Berge, Wege, Aussicht und Weite – weniger einzelner Programmpunkt als Landschaftsgefühl.",
    placeType: "do",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Die Winklmoos-Alm kann halber Tag, ganzer Tag oder Ausgangspunkt für weitere Erlebnisse sein. Genau diese Offenheit macht sie als DO so stark.",
    aroundTake: "Ein flexibler Trip-Baustein mit echtem Sog: rauf, aussteigen, schauen – und von dort entscheiden, ob der Tag Richtung Wandern, Einkehr oder Sternenhimmel weitergeht.",
    goodToKnow: [
      fact("w1","Höhe","Almplateau auf rund 1.170 m"),
      fact("w2","Charakter","Wandern · Ski · Dark Sky · Hütten"),
      fact("w3","Planung","Halbtag, Ganztag oder Ausgangspunkt für weitere DOs")
    ],
    address: "Winklmoos-Alm, 83242 Reit im Winkl",
    website: "https://www.reitimwinkl.de/en/winklmoos-alm",
    featured: true, aroundSelected: false, priority: 82,
    seoTitle: "Winklmoos-Alm | AROUND",
    seoDescription: "DO rund um Reit im Winkl: Die Winklmoos-Alm verbindet Berglandschaft, Wandern, Hütten und Sternenhimmel zu einem flexiblen Trip-Baustein."
  },
  {
    _id: PLACE_IDS.nostalgiebahn,
    _type: "place",
    title: "Dürrnbachhorn Nostalgie-Sesselbahn",
    slug: {_type:"slug", current:"duerrnbachhorn-nostalgie-sesselbahn"},
    kicker: "DO",
    summary: "Langsam bergauf, mit Aussicht und echtem Nostalgie-Faktor – hier ist schon die Fahrt Teil des Erlebnisses.",
    placeType: "do",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Die historische Einer-Sesselbahn liefert etwas, das Reisepläne oft zu wenig haben: einen kleinen Moment, der nicht effizient sein will. Rund 20 Minuten Fahrt werden hier zur eigentlichen Qualität.",
    aroundTake: "Ein idealer DO-Fixpunkt mit Uhrzeit: Talstation, langsame Auffahrt, Panorama – und danach noch ein kurzer Weg Richtung Gipfel oder Wirtshaus.",
    goodToKnow: [
      fact("n1","Talstation","1.195 m"),
      fact("n2","Bergstation","1.610 m"),
      fact("n3","Fahrt","Rund 20 Minuten im Einer-Sessel")
    ],
    address: "Dürrnbachhornweg 16, 83242 Reit im Winkl",
    website: "https://www.nostalgiebahn.com/",
    featured: false, aroundSelected: false, priority: 78,
    seoTitle: "Dürrnbachhorn Nostalgiebahn | AROUND",
    seoDescription: "Historische Einer-Sesselbahn auf der Winklmoos-Alm: rund 20 Minuten Panorama-Fahrt bis 1.610 m – ein starker DO-Fixpunkt."
  },
  {
    _id: PLACE_IDS.sternenpark,
    _type: "place",
    title: "Sternenpark Platzl",
    slug: {_type:"slug", current:"sternenpark-platzl"},
    kicker: "DO",
    summary: "Der leise Abend-Case: Sterne, Sitzstufen und ein bisschen Weitblick – besonders stark, wenn der Tag eigentlich schon vorbei scheint.",
    placeType: "do",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Nicht jeder gute Programmpunkt muss laut oder lang sein. Das Sternenpark Platzl gibt dem Planner einen echten Abendbaustein und erweitert die Reise über Golf, Essen und Tageslicht hinaus.",
    aroundTake: "Ein poetischer DO für Dämmerung und Nacht. Genau die Art von Erlebnis, die man sonst vergisst einzuplanen – bis AROUND daran erinnert.",
    goodToKnow: [
      fact("sp1","Lage","Winklmoos-Alm bei der Nostalgiebahn"),
      fact("sp2","Dark Sky","Teil des 2018 zertifizierten Sternenparks"),
      fact("sp3","Planung","Am besten als Abend- oder Nacht-Slot")
    ],
    address: "Winklmoos-Alm, 83242 Reit im Winkl",
    website: "https://www.reitimwinkl.de/sternenpark-platzl",
    featured: false, aroundSelected: false, priority: 73,
    seoTitle: "Sternenpark Platzl | AROUND",
    seoDescription: "Abend-DO auf der Winklmoos-Alm: Sternenhimmel, Sitzstufen und Dark-Sky-Kontext – ein ruhiger Nachtbaustein für Reit-im-Winkl-Trips."
  },
  {
    _id: PLACE_IDS.taubensee,
    _type: "place",
    title: "Taubensee-Rundweg",
    slug: {_type:"slug", current:"taubensee-rundweg"},
    kicker: "DO",
    summary: "Der große Wander-Case mit See, Ausblicken und Grenzgefühl – kein Snack, sondern ein echter Tag draußen.",
    placeType: "do",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Der Taubensee ist wertvoll für AROUND, weil er zeigt, dass nicht jeder Programmpunkt in zwei Stunden passen muss. Manche Erlebnisse brauchen einen kompletten Tag.",
    aroundTake: "17 Kilometer, fast sieben Stunden und genug Landschaft, um den Rest des Tages gar nicht mehr verplanen zu wollen.",
    goodToKnow: [
      fact("t1","Distanz","17,1 km"),
      fact("t2","Dauer","ca. 6:45 Stunden"),
      fact("t3","Höhenmeter","ca. 849 m aufwärts")
    ],
    address: "Start: Festsaal / Reit im Winkl",
    website: "https://www.reitimwinkl.de/en/taubensee-rundweg-festsaal",
    featured: false, aroundSelected: false, priority: 69,
    seoTitle: "Taubensee-Rundweg | AROUND",
    seoDescription: "Ganztages-DO ab Reit im Winkl: 17,1 km zum Taubensee mit Panorama, Almwegen und rund 849 Höhenmetern."
  },
  {
    _id: PLACE_IDS.triassic,
    _type: "place",
    title: "Triassic Park Steinplatte",
    slug: {_type:"slug", current:"triassic-park-steinplatte"},
    kicker: "DO",
    summary: "Familienfreundlicher Bergausflug mit Panorama, Wasser und Dino-Faktor – eine starke Alternative zu Golf und klassischem Wandern.",
    placeType: "do",
    destination: ref(DESTINATION_ID,"dest"),
    whyWeLikeIt: "Familienreisen brauchen echte Alternativen. Der Triassic Park kombiniert Bergbahn, Aussicht, Indoor- und Outdoor-Erlebnis und funktioniert deshalb auch dann, wenn nicht alle im Trip dasselbe wollen.",
    aroundTake: "Ein guter Family-DO macht den Golftrip für alle besser. Genau deshalb gehört so etwas in AROUND – nicht als Beifang, sondern als eigenständiger Grund für den Tag.",
    goodToKnow: [
      fact("tr1","Ort","Steinplatte / Waidring in Tirol"),
      fact("tr2","Zugang","Per Gondel aus Waidring oder zu Fuß/Bike ab Winklmoos"),
      fact("tr3","Best for","Families · Half Day · Weather Flex")
    ],
    address: "Alpegg 10, A-6384 Waidring, Österreich",
    website: "https://www.triassicpark.at/",
    featured: false, aroundSelected: false, priority: 70,
    seoTitle: "Triassic Park Steinplatte | AROUND",
    seoDescription: "Familien-DO nahe Reit im Winkl: Bergpanorama, Wasser, Indoor- und Outdoor-Erlebnis am Triassic Park Steinplatte."
  }
];

export function ReitWinklSeedTool() {
  const client = useClient({apiVersion:"2026-03-01"}).withConfig({useCdn:false});
  const [running,setRunning] = useState(false);
  const [done,setDone] = useState(false);
  const [error,setError] = useState("");
  const [log,setLog] = useState<string[]>([]);
  const addLog = (line:string) => setLog(prev=>[...prev,line]);

  async function runSeed() {
    if (running) return;
    setRunning(true); setDone(false); setError(""); setLog([]);
    try {
      const destination = await client.fetch(`*[_id == $id][0]{_id,"placeRefs":places[]._ref}`, {id:DESTINATION_ID});
      if (!destination?._id) throw new Error("Destination Reit im Winkl wurde nicht gefunden. Bitte zuerst den Bayern Seed ausführen.");
      addLog("✓ Destination Reit im Winkl gefunden.");

      let tx = client.transaction();
      for (const doc of places) tx = tx.createOrReplace(doc as any);
      await tx.commit();
      addLog(`✓ ${places.length} Places erstellt/aktualisiert.`);

      const existingRefs:string[] = Array.isArray(destination.placeRefs) ? destination.placeRefs.filter(Boolean) : [];
      const newRefs = places.map(doc=>doc._id);
      const merged = Array.from(new Set([...existingRefs,...newRefs]));
      const relationObjects = merged.map((id,index)=>ref(id,`place-${index}-${id.replace(/[^a-z0-9-]/gi,"").slice(-28)}`));
      await client.patch(DESTINATION_ID).set({places:relationObjects}).commit();
      addLog(`✓ Reit im Winkl verknüpft jetzt ${merged.length} Places.`);
      addLog("ℹ Bilder bleiben bewusst leer und werden nach Rechte-/Motivauswahl im Studio ergänzt.");
      setDone(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message); addLog(`✕ ${message}`);
    } finally { setRunning(false); }
  }

  return (
    <div style={{minHeight:"100%",background:"#f5f3ee",color:"#212322",padding:"48px 24px",fontFamily:"Inter, Arial, sans-serif"}}>
      <div style={{maxWidth:980,margin:"0 auto"}}>
        <div style={{fontSize:12,fontWeight:800,letterSpacing:".16em",textTransform:"uppercase",marginBottom:18}}>AROUND · CONTENT SEED 02</div>
        <h1 style={{fontSize:"clamp(40px,7vw,82px)",lineHeight:.94,letterSpacing:"-.055em",margin:"0 0 24px"}}>REIT IM WINKL<br/>MEHR AUSWAHL.</h1>
        <p style={{fontSize:20,lineHeight:1.45,maxWidth:760,margin:"0 0 28px"}}>Zwei neue STAYs, drei EATs und fünf DOs für echte Search-, Split-Stay- und Trip-Planning-Cases. Texte, Links, SEO und Relations werden angelegt. Bilder bleiben bewusst rights-safe und werden anschließend im Studio ergänzt.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,margin:"0 0 26px"}}>
          {["2 × STAY","3 × EAT","5 × DO","10 Places"].map(x=><div key={x} style={{border:"1px solid #212322",padding:16,fontWeight:900}}>{x}</div>)}
        </div>
        <button onClick={runSeed} disabled={running} style={{border:0,background:"#d6ea2a",color:"#212322",fontWeight:900,letterSpacing:".08em",textTransform:"uppercase",padding:"15px 20px",cursor:running?"wait":"pointer"}}>{running?"IMPORT LÄUFT …":done?"NOCHMAL AKTUALISIEREN":"CONTENT SEED 02 IMPORTIEREN"}</button>
        {error && <div style={{marginTop:20,padding:16,background:"#f55096",fontWeight:800}}>Fehler: {error}</div>}
        <div style={{marginTop:28,background:"#212322",color:"#f5f3ee",padding:20,minHeight:150,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:12,lineHeight:1.7}}>{log.length?log.map((line,i)=><div key={`${i}-${line}`}>{line}</div>):<div style={{opacity:.65}}>Bereit. Noch nichts importiert.</div>}</div>
        {done && <div style={{marginTop:24,border:"1px solid #212322",padding:20}}><strong>Nächster Schritt:</strong><div style={{marginTop:8,lineHeight:1.6}}>Studio → Place → neuen Datensatz öffnen → Media → Hero/Gallery nach dem beiliegenden Bildbriefing ergänzen.</div></div>}
      </div>
    </div>
  );
}
