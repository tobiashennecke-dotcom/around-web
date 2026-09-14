"use client";

import {useState} from "react";
import {useClient} from "sanity";

/**
 * AROUND — Editorial Pilot Pack v0.1
 *
 * Creates/updates six real editorial pilot Stories plus the minimal
 * Destination/Place reference objects needed to exercise the Story Graph
 * (story.related[] canonical edges, direct + transitive reverse lookups).
 *
 * Content + graph test data only — no images are written by this tool.
 * See docs/editorial-pilot-pack/README.md for sourcing, image-rights status
 * and how to add approved imagery later via Studio.
 *
 * Safety model:
 * - createIfNotExists() so a second run never duplicates documents.
 * - .patch(id).set(...) keeps title/copy/relations in sync on every run,
 *   but the patch NEVER includes heroImage/gallery/socialImage - those are
 *   simply never touched, so any image a human adds later in Studio is safe
 *   forever, on every future reseed.
 * - Story `body` uses .setIfMissing() only: written on first run, then left
 *   alone - so a human can enrich the body with real editorial images later
 *   without a reseed wiping them out.
 */

const DEST = {
  somaBay: "around-destination-soma-bay",
  soell: "around-destination-soell-wilder-kaiser",
  silverCoast: "around-destination-portugal-silver-coast",
  tallinn: "around-destination-tallinn",
  parnu: "around-destination-parnu"
} as const;

const PLACE = {
  somabayGolf: "around-place-somabay-golf-gary-player-course",
  cascades: "around-place-the-cascades",
  postwirt: "around-place-der-postwirt",
  westCliffs: "around-place-west-cliffs-golf-course",
  parnuBayGolf: "around-place-parnu-bay-golf-links"
} as const;

const STORY = {
  somaBayWorthTheTrip: "around-story-soma-bay-worth-the-trip",
  somaBayAfter18: "around-story-soma-bay-after-18",
  postwirtSoell: "around-story-postwirt-soell",
  westCliffsCourseCorrection: "around-story-west-cliffs-course-correction",
  estonia48Hours: "around-story-estonia-48-hours",
  manifest: "around-story-manifest-golf-is-where-it-starts"
} as const;

let keySeq = 0;
function nextKey(prefix: string) {
  keySeq += 1;
  return `${prefix}${keySeq}`;
}

function ref(_ref: string) {
  return {_type: "reference", _ref, _key: nextKey("r")};
}

function span(text: string) {
  return {_type: "span", _key: nextKey("s"), text, marks: []};
}

function block(text: string, style: "normal" | "h2" | "h3" | "pullQuote" = "normal") {
  return {_type: "block", _key: nextKey("b"), style, markDefs: [], children: [span(text)]};
}

function slugOf(current: string) {
  return {_type: "slug", current};
}

function fact(label: string, value: string) {
  return {_type: "fact", _key: nextKey("f"), label, value};
}

function geo(lat: number, lng: number) {
  return {_type: "geopoint", lat, lng};
}

// ============================================================
// DESTINATIONS — minimal graph/reference objects
// ============================================================

const destinations = [
  {
    _id: DEST.somaBay,
    _type: "destination",
    title: "Soma Bay",
    slug: slugOf("soma-bay"),
    kicker: "EGYPT / RED SEA",
    summary: "Eine Halbinsel am Roten Meer, auf der Wüste, Golf, Tauchen und Kitesurfen aufeinandertreffen.",
    country: "Egypt",
    coordinates: geo(26.8456, 33.9711),
    whyGo: "Weil hier Wüste und Rotes Meer auf einer einzigen Halbinsel aufeinandertreffen – und Golf nur einer von mehreren guten Gründen ist, zu bleiben.",
    aroundTake: "Eine Destination, die nicht nur einen Golfplatz anbietet, sondern eine ganze Halbinsel aus Kontrasten: Wüste, Meer, Tauchen, Wind und Ruhe in unmittelbarer Nähe zueinander.",
    bestFor: ["Golf & Meer", "Tauchen", "Kitesurfen"],
    featured: false,
    aroundSelected: false,
    priority: 55
  },
  {
    _id: DEST.soell,
    _type: "destination",
    title: "Söll / Wilder Kaiser",
    slug: slugOf("soell-wilder-kaiser"),
    kicker: "TIROL / AUSTRIA",
    summary: "Ein Dorf vor der Kulisse des Wilder Kaiser – schroffe Gipfel auf der einen, sanfte Almwiesen auf der anderen Seite.",
    country: "Austria",
    coordinates: geo(47.50361, 12.19194),
    whyGo: "Weil ein Dorf vor der Kulisse des Wilder Kaiser mehr zu bieten hat als Après-Ski – schroffe Gipfel auf der einen, sanfte Almwiesen auf der anderen Seite desselben Gebirgszugs.",
    aroundTake: "Ein Basecamp muss nicht abgelegen sein, um zu funktionieren. Söll zeigt, dass die Mitte eines echten Dorfes oft der bessere Ausgangspunkt ist.",
    bestFor: ["Alpine Basecamps", "Familie", "Wandern"],
    featured: false,
    aroundSelected: false,
    priority: 55
  },
  {
    _id: DEST.silverCoast,
    _type: "destination",
    title: "Portugal Silver Coast",
    slug: slugOf("portugal-silver-coast"),
    kicker: "PORTUGAL / COSTA DE PRATA",
    summary: "Atlantikküste nördlich von Lissabon, geprägt von Dünen, Kiefernwäldern und Linksgolf.",
    country: "Portugal",
    coordinates: geo(39.35806, -9.15778),
    whyGo: "Weil an dieser Atlantikküste nördlich von Lissabon Golfarchitektur entstanden ist, die sich der Landschaft unterordnet statt sie zu dominieren.",
    aroundTake: "Dünen, Kiefern und Atlantik – eine Küste, an der Zurückhaltung im Design zum eigentlichen Argument geworden ist.",
    bestFor: ["Links Golf", "Atlantik", "Golfarchitektur"],
    featured: false,
    aroundSelected: false,
    priority: 55
  },
  {
    _id: DEST.tallinn,
    _type: "destination",
    title: "Tallinn",
    slug: slugOf("tallinn"),
    kicker: "ESTONIA",
    summary: "Mittelalterliche Altstadt an der Ostsee – UNESCO-Welterbe und Ausgangspunkt Richtung Pärnu.",
    country: "Estonia",
    coordinates: geo(59.4370, 24.7536),
    whyGo: "Weil eine der am besten erhaltenen mittelalterlichen Altstädte Nordeuropas der ungewöhnlichste Ausgangspunkt für eine Golfreise im Baltikum ist.",
    aroundTake: "Eine Stadt, die zeigt, dass eine Golfreise nicht am Flughafen beginnen muss, sondern in einer Altstadt, die seit 1997 UNESCO-Welterbe ist.",
    bestFor: ["City & Golf", "Kultur", "Roadtrip"],
    featured: false,
    aroundSelected: false,
    priority: 50
  },
  {
    _id: DEST.parnu,
    _type: "destination",
    title: "Pärnu",
    slug: slugOf("parnu"),
    kicker: "ESTONIA",
    summary: "Estlands Sommerhauptstadt: Bäderkultur seit 1838, Sandstrand und Linksgolf vor der Küste.",
    country: "Estonia",
    coordinates: geo(58.3859, 24.4971),
    whyGo: "Weil Estlands Sommerhauptstadt eine fast 200 Jahre alte Bäderkultur mit Sandstrand und einem echten Linkskurs vor der Küste verbindet.",
    aroundTake: "Der Ort, an dem sich ein Golftrip vom reinen Programm in echten Urlaub verwandelt.",
    bestFor: ["Links Golf", "Spa", "Roadtrip"],
    featured: false,
    aroundSelected: false,
    priority: 50
  }
];

// ============================================================
// PLACES — minimal graph/reference objects (no utility facts invented)
// ============================================================

