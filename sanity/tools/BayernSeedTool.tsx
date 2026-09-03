"use client";

import {useState} from "react";
import {useClient} from "sanity";

const IDS = {
  destination: "around.destination.reit-im-winkl",
  stay: "around.place.gut-steinbach",
  course: "around.place.golfclub-reit-im-winkl-koessen",
  eat: "around.place.restaurant-heimat",
  spa: "around.place.heimat-natur-spa",
  story: "around.story.heimatrefugium-zwei-laender-runde",
};

const assetSpecs: Record<string, [string, string, string]> = {
  destinationHero: ["destination-reit-im-winkl-hero.jpg", "Reit im Winkl und Chiemgauer Alpen im Abendlicht", "Tobias Hennecke"],
  stayAerial: ["gut-steinbach-aerial.jpg", "Gut Steinbach aus der Luft", "Tobias Hennecke"],
  stayChalets: ["gut-steinbach-chalets.webp", "Chaletdorf von Gut Steinbach am Naturweiher", "Tiberio Sorvillo"],
  spa: ["heimat-natur-spa.webp", "Indoorpool im Heimat & Natur SPA", "Luca Guadagnini"],
  eat: ["restaurant-heimat.jpg", "Gericht im Restaurant HEIMAT", "Tobias Hertle"],
  schnitzel: ["schnitzel.webp", "Wiener Schnitzel im Restaurant HEIMAT", "Tobias Hennecke"],
  courseHero: ["golfclub-reit-im-winkl-hero.webp", "Golfplatz Reit im Winkl-Kössen vor den Alpen", "Tobias Hennecke"],
  courseWide: ["golfclub-reit-im-winkl-wide.jpg", "Golfclub Reit im Winkl-Kössen aus der Luft", "Tobias Hennecke"],
  golfPerson: ["golf-reit-im-winkl-person.webp", "Golferin beim Abschlag vor der Bergkulisse", "Tobias Hennecke"],
  border: ["grenzuebergang-tee18.jpg", "Grenzschild am Weg zu Tee 18 zwischen Österreich und Deutschland", "Tobias Hennecke"],
  anton: ["golf-reit-im-winkl-anton.webp", "Kind beim Abschlag auf dem Golfplatz Reit im Winkl-Kössen", "Tobias Hennecke"],
};

function img(assetId:string, alt:string, credit:string, key:string, extra:Record<string, unknown> = {}) {
  return {_type:"image", _key:key, asset:{_type:"reference", _ref:assetId}, alt, credit, ...extra};
}
function ref(_ref:string, _key:string) { return {_type:"reference", _ref, _key}; }
function span(text:string, key="s") { return {_type:"span", _key:key, text, marks:[]}; }
function block(key:string, text:string, style="normal") {
  return {_type:"block", _key:key, style, markDefs:[], children:[span(text, `${key}-s`)]};
}
function fact(key:string, label:string, value:string) { return {_type:"fact", _key:key, label, value}; }