const places = [
  {
    _id: PLACE.somabayGolf,
    _type: "place",
    title: "Somabay Golf – Gary Player Championship Course",
    slug: slugOf("somabay-golf-gary-player-course"),
    kicker: "PLAY",
    summary: "18 Bahnen von Gary Player auf der Halbinsel Soma Bay, sechs davon direkt an der Küste des Roten Meeres.",
    placeType: "course",
    destination: ref(DEST.somaBay),
    address: "Soma Bay, Red Sea Governorate, Egypt",
    website: "https://somabaygolf.com/",
    whyWeLikeIt: "Sechs Bahnen verlaufen direkt an der Küste des Roten Meeres, der Rest schneidet sich durch Wüstenterrain vor einer Bergkulisse. Kaum ein Platz wechselt seinen Charakter von Bahn zu Bahn so deutlich.",
    aroundTake: "Golf als Bühne für einen Landschaftskontrast, den man sonst nirgends auf derselben Runde bekommt – Wüste und Meer, ohne dass eines das andere dominiert.",
    holes: 18,
    par: 72,
    courseCharacter: "Wüste trifft Rotes Meer",
    season: "Ganzjährig bespielbar",
    // Coordinates intentionally omitted: no confidently precise, course-specific
    // pin found distinct from the general Soma Bay area - see README.
    featured: false,
    aroundSelected: false,
    priority: 55
  },
  {
    _id: PLACE.cascades,
    _type: "place",
    title: "The Cascades",
    slug: slugOf("the-cascades"),
    kicker: "STAY",
    summary: "Hotel am höchsten Punkt der Soma-Bay-Halbinsel, mit direktem Blick auf den hauseigenen Golfplatz und das Rote Meer.",
    placeType: "stay",
    destination: ref(DEST.somaBay),
    website: "https://thecascadeshotel.com/",
    whyWeLikeIt: "The Cascades liegt am höchsten Punkt der Soma-Bay-Halbinsel, mit direktem Blick auf den hauseigenen Golfplatz und das Rote Meer dahinter – ein Haus, das seine Lage konsequent nutzt.",
    aroundTake: "Ein Hotel, das seinen eigenen Golfplatz nicht nur anbietet, sondern von der besten Position der Halbinsel aus zeigt.",
    stayCharacter: "Golf Resort & Spa",
    goodToKnow: [
      fact("Zimmer", "166 Zimmer"),
      fact("Lage", "Höchster Punkt der Soma-Bay-Halbinsel"),
      fact("Golf", "Direkter Zugang zum Gary Player Championship Course")
    ],
    // Coordinates intentionally omitted - see note on Somabay Golf above.
    featured: false,
    aroundSelected: false,
    priority: 50
  },
  {
    _id: PLACE.postwirt,
    _type: "place",
    title: "Der Postwirt",
    slug: slugOf("der-postwirt"),
    kicker: "STAY",
    summary: "Hotel der Familie Bliem mitten im Ortskern von Söll, urkundlich erstmals 1281 erwähnt.",
    placeType: "stay",
    destination: ref(DEST.soell),
    address: "Dorf 82, 6306 Söll, Austria",
    website: "https://www.derpostwirt.at/",
    whyWeLikeIt: "Der Postwirt liegt nicht am Ortsrand, sondern mitten in Söll – ein Haus, das seit 1281 dokumentiert ist und heute als modernes Wellnesshotel geführt wird, ohne seine Geschichte zu verstecken.",
    aroundTake: "Der Beweis, dass ein gutes Basecamp nicht abgelegen sein muss: mitten im Dorf, mit direktem Zugang zu echtem Alltag statt einer isolierten Anlage.",
    stayCharacter: "Traditionshaus im Ortskern",
    goodToKnow: [
      fact("Geschichte", "Urkundlich erstmals 1281 erwähnt"),
      fact("Familie", "Geführt von Familie Bliem"),
      fact("Spa", "Adults-only Panorama-Spa mit Infinity Sunset Pool")
    ],
    // Coordinates intentionally omitted: no confidently precise pin found for
    // this address beyond the village-level location - see README.
    featured: false,
    aroundSelected: false,
    priority: 55
  },
  {
    _id: PLACE.westCliffs,
    _type: "place",
    title: "West Cliffs Golf Course",
    slug: slugOf("west-cliffs-golf-course"),
    kicker: "PLAY",
    summary: "18-Loch-Linkskurs von Cynthia Dye an Portugals Silberküste, gebaut in bewusster Zurückhaltung gegenüber den vorhandenen Dünen.",
    placeType: "course",
    destination: ref(DEST.silverCoast),
    address: "Estrada do Rio Cortiço, Vau, 2510 Óbidos, Portugal",
    website: "https://westcliffs.com/en/west-cliffs-golf-course/",
    whyWeLikeIt: "West Cliffs verändert kaum das vorgefundene Gelände: Dünen, Küstenvegetation und Kiefern blieben erhalten, statt einer Landschaft eine fremde Form aufzuzwingen.",
    aroundTake: "Ein Platz, der aussieht, als hätte es ihn schon immer gegeben – und genau deshalb zu den bemerkenswertesten Neubauten der letzten Jahre in Europa zählt.",
    holes: 18,
    par: 72,
    courseCharacter: "Dünen-Links am Atlantik",
    coordinates: geo(39.41708, -9.24097),
    featured: false,
    aroundSelected: false,
    priority: 55
  },
  {
    _id: PLACE.parnuBayGolf,
    _type: "place",
    title: "Pärnu Bay Golf Links",
    slug: slugOf("parnu-bay-golf-links"),
    kicker: "PLAY",
    summary: "Der erste Linkskurs des Baltikums, in Reiu bei Pärnu, mehrfach zu Estlands bestem Golfplatz gewählt.",
    placeType: "course",
    destination: ref(DEST.parnu),
    address: "Klubi tee 1, Reiu, Häädemeeste vald, Pärnu County, Estonia",
    website: "https://parnubay.com/",
    whyWeLikeIt: "Der erste echte Linkskurs der baltischen Staaten, entworfen von Lassi Pekka Tilander mit Mick McShane als leitendem Shaper – direkt an der Bucht von Pärnu, ergänzt um fünf zusätzliche Par-3-Bahnen.",
    aroundTake: "Ein Linkskurs, der in seiner eigenen Region ohne Vergleich ist – und genau deshalb Estland zu einer echten golferischen Entdeckung macht.",
    holes: 18,
    par: 72,
    courseCharacter: "Erster Linkskurs des Baltikums",
    season: "April–Oktober (Winter nur nach Vereinbarung)",
    coordinates: geo(58.331308, 24.582076),
    featured: false,
    aroundSelected: false,
    priority: 55
  }
];

// ============================================================
// STORIES — six real editorial pilot pieces
// ============================================================

const storySomaBayWorthTheTrip = {
  _id: STORY.somaBayWorthTheTrip,
  _type: "story",
  title: "ZWISCHEN WÜSTE UND ROTEM MEER.",
  slug: slugOf("zwischen-wueste-und-rotem-meer"),
  format: "worth-the-trip",
  kicker: "EGYPT / RED SEA",
  deck: "Ein Golfplatz zwischen Wüste und Meer – und warum Soma Bay als Destination mehr kann als eine einzelne Runde.",
  publishedAt: "2026-09-04T08:00:00.000Z",
  readingTime: 4,
  featured: false,
  aroundSelected: false,
  priority: 62,
  related: [ref(DEST.somaBay), ref(PLACE.somabayGolf), ref(PLACE.cascades)],
  seoTitle: "Soma Bay: Golf zwischen Wüste und Rotem Meer | AROUND",
  seoDescription: "Warum Soma Bay als Golfdestination funktioniert, weil Wüste, Rotes Meer und Golf auf einer Halbinsel aufeinandertreffen.",
  body: [
    block("Auf der einen Seite Wüste, ockerfarben und trocken bis zum Horizont. Auf der anderen Seite das Rote Meer, in einem Türkis, das auf Fotos übertrieben wirkt und in echt nicht übertrieben genug beschrieben werden kann. Dazwischen: ein Golfplatz, der genau diesen Kontrast zu seinem Grundprinzip macht. Soma Bay ist keine Golfdestination mit Meerblick. Es ist eine Landzunge, auf der zwei völlig unterschiedliche Landschaften aufeinandertreffen – und Golf ist der Grund, warum man anfängt, genauer hinzuschauen."),
    block("EIN PLATZ VON GARY PLAYER, SECHS BAHNEN AM MEER", "h2"),
    block("Der Gary Player Championship Course liegt auf einer Halbinsel rund 45 Kilometer südlich des Flughafens Hurghada. 18 Bahnen, Par 72, entworfen von Gary Player – und mit sechs Löchern, die direkt an der Küste des Roten Meeres verlaufen. Der Platz schlängelt sich durch Wüstenterrain, vorbei an Bergkulissen im Hintergrund und immer wieder mit direktem Blick auf das Wasser. Auf der eigenen Website wird der Platz gern mit Pebble Beach verglichen – ein großer Vergleich, aber einer, der zumindest die Idee richtig trifft: Golf als Bühne für Landschaft, nicht als Ablenkung von ihr."),
    block("Die eigentliche Wirkung entsteht im Wechsel: Auf einer Bahn schneidet das Fairway durch beigefarbenen Wüstensand, auf der nächsten öffnet sich der Blick auf tiefblaues Wasser. Kaum ein Golfplatz verändert seinen optischen Charakter innerhalb weniger Minuten so stark wie dieser – und genau dieser Kontrast ist es, der aus einer Runde mehr macht als eine sportliche Übung."),
    block("Neben dem Championship Course gehört ein separates Par-3-Angebot zur Anlage, gedacht für das kurze Spiel. Wer übt, tut das auf einer 300 Meter langen, beleuchteten Doppel-Driving-Range und in einer rund 5.000 Quadratmeter großen Short-Game-Arena, gestaltet vom britischen Büro EDI Golf. Dazu kommt Hidden Coves, ein neuer 18-Loch-Championship-Platz von Lobb & Partners: Die ersten neun Bahnen sind seit November 2025 spielbar, die vollen 18 Löcher sollen Ende 2026 oder Anfang 2027 folgen. Der Anspruch dahinter ist erklärtermaßen kein zusätzlicher schwieriger Meisterschaftsplatz, sondern ein besonders zugänglicher – die Anlage folgt bewusst dem vorhandenen Gelände, statt es sich zu unterwerfen. Das ist relevant für die Frage, warum Soma Bay einen mehrtägigen Aufenthalt rechtfertigt: Hier wächst gerade etwas, statt zu stagnieren."),
    block("THE CASCADES, GANZ OBEN AUF DER HALBINSEL", "h2"),
    block("The Cascades liegt am höchsten Punkt der Halbinsel – 166 Zimmer, mit Blick auf den hauseigenen Golfplatz und das Meer dahinter. Es ist eines von mehreren Hotels und Resorts, die sich die Landzunge von Soma Bay teilen, von der großen Kempinski-Anlage mit 325 Zimmern bis zur auf Tauchen spezialisierten Breakers. Diese Dichte an unterschiedlichen Häusern auf engem Raum ist Teil dessen, was die Destination interessant macht: Man bucht nicht nur ein Zimmer, sondern eine bestimmte Version von Soma Bay."),
    block("Diese Bandbreite ist kein Zufall. Die Sheraton-Anlage liegt mit 326 Zimmern direkt an 800 Metern Strand, die Robinson Soma Bay richtet sich mit eigenen Familienzimmern gezielt an Familien, und die auf Tauchen spezialisierte Breakers bedient noch einmal eine andere Zielgruppe. Golfer sind auf der Halbinsel also nicht die einzige Klientel – sie sind eine von mehreren, die sich denselben Küstenstreifen teilen."),
    block("MEHR ALS EINE RUNDE", "h2"),
    block("Was Soma Bay von vielen anderen Wüsten-Golfdestinationen unterscheidet, ist, dass Golf nur einer von mehreren ernstzunehmenden Gründen ist, hierher zu reisen. Direkt vor der Küste liegt ein Hausriff, das die Region zu einem der zugänglichsten Tauchgebiete am Roten Meer macht. Wind und Exposition der Halbinsel machen sie gleichzeitig zu einem der bekannteren Kitesurf-Spots Ägyptens – mit eigenen Kite-Häusern und Ausrüstern direkt vor Ort. Wer diese beiden Fakten zusammen betrachtet, versteht schnell, warum ein einziger Tag in Soma Bay nicht ausreicht."),
    block("Wer mehrere Nächte bleibt, kann diese Bandbreite tatsächlich nutzen – ein Golftag, ein Tauchtag, ein Tag am Pool, ein Tag am Wasser. Genau das ist der Unterschied zwischen einer Destination, die Golf anbietet, und einer, die sich um Golf herum weiterentwickelt hat."),
    block("Ein Ort, an dem Wüste und Meer sich nichts schenken – und Golf nur der Anlass ist, beides aus der Nähe zu sehen.", "pullQuote"),
    block("Das eigentliche Argument für Soma Bay ist deshalb kein einzelnes Loch und keine einzelne Bahn, sondern der Rhythmus, den die Halbinsel ermöglicht: eine Runde am Vormittag, danach Zeit für alles andere, was diese Küste zu bieten hat. Wie genau dieser zweite Teil des Tages aussehen kann, ist eine eigene Geschichte – und die beginnt genau dort, wo die 18. Bahn endet.")
  ]
};