export function BayernSeedTool() {
  const client = useClient({apiVersion:"2026-03-01"}).withConfig({useCdn:false});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line:string) => setLog(prev => [...prev, line]);

  async function uploadOrReuse(filename:string) {
    const existing = await client.fetch(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]{_id,url}`, {filename});
    if (existing?._id) {
      addLog(`↺ Bild vorhanden: ${filename}`);
      return existing;
    }
    const response = await fetch(`/around-seed/bayern/${encodeURIComponent(filename)}`);
    if (!response.ok) throw new Error(`Bild konnte nicht geladen werden: ${filename}`);
    const blob = await response.blob();
    const asset = await client.assets.upload("image", blob, {filename});
    addLog(`↑ Bild hochgeladen: ${filename}`);
    return asset;
  }

  async function runSeed() {
    if (running) return;
    setRunning(true); setDone(false); setError(""); setLog([]);
    try {
      addLog("AROUND Bayern Seed gestartet …");
      const uploaded: Record<string, {id:string; url?:string; alt:string; credit:string}> = {};
      for (const [name, [filename, alt, credit]] of Object.entries(assetSpecs)) {
        const asset = await uploadOrReuse(filename);
        uploaded[name] = {id:asset._id, url:asset.url, alt, credit};
      }

      const destination = {
        _id: IDS.destination, _type:"destination", title:"Reit im Winkl",
        slug:{_type:"slug", current:"reit-im-winkl"}, kicker:"Bayern / Chiemgau",
        summary:"Zwischen Chiemgauer Alpen und Tirol liegt ein Ort, an dem Golf nicht das Ziel der Reise ist, sondern ihr Ausgangspunkt. Reit im Winkl verbindet alpine Landschaft, grenzüberschreitendes Golf und eine ziemlich gute Antwort auf die Frage, was nach der Runde kommt.",
        country:"Deutschland",
        whyGo:"Für eine Runde, die buchstäblich zwei Länder verbindet – und für alles, was danach wichtiger wird. Reit im Winkl funktioniert gerade deshalb als Golfdestination, weil es sich nicht wie eine anfühlt.",
        aroundTake:"Der Platz überschreitet Grenzen. Gut Steinbach zieht einen zurück in die Stille. Dazwischen liegen Berge, Essen, Natur und erstaunlich wenig Grund, ständig aufs Handy zu schauen.",
        bestFor:["Long Weekend","Couples","Families","Alpine Golf","Slow Travel"],
        heroImage:img(uploaded.destinationHero.id, uploaded.destinationHero.alt, uploaded.destinationHero.credit, "dest-hero"),
        gallery:[
          img(uploaded.stayAerial.id, uploaded.stayAerial.alt, uploaded.stayAerial.credit, "dest-gallery-1"),
          img(uploaded.courseWide.id, uploaded.courseWide.alt, uploaded.courseWide.credit, "dest-gallery-2"),
        ],
        places:[ref(IDS.course,"p-course"),ref(IDS.stay,"p-stay"),ref(IDS.eat,"p-eat"),ref(IDS.spa,"p-spa")],
        stories:[ref(IDS.story,"s-main")], featured:true, aroundSelected:false, priority:88,
        seoTitle:"Reit im Winkl – Golf, Stay & Alpen | AROUND",
        seoDescription:"Golf zwischen Bayern und Tirol, Gut Steinbach, regionale Küche und alpine Ruhe: AROUND entdeckt Reit im Winkl im Chiemgau.",
      };

      const stay = {
        _id:IDS.stay,_type:"place",title:"Gut Steinbach Hotel & Chalets",slug:{_type:"slug",current:"gut-steinbach"},kicker:"STAY",
        summary:"Kein Golfhotel. Zum Glück. Gut Steinbach ist ein alpines Refugium aus Holz, Landwirtschaft, Chalets, Spa und einer Haltung, die sich eher nach Rückzug als nach Resort anfühlt.",
        placeType:"stay",destination:ref(IDS.destination,"dest"),
        whyWeLikeIt:"Gut Steinbach macht Golf nicht zum Zentrum des Aufenthalts. Wer spielen will, spielt. Wer danach verschwinden möchte, kann das genauso gut. Genau dieser Kontrast macht das Haus für AROUND interessant.",
        aroundTake:"Das stärkste Feature steht in keinem klassischen Hotelvergleich: die Handy-Garage im Chalet. Telefon rein. Schlüssel umdrehen. Plötzlich ist Luxus nicht mehr die Ausstattung des Zimmers, sondern dass niemand etwas von einem will.",
        goodToKnow:[fact("stay-f1","Areal","51 Hektar"),fact("stay-f2","Chalets","7 rund um den Naturweiher"),fact("stay-f3","Best for","Disconnecting · Families · Nature · Spa")],
        website:"https://www.gutsteinbach.de/",
        heroImage:img(uploaded.stayChalets.id,uploaded.stayChalets.alt,uploaded.stayChalets.credit,"stay-hero"),
        gallery:[img(uploaded.stayAerial.id,uploaded.stayAerial.alt,uploaded.stayAerial.credit,"stay-gallery-1"),img(uploaded.spa.id,uploaded.spa.alt,uploaded.spa.credit,"stay-gallery-2")],
        featured:true,aroundSelected:true,priority:86,
        seoTitle:"Gut Steinbach Hotel & Chalets | AROUND",
        seoDescription:"Gut Steinbach in Reit im Winkl: Chalets, Natur, Spa und regionale Küche. Warum das Refugium für AROUND mehr als ein Golfhotel ist.",
      };

      const course = {
        _id:IDS.course,_type:"place",title:"Golfclub Reit im Winkl-Kössen",slug:{_type:"slug",current:"golfclub-reit-im-winkl-koessen"},kicker:"PLAY",
        summary:"Abschlag in Österreich. Zwölf Löcher in Bayern. Finale wieder in Tirol. Eine Runde Golf, die Europa ziemlich beiläufig erklärt.",
        placeType:"course",destination:ref(IDS.destination,"dest"),
        whyWeLikeIt:"Die ungewöhnlichste Eigenschaft dieses Platzes hat nichts mit Course Architecture zu tun: Die 18 Löcher verteilen sich auf Tirol und Bayern. Die Runde wird dadurch zur kleinen grenzüberschreitenden Reise.",
        aroundTake:"Das Grenzschild auf dem Weg durch die Runde ist vermutlich das interessanteste Course Feature weit und breit. Nicht weil es das Spiel schwieriger macht – sondern weil man plötzlich merkt, dass man während einer Golfrunde ein Land verlassen hat.",
        goodToKnow:[fact("course-f1","Löcher","18"),fact("course-f2","Grenzüberschreitend","6 Löcher Tirol · 12 Löcher Bayern"),fact("course-f3","Adresse","Moserbergweg 60 · 6345 Kössen")],
        address:"Moserbergweg 60, 6345 Kössen, Österreich",website:"https://www.gcreit.de/",
        heroImage:img(uploaded.courseHero.id,uploaded.courseHero.alt,uploaded.courseHero.credit,"course-hero"),
        gallery:[img(uploaded.courseWide.id,uploaded.courseWide.alt,uploaded.courseWide.credit,"course-gallery-1"),img(uploaded.golfPerson.id,uploaded.golfPerson.alt,uploaded.golfPerson.credit,"course-gallery-2"),img(uploaded.border.id,uploaded.border.alt,uploaded.border.credit,"course-gallery-3"),img(uploaded.anton.id,uploaded.anton.alt,uploaded.anton.credit,"course-gallery-4")],
        featured:true,aroundSelected:true,priority:85,
        seoTitle:"Golfclub Reit im Winkl-Kössen | AROUND",
        seoDescription:"18 Löcher zwischen Tirol und Bayern: AROUND über den grenzüberschreitenden Golfclub Reit im Winkl-Kössen und seine besondere Runde.",
      };

      const eat = {
        _id:IDS.eat,_type:"place",title:"Restaurant HEIMAT",slug:{_type:"slug",current:"restaurant-heimat-gut-steinbach"},kicker:"EAT",
        summary:"Heimatküche ohne Folklorepflicht. Im Restaurant HEIMAT beginnt die Idee nicht mit einem Stil, sondern mit einer Entfernung: möglichst nah.",
        placeType:"eat",destination:ref(IDS.destination,"dest"),
        whyWeLikeIt:"Nach 18 Löchern braucht nicht jeder einen Tasting-Marathon. Manchmal braucht man ein richtig gutes Wiener Schnitzel. Hier bekommt selbst das Bodenständige dieselbe Aufmerksamkeit wie das ambitioniertere Gericht daneben.",
        aroundTake:"80 Prozent der Zutaten aus maximal 80 Kilometern: Das klingt erst nach Konzept. Auf dem Teller fühlt es sich eher nach Konsequenz an.",
        goodToKnow:[fact("eat-f1","Prinzip","80:80 – 80 % der Zutaten aus max. 80 km"),fact("eat-f2","Don't miss","Wiener Schnitzel"),fact("eat-f3","Best for","After 18 · Regional Food · Dinner")],
        website:"https://www.gutsteinbach.de/kulinarik/restaurant-heimat/",
        heroImage:img(uploaded.eat.id,uploaded.eat.alt,uploaded.eat.credit,"eat-hero"),gallery:[img(uploaded.schnitzel.id,uploaded.schnitzel.alt,uploaded.schnitzel.credit,"eat-gallery-1")],
        featured:false,aroundSelected:false,priority:79,
        seoTitle:"Restaurant HEIMAT in Reit im Winkl | AROUND",
        seoDescription:"Regionale Küche auf Gut Steinbach: Restaurant HEIMAT, das 80:80-Prinzip und ein Wiener Schnitzel, das nach der Runde genau richtig kommt.",
      };

      const spa = {
        _id:IDS.spa,_type:"place",title:"Heimat & Natur SPA",slug:{_type:"slug",current:"heimat-und-natur-spa"},kicker:"DO",
        summary:"2.000 Quadratmeter Gegenprogramm zur Scorekarte: Pool, Saunen, Ruhe und ein ziemlich guter Grund, den zweiten Teil des Tages nicht mit Golf zu verbringen.",
        placeType:"do",destination:ref(IDS.destination,"dest"),
        whyWeLikeIt:"Der beste zweite Teil eines Golftages muss nichts mit Golf zu tun haben. Genau deshalb behandeln wir den Spa als eigenes Erlebnis im Trip – und nicht als kleines Hotel-Ausstattungsicon.",
        aroundTake:"PLAY am Vormittag. DO am Nachmittag. Genau so soll AROUND funktionieren: Golf als Ausgangspunkt, nicht als Grenze der Reise.",
        goodToKnow:[fact("spa-f1","Fläche","2.000 m²"),fact("spa-f2","Pool","16 Meter Indoorpool"),fact("spa-f3","Auch möglich","Day SPA mit Reservierung")],
        website:"https://www.gutsteinbach.de/wellness-spa/spa/",
        heroImage:img(uploaded.spa.id,uploaded.spa.alt,uploaded.spa.credit,"spa-hero"),featured:false,aroundSelected:false,priority:77,
        seoTitle:"Heimat & Natur SPA | AROUND",seoDescription:"After Golf in Reit im Winkl: der Heimat & Natur SPA auf Gut Steinbach mit 2.000 m², Indoorpool und Day-Spa-Option.",
      };

      const storyBody = [
        block("b01","Es gibt einen Moment auf dem Weg nach Gut Steinbach, da lässt man mehr zurück als nur die Autobahn. Es ist der Moment, in dem die Straße schmaler wird, sich enger an die Hänge des Chiemgaus schmiegt und das ewige Rauschen des Verkehrs einem leisen Summen weicht. Dem Summen von Bienen auf den Bergwiesen, dem fernen Läuten einer Kuhglocke, dem Wind in den Baumwipfeln. Man fährt nicht einfach nur in ein Hotel, man fährt als Familie in einen anderen Aggregatzustand."),
        img(uploaded.destinationHero.id,uploaded.destinationHero.alt,uploaded.destinationHero.credit,"story-img-1",{layout:"wide"}),
        block("h01","Ankommen und Abschalten","h2"),
        block("b02","Die Ankunft selbst ist eine Meisterleistung der Entschleunigung. Kein Portier, der einem hektisch die Wagentür aufreißt. Stattdessen: der Duft von Zirbenholz und ein Blick, der sofort an den umliegenden Gipfeln hängenbleibt. Für unseren Sohn war die größte Attraktion jedoch sofort klar: die Tiere. Yaks, Rotwild und Ziegen, die hier wie selbstverständlich zum Gut gehören und die Philosophie der hauseigenen, biolandzertifizierten Landwirtschaft lebendig machen."),
        block("b03","In unserem Chalet, einem Refugium aus Holz und Wärme, wartete dann die eigentliche Mutprobe des modernen Menschen. Ein kleiner, unscheinbarer Safe aus Holz: die „Handy-Garage“. Wir trafen eine gemeinsame Entscheidung. Die Telefone wurden in ihre Garage gelegt, der Schlüssel umgedreht. Ein kleiner Dreh mit großer Wirkung für uns als Familie."),
        img(uploaded.stayChalets.id,uploaded.stayChalets.alt,uploaded.stayChalets.credit,"story-img-2",{layout:"wide"}),
        block("h02","Eine Runde Europa als Familie","h2"),
        block("b04","Am nächsten Morgen. Die Luft ist klar, die Handy-Garage verschlossen. Fast. Ein Telefon muss als Kamera für die Reise herhalten. Ein notwendiges Übel auf dem Weg zu einem Platz, der es verdient, in Bildern festgehalten zu werden: der Golfclub Reit im Winkl-Kössen."),
        block("b05","Manchmal muss man erst die Grenze überqueren, um richtig anzukommen. Wir fahren als Familie ein paar Minuten über eine kleine Landstraße und parken in Österreich. Das Clubhaus liegt am Fuße des Peternhof in Tirol. Wir trinken unseren Kaffee mit Blick auf das 18. Grün und betreten das erste Tee – ebenfalls in Österreich. Die ersten fünf Löcher sind eine Art Ouvertüre auf Tiroler Boden, die wir zu dritt in Angriff nehmen. Dann, nach dem fünften Grün, passiert es."),
        img(uploaded.golfPerson.id,uploaded.golfPerson.alt,uploaded.golfPerson.credit,"story-img-3",{layout:"full"}),
        block("b06","Wir folgen dem Weg zum nächsten Abschlag und überschreiten dabei eine Grenze, die man nur bemerkt, wenn man darauf achtet. Plötzlich stehen wir in Deutschland."),
        img(uploaded.border.id,uploaded.border.alt,uploaded.border.credit,"story-img-4",{layout:"article",caption:"Eine Runde, zwei Länder: der Weg zu Tee 18."}),
        block("b07","Die nächsten zwölf Löcher sind ein Ausflug nach Bayern. Es ist eine beiläufige Selbstverständlichkeit, die in Zeiten, in denen Grenzen wieder zu Mauern werden, fast schon politisch anmutet. Hier, zwischen Fairway und Rough, existiert Europa noch in seiner ursprünglichsten Form. Man sorgt sich nicht um seinen Pass, sondern um seinen Putt. Für das große Finale, die Bahn 18, kehren wir dann wieder nach Österreich zurück. Eine kleine, sportliche Europareise als Familie."),
        img(uploaded.anton.id,uploaded.anton.alt,uploaded.anton.credit,"story-img-5",{layout:"wide"}),
        block("h03","Belohnung für Körper und Gaumen","h2"),
        block("b08","Nach der Runde ist die Rückkehr ins Gut Steinbach wie das Ankommen in einem anderen Hafen. Besonders für meine Frau ist es genau dieser Kontrast, der den Ort perfekt macht. Sie liebt das Golfspiel, aber sie schätzt es umso mehr, dass sich hier nicht alles nur um das nächste Handicap dreht. Während unser Sohn den Indoor-Pool erobert, genießen wir gemeinsam die wohlige Stille im Heimat & Natur SPA. Es ist kein klassisches Golfhotel."),
        block("b09","Es ist ein Refugium, das die Leidenschaft für den Sport teilt, aber auch versteht, dass Erholung mehr bedeutet."),
        img(uploaded.spa.id,uploaded.spa.alt,uploaded.spa.credit,"story-img-6",{layout:"wide"}),
        block("b10","Der wahre Höhepunkt des Tages wartet im Restaurant. An diesem Abend gibt es für uns das Wiener Schnitzel. Es kommt an den Tisch und ist eine Offenbarung. Ein dünnes, zartes Stück Kalbfleisch, umhüllt von einer Panade, die in Wellen souffliert ist. Perfektes Handwerk. Dazu ein Glas Wein, empfohlen von einem Service, der zu verstehen scheint, was man nach einem langen Tag auf dem Platz braucht."),
        img(uploaded.eat.id,uploaded.eat.alt,uploaded.eat.credit,"story-img-7",{layout:"wide"}),
        img(uploaded.schnitzel.id,uploaded.schnitzel.alt,uploaded.schnitzel.credit,"story-img-8",{layout:"article"}),
        block("h04","Was am Ende bleibt","h2"),
        block("b11","Später am Abend, zurück im Chalet, der Sonnenuntergang hinter den Bergen ist mal wieder ein Spektakel und für uns ein perfekter Abschluss. Die Reise war eine Lektion in Kontrasten. Zwischen zwei Ländern auf einer Golfrunde. Zwischen der Anforderung auf dem Platz und der Ruhe im Spa. Zwischen der Ehrlichkeit eines perfekten Schnitzels und der Finesse einer exzellenten Weinbegleitung. Gut Steinbach ist kein klassisches Golfhotel. Und das ist das Beste, was man über diesen Ort sagen kann."),
        block("b12","Es ist ein Ort, der seine Grundwerte – Heimat, Ruhe und Boden – in jedem Detail erlebbar macht. Man kommt für den Sport, aber man bleibt für die Stille. Und man nimmt den leisen Vorsatz mit, die Handy-Garage im Kopf vielleicht öfter mal abzuschließen."),
      ];

      const story = {
        _id:IDS.story,_type:"story",title:"Das Heimatrefugium und die Zwei-Länder-Runde",slug:{_type:"slug",current:"heimatrefugium-zwei-laender-runde"},format:"worth-the-trip",kicker:"Bayern / Reit im Winkl",
        deck:"Ein Golfplatz zwischen Deutschland und Österreich. Ein Chalet mit Handy-Garage. Ein perfektes Schnitzel. Und die Erkenntnis, dass die beste Golfreise manchmal dort beginnt, wo Golf aufhört.",readingTime:6,
        heroImage:img(uploaded.golfPerson.id,uploaded.golfPerson.alt,uploaded.golfPerson.credit,"story-hero"),body:storyBody,
        related:[ref(IDS.destination,"r-dest"),ref(IDS.stay,"r-stay"),ref(IDS.course,"r-course"),ref(IDS.eat,"r-eat"),ref(IDS.spa,"r-spa")],
        featured:true,aroundSelected:false,priority:92,
        seoTitle:"Heimatrefugium & Zwei-Länder-Runde | AROUND",
        seoDescription:"Reit im Winkl, Gut Steinbach und Golf über zwei Länder: eine Familienreise zwischen Platz, Spa, Schnitzel und Chiemgauer Ruhe.",
      };

      const docs = [destination, stay, course, eat, spa, story];
      let tx = client.transaction();
      docs.forEach(doc => { tx = tx.createOrReplace(doc); });
      await tx.commit();
      addLog("✓ 6 Dokumente erstellt/aktualisiert.");
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
    <div style={{minHeight:"100%",background:"#f5f3ee",color:"#212322",padding:"48px 24px",fontFamily:"Inter, Arial, sans-serif"}}>
      <div style={{maxWidth:920,margin:"0 auto"}}>
        <div style={{fontSize:12,fontWeight:800,letterSpacing:".16em",textTransform:"uppercase",marginBottom:18}}>AROUND · CONTENT SEED</div>
        <h1 style={{fontSize:"clamp(40px,7vw,82px)",lineHeight:.94,letterSpacing:"-.055em",margin:"0 0 24px",maxWidth:800}}>BAYERN<br/>CONTENT WORLD.</h1>
        <p style={{fontFamily:"Georgia, serif",fontSize:23,lineHeight:1.35,maxWidth:720,margin:"0 0 32px"}}>Ein Klick lädt die 11 Bilder hoch und erstellt Reit im Winkl, Gut Steinbach, Golfclub, Restaurant HEIMAT, Heimat & Natur SPA und die WORTH THE TRIP Story direkt im aktuellen Sanity-Dataset.</p>
        <div style={{borderTop:"1px solid #212322",borderBottom:"1px solid #212322",padding:"20px 0",display:"flex",gap:18,alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={runSeed} disabled={running} style={{border:0,background:"#d6ea2a",color:"#212322",fontWeight:900,letterSpacing:".08em",textTransform:"uppercase",padding:"15px 20px",cursor:running?"wait":"pointer"}}>
            {running ? "IMPORT LÄUFT …" : done ? "NOCHMAL IMPORTIEREN" : "BAYERN IMPORTIEREN"}
          </button>
          <span style={{fontSize:13,fontWeight:700}}>{done ? "✓ Fertig – Inhalte sind in Sanity." : "Idempotent: ein zweiter Klick aktualisiert statt zu duplizieren."}</span>
        </div>
        {error && <div style={{marginTop:20,padding:16,background:"#f55096",fontWeight:800}}>Fehler: {error}</div>}
        <div style={{marginTop:28,background:"#212322",color:"#f5f3ee",padding:20,minHeight:150,fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",fontSize:12,lineHeight:1.7}}>
          {log.length ? log.map((line,i)=><div key={`${i}-${line}`}>{line}</div>) : <div style={{opacity:.65}}>Bereit. Noch nichts importiert.</div>}
        </div>
        {done && <div style={{marginTop:28,padding:24,border:"1px solid #212322"}}>
          <strong>Jetzt prüfen:</strong>
          <div style={{marginTop:10,lineHeight:1.8}}>/destinations/reit-im-winkl<br/>/places/gut-steinbach<br/>/places/golfclub-reit-im-winkl-koessen<br/>/places/restaurant-heimat-gut-steinbach<br/>/places/heimat-und-natur-spa<br/>/stories/heimatrefugium-zwei-laender-runde</div>
        </div>}
      </div>
    </div>
  );
}