const storySomaBayAfter18 = {
  _id: STORY.somaBayAfter18,
  _type: "story",
  title: "WENN NACH DER 18 NOCH EIN GANZER TAG ÜBRIG IST.",
  slug: slugOf("wenn-nach-der-18-noch-ein-ganzer-tag-uebrig-ist"),
  format: "after-18",
  kicker: "EGYPT / RED SEA",
  deck: "Golf ist in Soma Bay der Anfang des Tages, nicht der ganze Trip. Was nach der 18. Bahn übrig bleibt.",
  publishedAt: "2026-09-06T08:00:00.000Z",
  readingTime: 3,
  featured: false,
  aroundSelected: false,
  priority: 58,
  related: [ref(DEST.somaBay), ref(PLACE.somabayGolf), ref(PLACE.cascades)],
  seoTitle: "Soma Bay nach der Golfrunde: Tauchen, Kiten, Spa | AROUND",
  seoDescription: "Was in Soma Bay passiert, wenn die Golfrunde vorbei ist: Tauchen am Hausriff, Kitesurfen, Thalasso-Spa oder einfach nichts.",
  body: [
    block("Um neun Uhr steht die Sonne noch flach über der Wüste, die Luft ist trocken und angenehm, und auf dem Gary Player Championship Course beginnt die erste Runde des Tages. Um ein Uhr mittags ist diese Runde vorbei – und in Soma Bay fängt der eigentlich interessante Teil des Tages erst an. Genau das unterscheidet Soma Bay von vielen klassischen Golf-Resorts: Golf ist hier der Anfang, nicht das Programm. Was danach passiert, hängt weniger vom Reiseführer ab als von der eigenen Tagesform – und genau das ist in Soma Bay ausdrücklich vorgesehen."),
    block("DAS RIFF VOR DER TÜR", "h2"),
    block("Direkt vor der Halbinsel liegt ein Hausriff, das Soma Bay zu einer der zugänglichsten Tauchbasen am Roten Meer macht. Operator wie Orca Diving bieten Ausfahrten und Kurse direkt vor Ort an, ohne dass dafür ein längerer Bootstransfer nötig wäre. Für alle, die nach der Runde noch etwas erleben wollen, das sich komplett anders anfühlt als 18 Bahnen Golf, ist das eine der direktesten Möglichkeiten, das zu tun."),
    block("Für Taucher ist das ein spürbarer Unterschied zu vielen anderen Zielen am Roten Meer, wo ein Ausflug zum eigentlichen Tauchspot oft eine längere Bootsfahrt bedeutet. Auf Soma Bay beginnt der erste Tauchgang des Nachmittags kurz nachdem die letzte Bahn gespielt wurde."),
    block("WIND ALS ZWEITE DISZIPLIN", "h2"),
    block("Soma Bay hat sich außerdem als einer der bekannteren Kitesurf-Spots Ägyptens etabliert. Mit dem 7BFT Kite House und einem Duotone-Kiteboarding-Center gibt es zwei spezialisierte Anlaufstellen direkt an der Küste, dazu ein allgemeines Wassersportzentrum für Windsurfen, Segeln, Schnorcheln und Bootsausflüge. Wer am Vormittag Golf gespielt hat, kann am Nachmittag buchstäblich in eine völlig andere Sportart wechseln, ohne die Halbinsel zu verlassen."),
    block("Wer selbst nicht kitet oder surft, kann am Strand zusehen, wie sich die Halbinsel von einer Golfdestination in einen der aktiveren Wassersport-Spots Ägyptens verwandelt – oft innerhalb desselben Nachmittags und mit Blick von der eigenen Terrasse."),
    block("FÜR REISENDE MIT UNTERSCHIEDLICHEN INTERESSEN", "h2"),
    block("Diese Dichte an Möglichkeiten hat noch einen praktischen Vorteil: Wer mit jemandem reist, der selbst nicht golft, muss in Soma Bay keine Kompromisse eingehen. Während die eine Hälfte der Reisegruppe auf dem Platz unterwegs ist, kann die andere tauchen, kiten oder im Spa Zeit verbringen – und beide treffen sich am Nachmittag am selben Pool wieder."),
    block("SPA STATT NOCH EINER RUNDE", "h2"),
    block("Nicht jeder Nachmittag muss aktiv sein. Auf der Halbinsel betreibt Soma Bay eines der größten Thalasso-Spa-Zentren der Region – mit einer eigenen Hydrotherapie-Wasserwelt und einer Fläche, die deutlich über das hinausgeht, was man in einem klassischen Hotel-Spa erwarten würde. Das ist kein Wellnessbereich im Nebenraum, sondern eine eigenständige Einrichtung, die genauso viel Aufmerksamkeit verdient wie der Golfplatz selbst. Für einen Golftrip, der nicht nur aus Golf bestehen soll, ist das ein wichtiger Unterschied."),
    block("Wie ernst Soma Bay diesen Teil des Angebots nimmt, zeigt allein die Größe der Anlage: Ein Thalasso-Zentrum dieser Dimension baut niemand als Nebensache. Es ist ein eigenständiges Argument für die Destination, unabhängig vom Golfplatz."),
    block("ODER EINFACH NICHTS", "h2"),
    block("Die vielleicht unterschätzteste Option in Soma Bay ist, nach der Runde schlicht nichts zu tun. Mehrere Hotels und Resorts teilen sich die Halbinsel, jedes mit eigenem Charakter und eigener Poollandschaft mit Blick auf Wüste oder Meer – genug Raum, um den Nachmittag einfach verstreichen zu lassen, bevor am Abend eines der mehreren Restaurants der Anlage übernimmt."),
    block("Am Abend übernehmen die Restaurants der Hotels und Resorts auf der Halbinsel – von einfacher Küche bis zum größeren Dinner-Moment –, bevor der nächste Morgen wieder mit einer Golfrunde beginnen kann, falls gewünscht. Zwang besteht dazu allerdings nicht: Ein Tag ganz ohne Golf ist auf dieser Halbinsel genauso plausibel wie einer mit zwei Runden. Diese Offenheit – Golf ja, aber nicht zwingend – ist es, die Soma Bay von reinen Golfresorts unterscheidet, in denen der Tagesablauf implizit um den Platz herum organisiert ist."),
    block("Golf ist hier der erste Termin des Tages – nicht der einzige.", "pullQuote"),
    block("Wer Soma Bay nur als Golfziel bucht, verpasst genau das, was die Halbinsel besonders macht: die Möglichkeit, einen Tag zwischen Wüste und Meer so zu bauen, wie es gerade passt – mit Golf am Anfang und allem anderen danach.")
  ]
};

const storyPostwirtSoell = {
  _id: STORY.postwirtSoell,
  _type: "story",
  title: "EIN HOTEL MITTEN IM DORF. UND GENAU DESHALB INTERESSANT.",
  slug: slugOf("ein-hotel-mitten-im-dorf"),
  format: "story",
  kicker: "TIROL / WILDER KAISER",
  deck: "Ein Haus mitten in Söll, seit 1281 dokumentiert – und warum genau diese Lage den Postwirt zur interessanten Basis macht.",
  publishedAt: "2026-09-08T08:00:00.000Z",
  readingTime: 5,
  featured: false,
  aroundSelected: false,
  priority: 66,
  related: [ref(PLACE.postwirt), ref(DEST.soell)],
  seoTitle: "Der Postwirt in Söll: Basecamp mitten im Dorf | AROUND",
  seoDescription: "Der Postwirt in Söll ist seit 1281 dokumentiert, liegt mitten im Ortskern und ist heute ein modernes Basecamp am Wilder Kaiser.",
  body: [
    block("Wer nach einem Basecamp für einen Tirol-Trip sucht, bekommt oft denselben Ratschlag: am besten außerhalb, ruhig, mit Aussicht, weit weg vom Trubel. Der Postwirt in Söll macht genau das Gegenteil – und ist gerade deshalb ein interessanter Fall. Die Adresse lautet schlicht Dorf 82. Das Haus steht nicht am Ortsrand und nicht auf einem Hügel, sondern mittendrin, dort, wo Söll tatsächlich stattfindet."),
    block("EIN HAUS, DAS ÄLTER IST ALS DER SKISPORT", "h2"),
    block("Die erste urkundliche Erwähnung des Postwirt reicht bis ins Jahr 1281 zurück – damit gilt das Gebäude als das älteste und am besten erhaltene der gesamten Wilder-Kaiser-Region. Zu einer Zeit, als Söll noch kein Ferienort war, sondern ein Poststützpunkt an einer Handelsroute, stand hier bereits ein Haus, das Reisende versorgte. Diese Funktion – Ort für Ankommende zu sein – hat sich über Jahrhunderte kaum verändert, nur die Reisenden sind andere geworden."),
    block("Zwischen dieser ersten Erwähnung und der Tiroler Erhebung 1809 liegen über 500 Jahre, in denen das Haus seine Funktion als Post- und Gasthausstation für die Region behielt. Für ein Gebäude, das heute als modernes Wellnesshotel geführt wird, ist das eine ungewöhnlich lange, durchgehende Nutzungsgeschichte."),
    block("ANDREAS HOFER UND EINE FAMILIENLINIE", "h2"),
    block("Während der Tiroler Erhebung nutzte Andreas Hofer den Postwirt als Unterkunft. Der damalige Besitzer, Josef Rainer, war Weggefährte Hofers im Freiheitskampf – und ist ein direkter Vorfahre der heutigen Besitzerfamilie Bliem. Diese Linie, von einem Kämpfer der Tiroler Erhebung im frühen 19. Jahrhundert bis zu den heutigen Gastgebern, ist keine touristische Erzählung, sondern dokumentierte Familiengeschichte."),
    block("Andreas Hofer zählt zu den bekanntesten Figuren der Tiroler Geschichte: Er führte 1809 den bewaffneten Widerstand Tirols gegen die bayerisch-französische Besatzung an. Dass ausgerechnet der Postwirt zu den Stationen gehörte, an denen er sich aufhielt, verankert das Haus in einem der zentralen Kapitel der Tiroler Landesgeschichte – nicht nur in der Lokalgeschichte Sölls."),
    block("7. MAI 1945: EIN MOMENT ZEITGESCHICHTE IN DER BIERSTUBE", "h2"),
    block("Der vielleicht bemerkenswerteste historische Moment des Hauses fällt in die letzten Kriegstage des Zweiten Weltkriegs: Am 7. Mai 1945 kapitulierte der Wehrmachtsgeneral Georg Ritter von Hengl gegenüber US-Truppen – in der Bierstube des Postwirt. Ein Gasthaus, das seit dem 13. Jahrhundert Reisende beherbergt hatte, wurde für einen Moment zum Schauplatz eines Kapitels europäischer Zeitgeschichte."),
    block("Der 7. Mai 1945 liegt nur einen Tag vor der bedingungslosen Kapitulation der Wehrmacht in Europa. Ein Detail wie dieses macht deutlich, warum die eigene Geschichte des Postwirt kein Marketingtext ist, sondern dokumentierte Zeitgeschichte, die zufällig in einem Dorfgasthaus stattfand."),
    block("VOM EINFACHEN GASTHAUS ZUM MODERNEN RESORT", "h2"),
    block("Lange war der Postwirt genau das, was der Name suggeriert: ein einfaches Gasthaus mit Gemeinschaftsbädern und warmem Wasser gegen Aufpreis. Die Entwicklung zum heutigen Haus – mit Adults-only-Panorama-Spa, Infinity Sunset Pool, eigenem Familienbereich samt Kinderclub und mehreren Pools – vollzog sich über Jahrzehnte, mit einer größeren Erweiterung im Jahr 2020. Geführt wird das Haus heute von Florian Bliem gemeinsam mit seiner Frau Christina und seiner Schwiegermutter Marlene – eine Familie, die eine jahrhundertealte Aufgabe in eine zeitgemäße Form gebracht hat, ohne sie neu zu erfinden."),
    block("Die Zimmerkategorien reichen von kompakten „Kuschelzimmern“ bis zur Panorama-Suite, dazu ein separater Fitnessbereich und ein Yoga-Programm – Ausstattung, die mit einem Gasthaus aus dem 13. Jahrhundert auf den ersten Blick wenig zu tun hat und doch aus genau diesem Haus gewachsen ist."),
    block("MITTEN IM DORF, NICHT DAVOR", "h2"),
    block("Was das für einen Trip praktisch bedeutet: Söll selbst ist in wenigen Schritten erreichbar, nicht über eine Zufahrtsstraße, sondern zu Fuß. Das ist ein Unterschied, der bei der Suche nach einem Basecamp leicht unterschätzt wird. Ein Hotel im Ortskern bedeutet Zugang zu echtem Dorfleben – zu Geschäften, Gasthäusern, Kirche und Dorfplatz –, ohne dass man dafür das eigene Zimmer verlassen und wieder ins Auto steigen muss."),
    block("Dahinter erhebt sich der Wilder Kaiser: schroffe Gipfel auf der einen, sanfte Almwiesen auf der anderen Seite desselben Gebirgszugs. Diese Kombination aus zwei sehr unterschiedlichen Landschaftscharakteren prägt die gesamte Region und ist einer der Gründe, warum sich ein Aufenthalt hier zu jeder Jahreszeit unterschiedlich anfühlt."),
    block("Söll selbst ist Teil der SkiWelt Wilder Kaiser-Brixental, einem der größeren zusammenhängenden Skigebiete Tirols. Im Sommer übernehmen Wandern und die alpine Kulisse des Wilder Kaiser dieselbe Rolle, die im Winter der Skisport spielt – ein weiterer Grund, warum sich ein Aufenthalt hier je nach Jahreszeit fast wie ein anderes Ziel anfühlt."),
    block("Ein Hotel muss nicht abgelegen sein, um ein guter Ausgangspunkt zu sein. Manchmal ist die Mitte des Dorfes der bessere Platz.", "pullQuote"),
    block("Der Postwirt ist damit ein Gegenbeispiel zu der Annahme, dass ein gutes Basecamp Distanz zum Alltag der Umgebung braucht. Über 700 Jahre Geschichte, eine Familienlinie, die bis zur Tiroler Erhebung zurückreicht, ein Moment europäischer Zeitgeschichte in der eigenen Bierstube – und mittendrin ein Haus, das genau das zu einer modernen, komfortablen Basis für Wilder-Kaiser-Trips gemacht hat, ohne die eigene Geschichte zu verstecken.")
  ]
};

const storyWestCliffs = {
  _id: STORY.westCliffsCourseCorrection,
  _type: "story",
  title: "DER PLATZ, DER AUSSIEHT, ALS WÄRE ER IMMER SCHON DA GEWESEN.",
  slug: slugOf("der-platz-der-aussieht-als-waere-er-immer-schon-da-gewesen"),
  format: "course-correction",
  kicker: "PORTUGAL / SILVER COAST",
  deck: "Muss ein großartiger Golfplatz aussehen, als wäre er gebaut worden? West Cliffs beantwortet die Frage mit Zurückhaltung.",
  publishedAt: "2026-09-10T08:00:00.000Z",
  readingTime: 4,
  featured: false,
  aroundSelected: false,
  priority: 64,
  related: [ref(PLACE.westCliffs), ref(DEST.silverCoast)],
  seoTitle: "West Cliffs Golf Course: Golfarchitektur mit Zurückhaltung | AROUND",
  seoDescription: "West Cliffs an Portugals Silberküste zeigt, warum Zurückhaltung in der Golfplatzarchitektur die größere Leistung sein kann.",
  body: [
    block("Die meisten neuen Golfplätze der letzten zwei Jahrzehnte tragen die Handschrift ihrer eigenen Bauzeit sichtbar vor sich her: modellierte Hügel, künstlich wirkende Bunkerkanten, Fairways, die aussehen, als seien sie mit dem Lineal gezogen worden. West Cliffs an der portugiesischen Silberküste macht das Gegenteil – und wirft damit eine einfache, aber selten gestellte Frage auf: Muss ein großartiger Golfplatz überhaupt aussehen, als wäre er gebaut worden?"),
    block("CYNTHIA DYE UND DIE ENTSCHEIDUNG, WENIGER ZU TUN", "h2"),
    block("Entworfen wurde West Cliffs von Cynthia Dye ASGCA für die Dye Designs Group. Auf der offiziellen Website wird das Ziel des Designs mit dem Bild beschrieben, die Kräfte der Natur zu zähmen, statt sie zu überschreiben. In der Praxis heißt das: vorhandene Dünen wurden erhalten, natives Küstengehölz blieb stehen, natürliche Sandflächen wurden in das Spielfeld integriert statt eingeebnet."),
    block("Die Dye Designs Group steht seit Jahrzehnten für einen bestimmten Ansatz im Golfplatzbau: Gelände lesen, bevor man es verändert. Bei West Cliffs zeigt sich das in Details wie den naturbelassenen Randbereichen der Fairways, die bewusst nicht in gepflegten Rasen übergehen, sondern in genau die Vegetation, die schon vor dem Bau des Platzes dort wuchs."),
    block("DÜNEN, KIEFERN, ATLANTIK", "h2"),
    block("Der Platz liegt an der Costa de Prata bei Óbidos, auf einem Gelände aus sanft gewellten Dünen, durchsetzt mit Küstenvegetation und Kiefernhainen mit Blick auf den Atlantik. 18 Bahnen, Par 72 – eine Reihenfolge unterschiedlicher Lochlängen, die sich der Topografie unterordnet statt sie zu dominieren. Die Löcher wechseln zwischen offenen Dünenabschnitten und Passagen durch die Kiefern, immer mit dem Meer als Referenzpunkt am Horizont."),
    block("Der Wind vom Atlantik ist dabei mehr als Kulisse: Er verändert je nach Tageszeit die Anspielung nahezu jeder Bahn – ein Faktor, der zu jedem Linkskurs am Meer gehört und den West Cliffs nicht zu kaschieren versucht, sondern bewusst in sein Layout einbezieht."),
    block("West Cliffs liegt in unmittelbarer Nachbarschaft zum älteren Praia D'El Rey Golf & Beach Resort und wird als dessen Partneranlage geführt. Für die Silberküste als Ganzes bedeutet das: Zwei Linkskurse mit unterschiedlichem Charakter liegen praktisch nebeneinander, beide mit direktem Bezug zum Atlantik, aber mit spürbar unterschiedlicher Handschrift."),
    block("AUSZEICHNUNGEN, DIE DIE ZURÜCKHALTUNG BESTÄTIGEN", "h2"),
    block("Seit seiner Eröffnung 2017 hat West Cliffs eine bemerkenswerte Reihe an Auszeichnungen gesammelt: World's Best New Course bei den World Golf Awards 2017, 2018 unter den zwei besten Plätzen Portugals, 2019 als Golf Development of the Year. Für einen Platz, dessen erklärtes Ziel Zurückhaltung war, ist das eine bemerkenswerte Bilanz: Er wurde nicht trotz, sondern wegen seiner Unauffälligkeit ausgezeichnet."),
    block("Dass ein einzelner Platz innerhalb weniger Jahre nach Eröffnung World's Best New Course, eine Top-2-Platzierung in Portugal und die Auszeichnung als Golf Development of the Year sammelt, ist ungewöhnlich selbst für ein golferisch etabliertes Land wie Portugal. Die Auszeichnungen kamen dabei nicht für Länge oder Schwierigkeit, sondern explizit für die Art, wie der Platz in die Landschaft eingebettet ist."),
    block("STRATEGIE STATT SPEKTAKEL", "h2"),
    block("Das bedeutet nicht, dass West Cliffs einfach ist. Natürliche Sandflächen, erhaltene Dünenkanten und Wasserhindernisse an den Schlusslöchern sorgen für genug strategische Fragen, um erfahrene Golfer zu fordern. Der Unterschied liegt darin, wie diese Herausforderung entsteht: nicht durch nachträglich geformte Hindernisse, sondern durch ein Gelände, das schon vor dem ersten Spatenstich genau diese Fragen aufgeworfen hätte."),
    block("Diese Art von Schwierigkeit lässt sich nicht mit einem längeren Drive lösen. Sie verlangt Positionsspiel – eine Eigenschaft, die man eher mit traditionellen schottischen oder irischen Linkskursen verbindet als mit einer vergleichsweise jungen Anlage aus dem Jahr 2017."),
    block("Das ist im Golfplatzbau schwieriger, als es klingt. Es ist einfacher, eine flache Fläche zu modellieren, als vorhandene Landschaft zu respektieren und trotzdem ein spielbares, strategisch interessantes Layout daraus zu entwickeln. Zurückhaltung verlangt mehr Entscheidungen, nicht weniger – nur sind die meisten davon unsichtbar, wenn sie gut getroffen wurden."),
    block("Das beste Kompliment für einen Golfplatzarchitekten ist manchmal, dass man seine Arbeit nicht sieht.", "pullQuote"),
    block("Die Antwort auf die Ausgangsfrage lautet damit: nein, ein großartiger Golfplatz muss nicht aussehen, als wäre er gebaut worden – und genau das kann die größere gestalterische Leistung sein. West Cliffs sieht aus, als hätte es diese Dünen, diese Kiefern und diesen Blick auf den Atlantik schon gegeben, lange bevor jemand einen Golfschläger mitbrachte. Das ist kein Zufall. Das ist die Entscheidung, möglichst wenig zu verändern.")
  ]
};

const storyEstonia = {
  _id: STORY.estonia48Hours,
  _type: "story",
  title: "TALLINN. PÄRNU. LINKS GOLF. REPEAT.",
  slug: slugOf("tallinn-paernu-links-golf-repeat"),
  format: "48-hours",
  kicker: "ESTONIA",
  deck: "Altstadt, Ostseeküste, ein Linkskurs im Baltikum: eine kompakte Route, die sich wie eine Entdeckung anfühlt.",
  publishedAt: "2026-09-12T08:00:00.000Z",
  readingTime: 5,
  featured: false,
  aroundSelected: false,
  priority: 60,
  related: [ref(DEST.tallinn), ref(DEST.parnu), ref(PLACE.parnuBayGolf)],
  seoTitle: "Estland Golfreise: Tallinn, Pärnu, Pärnu Bay Golf Links | AROUND",
  seoDescription: "Eine kompakte Route durch Estland: Tallinns Altstadt, die Kurstadt Pärnu und der erste Linkskurs des Baltikums.",
  body: [
    block("Ein Golftrip nach Estland klingt zunächst nach einer Notiz, keiner Schlagzeile. Genau das macht die Route interessant: Tallinn, Pärnu, ein Linkskurs an der Ostsee – eine Kombination, die sich weniger wie ein klassisches europäisches Golfziel anfühlt und mehr wie eine Entdeckung, die man selbst gemacht hat."),
    block("International gilt Estland eher als das Land der digitalen Verwaltung und der e-Residency denn als Golfdestination – ein Ruf, der mit dem tatsächlichen Reiseerlebnis wenig zu tun hat, sobald man vor Ort steht."),
    block("TALLINN: MITTELALTER AUF ENGSTEM RAUM", "h2"),
    block("Die Altstadt von Tallinn steht seit 1997 als „Historic Centre (Old Town) of Tallinn“ auf der UNESCO-Welterbeliste – eine der am besten erhaltenen mittelalterlichen Handelsstädte Nordeuropas. Kopfsteinpflaster, Stadtmauern, Türme: Wer einen Tag Zeit einplant, bevor die Golfschläger überhaupt ausgepackt werden, bekommt eine Stadt, die sich komplett anders anfühlt als jede Golfdestination südlich der Ostsee."),
    block("Tallinn profitiert dabei von einer praktischen Nebensache: Der Flughafen der Stadt gilt als einer der kompaktesten und unkompliziertesten Europas, kaum eine Fahrtminute vom mittelalterlichen Zentrum entfernt. Für eine 48-Stunden-Route ist das kein Nebensatz, sondern ein Grund, warum sich die Zeit vor Ort tatsächlich für die Stadt nutzen lässt und nicht im Transfer verloren geht."),
    block("128 KILOMETER RICHTUNG SÜDEN", "h2"),
    block("Von Tallinn nach Pärnu sind es rund 128 Kilometer, mit dem Auto etwa anderthalb bis zwei Stunden – eine Fahrt, die sich problemlos in einen zweiten Reisetag einbauen lässt, ohne dass der Trip auseinanderfällt. Genau diese Kompaktheit ist einer der Gründe, warum Estland als Golfziel funktioniert: Stadt und Küste liegen nah genug beieinander, um beides in wenigen Tagen ernsthaft zu erleben."),
    block("Die Fahrt selbst führt durch ein Land, das zu über der Hälfte von Wald bedeckt ist – eine der am dünnsten besiedelten Regionen Europas, in der Städte eher wie Ausnahmen in der Landschaft wirken als wie deren Zentrum."),
    block("PÄRNU: ESTLANDS SOMMERHAUPTSTADT", "h2"),
    block("Pärnu trägt seit 1996 offiziell den Titel „Estlands Sommerhauptstadt“ – und das aus gutem Grund. Die Bäderkultur der Stadt reicht bis 1838 zurück, als die erste Badeeinrichtung eröffnete; das noch heute bestehende Gebäude der Pärnu-Schlammbäder stammt aus dem Jahr 1927. Diese jahrhundertealte Kurtradition trifft heute auf Sandstrand, Spas, Restaurants und eine spürbar entspanntere Taktung als in der Hauptstadt – der Ort, an dem sich ein Golftrip vom reinen Programm in echten Urlaub verwandelt."),
    block("Dass eine Stadt mit gut 40.000 Einwohnern über eine derart lange Kurtradition verfügt, liegt an ihrer Geschichte als Anziehungspunkt weit über die eigenen Landesgrenzen hinaus: Schon früh kamen Gäste aus Finnland und Schweden – ein Muster, das sich bis heute nicht verändert hat."),
    block("PÄRNU BAY GOLF LINKS: DER ERSTE LINKSKURS DES BALTIKUMS", "h2"),
    block("Rund um die Ecke von Pärnu, im Ort Reiu in der Gemeinde Häädemeeste, liegt der Pärnu Bay Golf Links – nach eigener und vielfach zitierter Beschreibung der erste echte Linkskurs der baltischen Staaten. Eröffnet 2015, entworfen vom Architekten Lassi Pekka Tilander mit Mick McShane als leitendem Shaper, der zuvor am Castle Course von St Andrews und am Kingsbarns Golf Links mitgearbeitet hatte. Der Platz spielt sich über 18 Löcher mit Par 72 auf einer Länge zwischen 4.500 und 6.200 Metern, ergänzt um fünf zusätzliche Par-3-Bahnen und eine Driving Range."),
    block("Sowohl Tilander als auch McShane bringen ihre Erfahrung von einigen der bekanntesten Linkskursen der Welt mit an die estnische Küste. Für einen Kurs, der erst 2015 eröffnet wurde, ist das eine ungewöhnlich direkte Verbindung zu den Ursprüngen des Linksgolfs in Schottland."),
    block("Das Klubhaus mit Saunen liegt direkt über der Bucht, dazu ein Golfshop und das Eagle Restaurant mit nordisch inspirierter Küche. Die World Golf Awards haben den Platz mehrfach zu Estlands bestem Golfplatz gewählt – ein Titel, der angesichts der überschaubaren Konkurrenz im Baltikum weniger überrascht als die Tatsache, dass hier überhaupt ein Linkskurs dieser Qualität existiert."),
    block("Für Golfreisende, die einen zweiten oder dritten Tag am Platz verbringen wollen, sorgen die fünf zusätzlichen Par-3-Bahnen und die Driving Range dafür, dass nicht jede Runde die volle 18-Loch-Championship-Strecke sein muss."),
    block("Nicht jede gute Golfreise muss dorthin führen, wo man sie erwartet.", "pullQuote"),
    block("Die eigentliche Pointe der Route liegt in ihrer Kompaktheit: eine mittelalterliche Welterbestadt, eine Kurstadt mit fast 200-jähriger Bädertradition und ein Linkskurs, der in seiner eigenen Region ohne echten Vergleich ist – alles innerhalb weniger Autostunden. Für alle, die glauben, gute Golfreisen seien bereits vollständig kartiert, ist Estland der Beweis des Gegenteils. Und wie der Titel schon sagt: Tallinn, Pärnu, Linksgolf – und beim nächsten Mal wieder von vorn.")
  ]
};

const storyManifest = {
  _id: STORY.manifest,
  _type: "story",
  title: "DIE BESTE GOLFREISE BEGINNT NICHT AM ERSTEN ABSCHLAG.",
  slug: slugOf("die-beste-golfreise-beginnt-nicht-am-ersten-abschlag"),
  format: "manifest",
  kicker: "AROUND / MANIFEST",
  deck: "Golf ist dort, wo die Reise beginnt – warum eine gute Golfreise nie nur aus Abschlagszeiten besteht.",
  publishedAt: "2026-09-14T08:00:00.000Z",
  readingTime: 4,
  featured: true,
  aroundSelected: false,
  priority: 80,
  related: [ref(PLACE.cascades), ref(PLACE.postwirt), ref(PLACE.westCliffs), ref(DEST.tallinn), ref(PLACE.parnuBayGolf)],
  seoTitle: "AROUND Manifest: Golf ist, wo die Reise beginnt",
  seoDescription: "Das AROUND Manifest: Warum eine gute Golfreise um Orte, Menschen, Kultur, Essen, Landschaft und Zeit gebaut wird – nicht nur um Tee Times.",
  body: [
    block("Die beste Golfreise beginnt nicht am ersten Abschlag. Das ist keine Floskel, sondern die Grundannahme, auf der AROUND aufgebaut ist: Golf ist der Anlass für eine Reise, nicht ihr vollständiges Programm. Wer eine Golfreise ausschließlich über Tee Times plant, plant am eigentlichen Wert der Reise vorbei."),
    block("GOLF IST DER ANLASS, NICHT DAS PROGRAMM", "h2"),
    block("Ein Golftrip, der nur aus Golf besteht, ist eine Verschwendung der Reise – nicht des Golfs. Die eigentliche Frage lautet nicht, wie viele Runden in eine Woche passen, sondern was um diese Runden herum passiert: welche Landschaft man durchquert, in welchem Ort man ankommt, wen man trifft, was man isst, wie viel Zeit übrig bleibt, um nichts davon zu verpassen."),
    block("Wer eine Golfreise ausschließlich nach Platzqualität und Tee-Time-Verfügbarkeit bucht, bekommt oft eine gute Runde und einen austauschbaren Rest der Woche: ein Hotelzimmer in Flughafennähe, ein Restaurant, das zufällig in der Nähe liegt, einen Tag zwischen zwei Runden, der einfach verstreicht, statt genutzt zu werden. Das ist kein Fehler des Golfplatzes. Es ist ein Fehler der Planung davor."),
    block("Genau deshalb beginnt AROUND jede Empfehlung nicht bei der Tee Time, sondern beim Ort: Was macht diese Destination, dieses Hotel, diesen Platz interessant, unabhängig vom Golf? Erst danach wird daraus ein Vorschlag für eine Reise."),
    block("LANDSCHAFT ALS ARGUMENT, NICHT ALS KULISSE", "h2"),
    block("In Soma Bay treffen Wüste und Rotes Meer auf einer einzigen Halbinsel aufeinander – ein Kontrast, der den Platz selbst prägt und der Grund dafür ist, warum ein einziger Tag dort nicht ausreicht. Das Riff, der Wind, das Spa liegen alle in Reichweite derselben Runde. Landschaft ist hier kein Hintergrundbild für Golf, sondern der eigentliche Reisegrund, zu dem Golf nur den ersten Zugang liefert."),
    block("NÄHE ZUM ORT SCHLÄGT ISOLATION", "h2"),
    block("Der Postwirt in Söll widerlegt die Annahme, ein gutes Basecamp müsse abgelegen sein. Seit 1281 dokumentiert, mit einer Familiengeschichte, die bis zur Tiroler Erhebung zurückreicht, liegt das Haus mitten im Ort – nicht davor. Wer von dort aus in den Wilder Kaiser aufbricht, kehrt in ein echtes Dorf zurück, nicht in eine isolierte Anlage. Diese Nähe zum tatsächlichen Leben eines Ortes ist mehr wert als jede zusätzliche Ruhe, die Distanz verspricht."),
    block("RESPEKT VOR DEM, WAS SCHON DA WAR", "h2"),
    block("West Cliffs an Portugals Silberküste zeigt, dass die größte gestalterische Leistung manchmal darin liegt, möglichst wenig zu verändern. Dünen, Küstenvegetation und Kiefern blieben erhalten, statt einer Landschaft eine fremde Form aufzuzwingen. Das Ergebnis ist ein Platz, der aussieht, als hätte es ihn schon immer gegeben – eine Haltung, die sich auf jede gute Reiseplanung übertragen lässt: mit dem arbeiten, was ein Ort bereits ist, statt ihn nach einer Vorlage zu formen."),
    block("Diese Haltung lässt sich nicht nur auf Golfplätze anwenden. Auch eine gute Golfreise sollte einem Ort möglichst wenig aufzwingen und stattdessen zeigen, was ohnehin schon da ist."),
    block("ENTDECKUNG SCHLÄGT KONVENTION", "h2"),
    block("Und manchmal liegt der beste Beweis für diese Haltung dort, wo man ihn am wenigsten erwartet. Tallinn, Pärnu und ein Linkskurs im Baltikum ergeben keine klassische Golfreise – und genau deshalb funktionieren sie als eine. Eine mittelalterliche Welterbestadt, eine Kurstadt mit fast 200 Jahren Bädertradition und ein Platz, der in seiner Region ohne Vergleich ist: Das ist eine Route, die sich wie eine eigene Entscheidung anfühlt, nicht wie ein Standardprogramm."),
    block("Keines dieser vier Beispiele wäre durch einen reinen Ranking-Algorithmus nach Slope Rating oder Sternebewertung gefunden worden. Sie sind das Ergebnis einer redaktionellen Entscheidung: Welche Orte lohnt es, jenseits der eigentlichen Runde zu erzählen?"),
    block("ZEIT IST DIE EIGENTLICHE WÄHRUNG", "h2"),
    block("Was diese vier Beispiele verbindet, ist keine Destination und kein Architektenname, sondern eine Frage nach Zeit: Wie viel Zeit bleibt neben dem Golf – und wofür wird sie genutzt? Eine Golfreise, die diese Frage ernst nimmt, plant nicht nur Abschlagszeiten, sondern Orte, Menschen, Kultur, Essen und Landschaft gleichberechtigt mit ein."),
    block("Das gilt für eine Woche am Roten Meer genauso wie für 48 Stunden in Estland: Der Maßstab ist nicht die Anzahl gespielter Löcher, sondern wie viel von der jeweiligen Destination am Ende tatsächlich erlebt wurde."),
    block("Golf ist dort, wo die Reise beginnt.", "pullQuote"),
    block("Das ist die Idee, aus der AROUND entstanden ist – und der Maßstab, an dem sich jede Geschichte messen lassen muss, die hier erzählt wird: nicht wie gut der Platz war, sondern wie gut die ganze Reise darum herum gebaut wurde.")
  ]
};

const stories = [
  storySomaBayWorthTheTrip,
  storySomaBayAfter18,
  storyPostwirtSoell,
  storyWestCliffs,
  storyEstonia,
  storyManifest
];

// Curated destination -> places (basic, deterministic; separate from the
// automatic Story Graph rollup shipped in v1.25a).
const destinationPlaceRefs: Record<string, string[]> = {
  [DEST.somaBay]: [PLACE.somabayGolf, PLACE.cascades],
  [DEST.soell]: [PLACE.postwirt],
  [DEST.silverCoast]: [PLACE.westCliffs],
  [DEST.parnu]: [PLACE.parnuBayGolf]
};

type LogFn = (line: string) => void;

export function EditorialPilotSeedTool() {
  const client = useClient({apiVersion: "2026-03-01"}).withConfig({useCdn: false});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const addLog: LogFn = line => setLog(prev => [...prev, line]);

  async function upsertDocument(doc: Record<string, unknown>, addLogFn: LogFn) {
    const id = doc._id as string;
    await client.createIfNotExists(doc as any);
    const {_id, _type, ...fields} = doc;
    await client.patch(id).set(fields).commit();
    addLogFn(`✓ ${doc._type} „${doc.title}“ (${id}) angelegt/aktualisiert.`);
  }

  async function upsertStory(doc: Record<string, unknown>, addLogFn: LogFn) {
    const id = doc._id as string;
    const before = await client.fetch(`*[_id == $id][0]{"hasBody": defined(body)}`, {id});
    const bodyAlreadyPresent = Boolean(before?.hasBody);
    await client.createIfNotExists(doc as any);
    const {_id, _type, body, ...fields} = doc;
    await client.patch(id).set(fields).commit();
    // body is intentionally setIfMissing-only: a human may enrich it with
    // rights-cleared editorial images later - a reseed must never wipe that.
    // Trade-off: this also means a FACTUAL CORRECTION to `body` in this file
    // (like the v0.1.1 West Cliffs/Soma Bay fixes) only reaches a document
    // whose body is still empty. If this story was already seeded once
    // before, its body is already non-empty and this call is a no-op for
    // it - the corrected text is skipped, not applied. That is deliberate:
    // we cannot tell a stale auto-seeded body apart from a hand-edited one,
    // so we never guess and never silently overwrite. See the tool's log
    // and docs/editorial-pilot-pack/README.md for what to do in that case.
    await client.patch(id).setIfMissing({body}).commit();
    addLogFn(
      bodyAlreadyPresent
        ? `⚠ story „${doc.title}“ (${id}): Body war bereits gesetzt - NICHT überschrieben. Falls dieses Dokument die alten Fakten (Par 70, "36 Bahnen", genaue Spa-Zahlen, "sechs Hotels") enthält, im Studio manuell korrigieren oder das body-Feld einmalig leeren und diesen Seed erneut ausführen.`
        : `✓ story „${doc.title}“ (${id}) angelegt, Body inkl. Fakten-Korrekturen v0.1.1 geschrieben.`
    );
  }

  async function runSeed() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setError("");
    setLog([]);
    try {
      addLog("→ Destinations …");
      for (const doc of destinations) await upsertDocument(doc, addLog);

      addLog("→ Places …");
      for (const doc of places) await upsertDocument(doc, addLog);

      addLog("→ Destination → Places (kuratiert) …");
      for (const [destId, placeIds] of Object.entries(destinationPlaceRefs)) {
        const existing = await client.fetch(`*[_id == $id][0]{"placeRefs": places[]._ref}`, {id: destId});
        const existingRefs: string[] = Array.isArray(existing?.placeRefs) ? existing.placeRefs.filter(Boolean) : [];
        const merged = Array.from(new Set([...existingRefs, ...placeIds]));
        await client.patch(destId).set({places: merged.map(pid => ref(pid))}).commit();
      }
      addLog("✓ Destination → Places verknüpft.");

      addLog("→ Stories (6) …");
      for (const doc of stories) await upsertStory(doc, addLog);

      addLog("ℹ Keine Bilder importiert – siehe docs/editorial-pilot-pack/README.md und media-manifest.json für Rechte-Status und nächste Schritte.");
      addLog("✓ Editorial Pilot Pack v0.1 fertig.");
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
      <div style={{maxWidth: 980, margin: "0 auto"}}>
        <div style={{fontSize: 12, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 18}}>AROUND · EDITORIAL PILOT PACK V0.1</div>
        <h1 style={{fontSize: "clamp(36px,6vw,74px)", lineHeight: .96, letterSpacing: "-.05em", margin: "0 0 24px"}}>SECHS ECHTE STORIES.<br/>EIN STORY GRAPH.</h1>
        <p style={{fontSize: 18, lineHeight: 1.5, maxWidth: 760, margin: "0 0 28px"}}>
          Legt fünf Destinations, fünf Places und sechs Stories an bzw. aktualisiert sie (deterministische IDs, kein Duplizieren).
          Verknüpft jede Story über das kanonische <code>related[]</code>-Feld mit ihren Places/Destinations, damit sich der
          Story Graph aus v1.25a end-to-end testen lässt. Es werden bewusst keine Bilder importiert.
        </p>
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, margin: "0 0 26px"}}>
          {["5 Destinations", "5 Places", "6 Stories", "0 Bilder"].map(x => (
            <div key={x} style={{border: "1px solid #212322", padding: 16, fontWeight: 900}}>{x}</div>
          ))}
        </div>
        <button
          onClick={runSeed}
          disabled={running}
          style={{border: 0, background: "#d6ea2a", color: "#212322", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", padding: "15px 20px", cursor: running ? "wait" : "pointer"}}
        >
          {running ? "IMPORT LÄUFT …" : done ? "NOCHMAL AKTUALISIEREN" : "EDITORIAL PILOT PACK IMPORTIEREN"}
        </button>
        {error && <div style={{marginTop: 20, padding: 16, background: "#f55096", fontWeight: 800}}>Fehler: {error}</div>}
        <div style={{marginTop: 28, background: "#212322", color: "#f5f3ee", padding: 20, minHeight: 150, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.7}}>
          {log.length ? log.map((line, i) => <div key={`${i}-${line}`}>{line}</div>) : <div style={{opacity: .65}}>Bereit. Noch nichts importiert.</div>}
        </div>
        {done && (
          <div style={{marginTop: 24, border: "1px solid #212322", padding: 20}}>
            <strong>Nächster Schritt:</strong>
            <div style={{marginTop: 8, lineHeight: 1.6}}>
              Bilder gemäß docs/editorial-pilot-pack/media-manifest.json prüfen/beschaffen und im Studio manuell auf den jeweiligen
              Story-/Place-Dokumenten ergänzen (Hero + Gallery). Ein erneuter Import überschreibt keine so ergänzten Bilder.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
