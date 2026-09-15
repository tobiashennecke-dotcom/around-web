"use client";

import {useState} from "react";
import {useClient} from "sanity";

/**
 * AROUND — Editorial Pilot Pack v0.2
 *
 * Adds six more real editorial Stories (7-12) plus one new Person document
 * (Cynthia Dye McGarey) on top of the six from v0.1. Does NOT recreate or
 * touch the original six Stories, nor any existing Destination/Place - all
 * of those are only referenced by id in the new Stories' related[].
 *
 * Content + graph test data only - this tool imports no new or external
 * image. The one exception: Story 7's heroImage references an
 * ALREADY-UPLOADED, already rights-cleared AROUND photo (the border-sign-at-
 * tee-18 image, credited Tobias Hennecke, already live on the Golfclub Reit
 * im Winkl Place gallery) - not a new upload, not an external source, just a
 * second reference to AROUND's own existing asset. See
 * docs/editorial-pilot-pack-v02/README.md for full sourcing, image-rights
 * status and how to add further approved imagery later via Studio.
 *
 * Safety model (identical to v0.1's EditorialPilotSeedTool.tsx):
 * - createIfNotExists() so a second run never duplicates documents.
 * - .patch(id).set(...) keeps title/copy/relations in sync on every run,
 *   but the patch NEVER includes gallery/socialImage/portrait - those are
 *   simply never touched, so any image a human adds later in Studio is safe
 *   forever, on every future reseed.
 * - Story `body`, Story `heroImage` (only set for Story 7) and Person `bio`
 *   all use .setIfMissing() only: written on first run, then left alone - so
 *   a human can replace/enrich them with real editorial content/images
 *   later without a reseed wiping that out. Each run logs, per document,
 *   whether the body/bio/heroImage was written fresh or left
 *   untouched because it was already present.
 */

// Existing objects from earlier releases - referenced only, never recreated.
const EXISTING_DEST = {
  reitImWinkl: "around-destination-reit-im-winkl",
  silverCoast: "around-destination-portugal-silver-coast",
  tallinn: "around-destination-tallinn",
  parnu: "around-destination-parnu"
} as const;

const EXISTING_PLACE = {
  golfclubReitImWinkl: "around-place-golfclub-reit-im-winkl-koessen",
  gutSteinbach: "around-place-gut-steinbach",
  winklmoosAlm: "around-place-winklmoos-alm",
  grillhausAlteSchmiede: "around-place-grillhaus-alte-schmiede",
  restaurantHeimat: "around-place-restaurant-heimat",
  sternenparkPlatzl: "around-place-sternenpark-platzl",
  westCliffs: "around-place-west-cliffs-golf-course",
  parnuBayGolf: "around-place-parnu-bay-golf-links"
} as const;

const PERSON = {
  cynthiaDyeMcGarey: "around-person-cynthia-dye-mcgarey"
} as const;

const STORY = {
  reitImWinklTwoCountries: "around-story-golfclub-reit-im-winkl-two-countries",
  reitImWinkl48Hours: "around-story-reit-im-winkl-48-hours",
  winklmoosAlmNights: "around-story-winklmoos-alm-nights",
  cynthiaDyeMcGarey: "around-story-cynthia-dye-mcgarey",
  gutSteinbach8080: "around-story-gut-steinbach-80-80",
  estoniaNextRoadTrip: "around-story-estonia-next-road-trip"
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

/**
 * References an already-uploaded, already rights-cleared Sanity image asset
 * by id - never a new upload, never an external URL. Used exactly once below
 * for a genuinely reusable AROUND-owned photo (see EXISTING_ASSET).
 */
function img(assetId: string, alt: string, credit: string) {
  return {_type: "image", asset: {_type: "reference", _ref: assetId}, alt, credit};
}

// The border-sign-at-tee-18 photo already live on the Golfclub Reit im Winkl
// Place gallery (uploaded via sanity/tools/BayernSeedTool.tsx, credited
// Tobias Hennecke - AROUND's own photography, not sourced externally). A
// thematically exact match for Story 7, so it is reused here as that
// Story's heroImage instead of leaving it empty.
const EXISTING_ASSET = {
  reitImWinklBorderSign: "image-f162c296aab7962dc3813dc3dd9cfc999b124ab5-1536x2048-jpg"
} as const;

// ============================================================
// NEW PERSON — Cynthia Dye McGarey (only created if not already present)
// ============================================================

const cynthiaDyeMcGareyPerson = {
  _id: PERSON.cynthiaDyeMcGarey,
  _type: "person",
  title: "Cynthia Dye McGarey",
  slug: slugOf("cynthia-dye-mcgarey"),
  role: "Golf Course Architect, ASGCA / EIGCA",
  location: "Denver, Colorado, USA",
  summary: "Golfplatzarchitektin und Inhaberin der Dye Designs Group – aufgewachsen in einer der einflussreichsten Familien der amerikanischen Golfarchitektur, heute mit einer eigenen, zurückhaltenderen Handschrift.",
  website: "https://dyedesignsgroup.com/",
  featured: false,
  priority: 55,
  bio: [
    block("Cynthia Dye McGarey wurde in Urbana, Ohio, geboren, in eine Familie hinein, die die amerikanische Golfarchitektur über Jahrzehnte mitgeprägt hat. Ihr Vater Roy Anderson Dye und ihr Onkel Pete Dye zählen zu den bekanntesten Golfplatzarchitekten des 20. Jahrhunderts; ihr Großvater Pink Dye baute bereits 1922 auf einem Stück Familienland einen ersten Neun-Loch-Platz, aus dem später der Urbana Country Club wurde."),
    block("Ihre eigene Laufbahn begann nicht im Golfbau, sondern in der Landschaftsgestaltung in Phoenix, Arizona. 1988 wechselte sie als Vollzeit-Beraterin ins Familienunternehmen und arbeitete knapp elf Jahre international als Design-Consultant, bevor sie 2001 mit der Dye Designs Group ihre eigene Firma gründete. Ihr erster eigener Platz, der White Horse Golf Club im US-Bundesstaat Washington, eröffnete 2007 und wurde von Golf Digest in die Liste der besten neuen Plätze des Jahres aufgenommen."),
    block("Sie ist Mitglied der American Society of Golf Course Architects (ASGCA) und der European Institute of Golf Course Architects (EIGCA) und hat seither an Projekten von Portugal bis Aserbaidschan, Südkorea, China und Neukaledonien gearbeitet. West Cliffs an Portugals Silberküste, entworfen für die Dye Designs Group, gilt als eines ihrer editorial bemerkenswertesten Projekte.")
  ]
};

// ============================================================
// NEW STORIES 7–12
// ============================================================

const storyTwoCountries = {
  _id: STORY.reitImWinklTwoCountries,
  _type: "story",
  title: "EIN GOLFPLATZ. ZWEI LÄNDER.",
  slug: slugOf("ein-golfplatz-zwei-laender"),
  format: "worth-the-trip",
  kicker: "BAYERN / TIROL",
  deck: "18 Löcher, zwei Länder und eine Grenze, die man auf der Runde kaum bemerkt: warum Reit im Winkl-Kössen mehr Reisegeschichte als Golfkuriosität ist.",
  publishedAt: "2026-09-05T08:00:00.000Z",
  readingTime: 4,
  featured: true,
  aroundSelected: false,
  priority: 72,
  related: [ref(EXISTING_PLACE.golfclubReitImWinkl), ref(EXISTING_DEST.reitImWinkl)],
  heroImage: img(EXISTING_ASSET.reitImWinklBorderSign, "Grenzschild am Weg zu Tee 18 zwischen Österreich und Deutschland", "Tobias Hennecke"),
  seoTitle: "Reit im Winkl-Kössen: Europas einziger grenzüberschreitender Golfplatz | AROUND",
  seoDescription: "Warum der Golfclub Reit im Winkl-Kössen als Europas erster und einziger grenzüberschreitender Golfplatz mehr Reisegeschichte als Golfkuriosität ist.",
  body: [
    block("Irgendwo zwischen einer Bahn in Bayern und der nächsten in Tirol überquert man eine Staatsgrenze. Kein Schlagbaum, kein Schild, kein Pass – nur ein Punkt auf der Karte, den man auf der Runde selbst kaum bemerkt. Golfclub Reit im Winkl-Kössen gilt nach vielfach bestätigter Aussage als erster und einziger grenzüberschreitender Golfplatz Europas: zwölf Bahnen liegen in Bayern, sechs in Tirol. Für eine Runde Golf ist das ungewöhnlich genug, um daraus eine Reisegeschichte zu machen – nicht nur eine Platzbeschreibung."),
    block("EINE GRENZE, DIE MAN SPIELT, NICHT ÜBERQUERT", "h2"),
    block("Was diesen Platz von einem gewöhnlichen Grenzort unterscheidet, ist, dass die Grenze hier kein Hindernis ist, sondern Teil des Layouts. Bayern und Tirol teilen sich nicht zwei Golfplätze, sondern einen einzigen – 18 Bahnen, die sich über die Landesgrenze hinweg durch das Kaiserwinkl ziehen, mit Blick auf die Chiemgauer Alpen auf der einen und das Kaisergebirge auf der anderen Seite. Die politische Grenze zwischen Deutschland und Österreich verläuft mitten durch das Gelände, ohne dass sich am Spiel selbst etwas ändert."),
    block("ZWEI LANDSCHAFTEN, EINE RUNDE", "h2"),
    block("Das eigentliche Erlebnis ist weniger die Grenze selbst als der Landschaftswechsel, den sie markiert. Auf der bayerischen Seite öffnet sich der Blick Richtung Reit im Winkl und die Chiemgauer Alpen, auf der Tiroler Seite dominiert das schroffere Kaisergebirge. Wer konzentriert spielt, könnte den Wechsel fast verpassen – wer aufschaut, bekommt zwei sehr unterschiedliche alpine Kulissen in einer einzigen Runde."),
    block("Das Klubhaus selbst steht am Moserbergweg in Kössen - auf österreichischer Seite, obwohl die Mehrzahl der Bahnen in Bayern liegt. Wer die Runde beginnt, startet damit faktisch in Österreich, spielt sich nach Deutschland hinein und wieder zurück - eine kleine Ironie, die zur Grundidee des Platzes passt: Die Verwaltungsgrenze bestimmt nicht, wo die eigentliche Runde beginnt oder endet."),
    block("Der Platz selbst ist dabei keine flache Resort-Runde. Höhenunterschiede und Hanglagen prägen mehrere Bahnen, dazu kommen Biotope und Gräben als natürliche Hindernisse. Wer zum ersten Mal hier spielt, profitiert mehr von einer durchdachten Strategie als von reiner Länge – die Landesgrenze ist damit nicht das Einzige auf dieser Runde, das man nicht unterschätzen sollte."),
    block("WARUM DAS MEHR IST ALS EIN KURIOSUM", "h2"),
    block("Grenzüberschreitende Sehenswürdigkeiten gibt es viele – Brücken, Wanderwege, Aussichtspunkte. Ein Golfplatz, der eine internationale Grenze als Teil seines Spielflusses integriert, bleibt selten. Genau deshalb gehört Reit im Winkl-Kössen eher in eine Reisegeschichte als in einen reinen Platzführer: Die Runde selbst wird zum Beleg dafür, dass diese Region – Chiemgau und Kaiserwinkl – landschaftlich nie wirklich zwei Länder war, sondern eine zusammenhängende alpine Landschaft mit einer Verwaltungsgrenze mittendurch."),
    block("Das Kaiserwinkl auf österreichischer und der Chiemgau auf bayerischer Seite bilden zusammen eine der dichtesten Golf- und Bergregionen im gesamten Alpenraum – mit Reit im Winkl-Kössen als vielleicht deutlichstem Beweis dafür, dass diese Grenze eher verwaltungstechnisch als landschaftlich existiert."),
    block("Wer den Platz spielen will, braucht dafür kein Sonderarrangement: Gastspiel ist möglich, die Saison reicht von April bis in den frühen November hinein. Das macht die grenzüberschreitende Runde nicht zu einem einmaligen Erlebnis für Insider, sondern zu einem regulären Teil eines Chiemgau- oder Kaiserwinkl-Trips."),
    block("International gibt es nur eine Handvoll Golfplätze, die überhaupt über eine Landesgrenze hinweg gebaut wurden – die meisten davon außerhalb Europas. Innerhalb der EU, mit offener Grenze und freiem Personenverkehr im Schengen-Raum, bleibt Reit im Winkl-Kössen nach verbreiteter Einschätzung ein Einzelfall: ein Platz, der von der Reisefreiheit zwischen Deutschland und Österreich ebenso profitiert wie von seiner Landschaft. Das mag administrativ klingen, verändert aber tatsächlich, wie sich die Runde anfühlt: kein Grenzkontrollpunkt, kein Umweg, keine Formalität - nur eine Bahn, die in einem Land beginnt und im nächsten weiterspielt."),
    block("Der interessanteste Teil dieser Runde ist nicht der Score. Es ist der Moment, in dem man merkt, dass man gerade das Land gewechselt hat, ohne es zu bemerken.", "pullQuote"),
    block("Wer nach Reit im Winkl oder Kössen kommt, um diesen Platz zu spielen, bekommt am Ende beides: 18 Löcher Golf und eine der wenigen Gelegenheiten, eine internationale Grenze zu überqueren, ohne dafür jemals den Golfwagen zu verlassen.")
  ]
};

const story48Hours = {
  _id: STORY.reitImWinkl48Hours,
  _type: "story",
  title: "48 HOURS BETWEEN FAIRWAYS AND ALPS.",
  slug: slugOf("48-hours-between-fairways-and-alps"),
  format: "48-hours",
  kicker: "BAYERN / CHIEMGAU",
  deck: "Ankunft, eine Golfrunde über zwei Länder, eine Alm über den Wolken – eine kompakte Reise durch Reit im Winkl, die STAY, PLAY, DO und EAT tatsächlich verbindet.",
  publishedAt: "2026-09-07T08:00:00.000Z",
  readingTime: 4,
  featured: true,
  aroundSelected: false,
  priority: 68,
  related: [
    ref(EXISTING_PLACE.gutSteinbach),
    ref(EXISTING_PLACE.golfclubReitImWinkl),
    ref(EXISTING_PLACE.winklmoosAlm),
    ref(EXISTING_PLACE.grillhausAlteSchmiede),
    ref(EXISTING_PLACE.restaurantHeimat),
    ref(EXISTING_DEST.reitImWinkl)
  ],
  seoTitle: "48 Stunden in Reit im Winkl: Stay, Play, Do, Eat | AROUND",
  seoDescription: "Eine kompakte 48-Stunden-Reise durch Reit im Winkl und den Chiemgau: Gut Steinbach, Golfclub Reit im Winkl-Kössen, Winklmoos-Alm und regionale Küche.",
  body: [
    block("Manche Trips brauchen zehn Tage, um sich zu entfalten. Reit im Winkl und der Chiemgau brauchen keine zehn Tage – zwei reichen, um Stay, Play, Do und Eat tatsächlich zusammenzubringen, ohne dass sich der Trip gehetzt anfühlt."),
    block("ANKUNFT: GUT STEINBACH", "h2"),
    block("Der Ausgangspunkt ist Gut Steinbach, ein alpines Refugium aus Holz, Landwirtschaft, Chalets und Spa – kein klassisches Golfhotel, sondern eine Basis, von der aus sich der ganze Chiemgau erschließen lässt. Das Gut liegt auf einem weitläufigen Gelände mit Zimmern, Suiten im Haupthaus und freistehenden Chalets rund um einen Naturweiher. Wer am Nachmittag ankommt, hat genug Zeit, im hauseigenen Heimat & Natur SPA anzukommen, bevor am Abend das erste Essen ansteht. Wer lieber sofort loslegt, nutzt den ersten Nachmittag für einen Spaziergang rund um den Naturweiher - das Gut selbst ist groß genug, um schon vor der ersten geplanten Aktivität ein Gefühl für die Umgebung zu bekommen."),
    block("Das rund 2.000 Quadratmeter große Heimat & Natur SPA mit Indoorpool, Saunen und Dampfbad liegt direkt auf dem Gut – kein zusätzlicher Programmpunkt, sondern Teil desselben Grundstücks. Für den Ankunftstag reicht das völlig: ankommen, den ersten Blick auf die Berge werfen, den Rest des Tages der Reise selbst überlassen."),
    block("TAG 1: DIE RUNDE, DIE ZWEI LÄNDER VERBINDET", "h2"),
    block("Der erste volle Tag gehört dem Golfclub Reit im Winkl-Kössen – 18 Bahnen, zwölf davon in Bayern, sechs in Tirol, nach eigener und vielfach bestätigter Aussage der einzige grenzüberschreitende Golfplatz Europas. Golf am Vormittag heißt hier nicht nur eine Runde spielen, sondern zwischen zwei Ländern und zwei alpinen Kulissen zu wechseln, ohne dafür das Auto zu bewegen."),
    block("Wer sich vor der Runde einspielen will, findet auf der Anlage Driving Range, Putting Green und Übungsbunker – keine Notwendigkeit, aber ein guter Grund, eine halbe Stunde früher anzureisen, statt direkt vom Auto auf das erste Tee zu wechseln."),
    block("Am Abend übernimmt die Grillhaus Alte Schmiede im Ortskern von Reit im Winkl – ein historisches Gebäude mit Grillküche und regionalen Produkten, ein bewusster Kontrast zum Golftag: weniger Anlage, mehr Ort. Wer lieber am Gut bleibt, findet mit Restaurant HEIMAT die Alternative direkt vor der eigenen Zimmertür."),
    block("TAG 2: HINAUF AUF DIE WINKLMOOS-ALM", "h2"),
    block("Der zweite Tag verlässt das Fairway komplett. Die Winklmoos-Alm liegt auf rund 1.170 Metern und eröffnet ein anderes Chiemgau: Almwiesen, Weitblick und, je nach Jahreszeit, Wandern oder Skifahren. Sie lässt sich als halber Tag genauso gut nutzen wie als ganzer, was sie zu einem der flexibelsten Programmpunkte der Region macht."),
    block("Wer die Zeit hat, verlängert den Abend über den Sonnenuntergang hinaus: Die Winklmoos-Alm gehört seit 2018 zu den zertifizierten Dark-Sky-Parks der Alpen, und an klaren Abenden lohnt sich ein letzter Blick nach oben, bevor es zurück ins Tal geht."),
    block("Für den Abend bleibt die Wahl bewusst offen: zurück nach Gut Steinbach für ein ruhiges Dinner im Restaurant HEIMAT, oder ein letzter Halt in einer der Almwirtschaften rund um die Winklmoos-Alm, bevor der zweite Tag ausklingt."),
    block("WARUM DIESE 48 STUNDEN FUNKTIONIEREN", "h2"),
    block("Was diesen kompakten Trip von einer bloßen Liste an Programmpunkten unterscheidet, ist, wie nah Stay, Play, Do und Eat hier beieinanderliegen. Kein Programmpunkt braucht eine lange Anfahrt, kein Tag fühlt sich wie ein separates Ausflugsziel an – alles gehört sichtbar zur selben Landschaft."),
    block("Der Trip funktioniert dabei bewusst ohne festen Ablaufplan. Golfrunde und Almtag lassen sich auch tauschen, je nach Wetter oder Tagesform – beide Programmpunkte stehen für sich, keiner hängt von einer festen Uhrzeit ab."),
    block("Wer noch einen dritten Tag anhängt, kann die Region in eine andere Richtung erweitern – Richtung Chiemsee oder weiter nach Tirol hinein. Für den reinen 48-Stunden-Rahmen reicht aber genau das: eine Nacht ankommen, zwei Tage füllen, vier Kategorien abdecken."),
    block("Ein guter 48-Stunden-Trip beweist sich nicht daran, wie viel er zeigt, sondern daran, wie wenig er dafür bewegen muss.", "pullQuote"),
    block("Reit im Winkl und der Chiemgau brauchen für diesen Beweis nicht mehr als zwei Tage: eine Nacht ankommen, ein Tag Golf über zwei Länder, ein Tag Alm über dem Tal – und dazwischen genug gutes Essen, um den Rest zu vergessen.")
  ]
};

const storyWinklmoosNights = {
  _id: STORY.winklmoosAlmNights,
  _type: "story",
  title: "WENN DIE ALM DUNKEL WIRD.",
  slug: slugOf("wenn-die-alm-dunkel-wird"),
  format: "local-knowledge",
  kicker: "CHIEMGAU / ALPEN",
  deck: "Die Winklmoos-Alm ist tagsüber ein Wander- und Weitblickziel. Was viele nicht wissen: Der eigentlich beste Moment beginnt erst, wenn die Sonne weg ist.",
  publishedAt: "2026-09-09T08:00:00.000Z",
  readingTime: 4,
  featured: false,
  aroundSelected: false,
  priority: 58,
  related: [ref(EXISTING_PLACE.winklmoosAlm), ref(EXISTING_PLACE.sternenparkPlatzl), ref(EXISTING_DEST.reitImWinkl)],
  seoTitle: "Winklmoos-Alm bei Nacht: Sternenpark im Chiemgau | AROUND",
  seoDescription: "Die Winklmoos-Alm ist seit 2018 zertifizierter Dark Sky Park - der erste in den Alpen. Warum der beste Moment erst nach Sonnenuntergang beginnt.",
  body: [
    block("Die meisten, die auf die Winklmoos-Alm fahren, kommen wegen der Aussicht bei Tag – wegen der Almwiesen, der Wanderwege, dem Blick auf die Chiemgauer Alpen. Was die wenigsten wissen: Der eigentlich beste Grund, hier zu bleiben, zeigt sich erst, wenn die Sonne weg ist."),
    block("EIN DUNKLER FLECK, DEN MAN SELTEN FINDET", "h2"),
    block("Seit 2018 trägt die Winklmoos-Alm die Zertifizierung als International Dark Sky Park, vergeben von DarkSky International (vormals International Dark-Sky Association) - vierter anerkannter Sternenpark Deutschlands und der erste in den gesamten Alpen. Das ist keine touristische Übertreibung, sondern das Ergebnis jahrelanger Arbeit: Almbauern, Hoteliers und Anwohner haben sich in einer Almgenossenschaft zusammengeschlossen und die Beleuchtung im gesamten Gebiet so umgerüstet, dass sie den strengen Vorgaben der Zertifizierung entspricht."),
    block("Damit die Zertifizierung überhaupt möglich wurde, mussten Leuchtkörper auf der gesamten Alm ausgetauscht werden - warmweißes statt bläuliches Licht, nach unten statt nach oben gerichtet, nur dort, wo tatsächlich Licht gebraucht wird. Das ist keine einmalige Maßnahme, sondern eine dauerhafte Verpflichtung aller Betriebe auf der Alm, diesen Standard auch nach der Zertifizierung einzuhalten."),
    block("WARUM DIE LAGE DEN UNTERSCHIED MACHT", "h2"),
    block("Die nächsten größeren Städte - Salzburg, Rosenheim, Traunstein - liegen alle 30 bis 70 Kilometer entfernt. Genug Distanz, um Lichtverschmutzung fernzuhalten, aber nah genug, dass man abends noch hinauffahren kann. Das Almplateau selbst liegt auf rund 1.170 Metern, umgeben von einer der größten zusammenhängenden Almflächen der Alpen - einer offenen, weiten Fläche, die den Blick nicht durch Bäume oder Grate einschränkt."),
    block("WAS MAN SIEHT, WENN NIEMAND SONST DA IST", "h2"),
    block("An klaren, mondlosen Nächten sind hier mehrere tausend Sterne mit bloßem Auge sichtbar - in München wären es kaum 500. Wer genau hinschaut, kann sogar die Andromeda-Galaxie erkennen, rund 2,5 Millionen Lichtjahre entfernt. Das ist ein Unterschied, den man erst versteht, wenn man selbst oben steht: Die Alm, die tagsüber ein Ausflugsziel unter vielen ist, wird nachts zu einem der wenigen Orte in Bayern, an denen der Himmel noch das tut, wofür er gemacht ist."),
    block("Viele der bekanntesten Sternenparks weltweit liegen in entlegenen Wüsten oder auf abgelegenen Inseln, weit weg von jeder Infrastruktur. Die Winklmoos-Alm liegt dagegen mit dem Auto erreichbar mitten im Alltag einer belebten Ferienregion - ein seltener Fall, in dem echte Dunkelheit und touristische Erreichbarkeit sich nicht ausschließen."),
    block("Im Winter kommt ein weiterer Effekt hinzu: Schnee reflektiert das wenige vorhandene Licht zusätzlich, wodurch sich die Konturen der Landschaft selbst in mondlosen Nächten noch abzeichnen - ein Effekt, den man im Sommer auf der offenen Almfläche in dieser Form nicht bekommt."),
    block("DER RUHIGERE TEIL DES TAGES", "h2"),
    block("Das eigentlich Interessante an der Winklmoos-Alm bei Nacht ist weniger das Programm als das Gegenteil davon: Es gibt keins. Kein Wanderweg, den man abgehen muss, keine Bergbahn, die noch fährt, keine Einkehr, die noch geöffnet hat. Nur die Fläche, die Stille und der Himmel. Für einen Trip, der tagsüber ohnehin schon aus Golf, Landschaft und Bewegung besteht, ist das der seltene Moment, in dem nichts mehr geplant werden muss."),
    block("Wer das selbst erleben will, braucht keine Ausrüstung und keine Anmeldung - nur eine klare Nacht, möglichst ohne Mond, und etwas Geduld, bis sich die Augen an die Dunkelheit gewöhnt haben. Das ist der ganze Aufwand."),
    block("Für AROUND gehört diese Geschichte deshalb nicht in eine Liste mit Freizeittipps, sondern in die Kategorie der Orte, die man erst dann wirklich versteht, wenn man sie zur falschen Tageszeit besucht."),
    block("Die Alm bei Tag zeigt einem die Landschaft. Die Alm bei Nacht zeigt einem, wie viel Landschaft eigentlich noch übrig ist, wenn man das Licht wegnimmt.", "pullQuote"),
    block("Wer die Winklmoos-Alm nur tagsüber besucht, hat die Hälfte gesehen. Die andere Hälfte beginnt, wenn die letzten Wanderer den Parkplatz verlassen haben - und braucht nichts weiter als eine klare Nacht und die Bereitschaft, noch einmal hinaufzufahren.")
  ]
};

const storyCynthiaDye = {
  _id: STORY.cynthiaDyeMcGarey,
  _type: "story",
  title: "DIE FRAU, DIE WEST CLIFFS NICHT ÜBERBAUEN WOLLTE.",
  slug: slugOf("die-frau-die-west-cliffs-nicht-ueberbauen-wollte"),
  format: "people-to-know",
  kicker: "PORTUGAL / GOLFARCHITEKTUR",
  deck: "Cynthia Dye McGarey ist in einer der einflussreichsten Familien der Golfarchitektur aufgewachsen - und hat daraus eine eigene, zurückhaltendere Handschrift entwickelt. West Cliffs ist ihr bisher deutlichstes Beispiel.",
  publishedAt: "2026-09-11T08:00:00.000Z",
  readingTime: 5,
  featured: false,
  aroundSelected: false,
  priority: 60,
  related: [ref(PERSON.cynthiaDyeMcGarey), ref(EXISTING_PLACE.westCliffs), ref(EXISTING_DEST.silverCoast)],
  seoTitle: "Cynthia Dye McGarey: Die Architektin hinter West Cliffs | AROUND",
  seoDescription: "Cynthia Dye McGarey wuchs in der Dye-Familie der Golfarchitektur auf und entwickelte mit der Dye Designs Group eine eigene, zurückhaltendere Handschrift - sichtbar bei West Cliffs.",
  body: [
    block("Es gibt Golfplatzarchitekten, die mit einem eigenen Namen beginnen. Cynthia Dye McGarey begann mit einem, den die Golfwelt bereits kannte - und musste selbst entscheiden, was sie damit macht."),
    block("AUFGEWACHSEN IM BÜRO DER FAMILIE", "h2"),
    block("Cynthia Dye McGarey wurde in Urbana, Ohio, geboren, in eine Familie hinein, die die amerikanische Golfarchitektur über Jahrzehnte mitgeprägt hat. Ihr Vater Roy Anderson Dye und ihr Onkel Pete Dye zählen zu den bekanntesten Golfplatzarchitekten des 20. Jahrhunderts; ihr Großvater Pink Dye hatte bereits 1922 auf einem Stück Familienland einen ersten Neun-Loch-Platz gebaut, aus dem später der Urbana Country Club wurde. Als Kind saß Cynthia nach der Schule im Büro der Familie, kolorierte Karten und zeichnete Platzlayouts von Hand - lange bevor sie selbst professionell entwarf."),
    block("EIN EIGENER WEG, KEIN KOPIEREN", "h2"),
    block("Ihre eigentliche Karriere begann nicht im Golfbau, sondern in der Landschaftsgestaltung in Phoenix, Arizona. Erst 1988 wechselte sie als Vollzeit-Beraterin ins Familienunternehmen und arbeitete knapp elf Jahre lang international als Design-Consultant. 2001 gründete sie mit der Dye Designs Group ihre eigene Firma - nicht um die Familienphilosophie zu kopieren, sondern um eine eigene Interpretation davon umzusetzen. Ihr erster eigener Platz, der White Horse Golf Club im US-Bundesstaat Washington, eröffnete 2007 und wurde von Golf Digest in die Liste der besten neuen Plätze des Jahres aufgenommen."),
    block("Zum Portfolio der Dye Designs Group zählen seither Projekte auf mehreren Kontinenten: der Dreamland Golf Club in Baku, Aserbaidschan, der Ferrum Country Club in Südkorea, der Foison Golf Club in China und das Sheraton New Caledonia Deva Golf Resort im Pazifik. West Cliffs an Portugals Silberküste bleibt darunter das Projekt, an dem sich ihre eigene Designsprache am klarsten zeigt."),
    block("Innerhalb der Familie gilt sie inzwischen als dritte Generation eines Golfarchitektur-Betriebs, der mit ihrem Großvater begann und über ihren Vater und Onkel zu ihr selbst führte - eine Kontinuität, die in der Golfarchitektur selten ist, aber auch eine Erwartungshaltung mit sich bringt, der sie sich nicht einfach unterworfen hat."),
    block("WARUM WENIGER TUN MEHR VERLANGT", "h2"),
    block("Auf ihrem offiziellen Profil bei der American Society of Golf Course Architects (ASGCA), deren Mitglied sie ist, beschreibt Cynthia Dye McGarey ihren Ansatz als kosteneffizientes und umweltbewusstes Design, das Architektur und Strategie durch durchdachte Prinzipien stärkt - nicht durch aufwendige Eingriffe in die Landschaft. Diese Selbstbeschreibung liest sich unspektakulär, ist im Golfplatzbau aber eine bewusste Abgrenzung: Wer Kosteneffizienz und Umweltverträglichkeit als Designprinzip voranstellt, verzichtet auf die aufwendigen, spektakulären Erdbewegungen, mit denen sich viele moderne Anlagen präsentieren."),
    block("Genau diese Haltung zeigt sich bei West Cliffs an Portugals Silberküste: Dünen, Küstenvegetation und Kiefern blieben erhalten, natürliche Sandflächen wurden Teil des Spiels statt eingeebnet zu werden."),
    block("WEST CLIFFS ALS BEWEIS", "h2"),
    block("Dass ausgerechnet ein Platz, der bewusst zurückhaltend gestaltet wurde, seit seiner Eröffnung 2017 mit World's Best New Course, einer Top-2-Platzierung in Portugal und der Auszeichnung als Golf Development of the Year prämiert wurde, ist kein Widerspruch - es ist die eigentliche Pointe. Zurückhaltung im Golfplatzbau verlangt mehr Entscheidungen, nicht weniger: Was stehen bleibt, muss ebenso bewusst gewählt werden wie das, was gebaut wird."),
    block("Sie gehört damit, gemeinsam mit Architektinnen wie Jan Bel Jan und Vicki Martz, zu einer Generation weiblicher Golfplatzarchitektinnen, die nach der Pionierin Alice Dye - Pete Dyes Ehefrau und langjährige Mitgestalterin seiner Plätze - eigenständige Karrieren in einem historisch stark männlich geprägten Berufsfeld aufgebaut haben. Diese Generation hat gezeigt, dass sich die Handschrift eines berühmten Namens erweitern lässt, ohne ihn zu verwässern - eine Balance, die in einer Branche mit wenigen großen Familiennamen nicht selbstverständlich ist."),
    block("Man kann eine Familienphilosophie erben. Man kann sie aber nur dann wirklich zu seiner eigenen machen, wenn man auch weiß, was man bewusst nicht übernimmt.", "pullQuote"),
    block("Sie ist heute Mitglied der ASGCA und der European Institute of Golf Course Architects (EIGCA) und arbeitet weiterhin an internationalen Projekten - von Aserbaidschan bis Südkorea. West Cliffs aber bleibt vielleicht die deutlichste Antwort auf die Frage, was es bedeutet, in eine der einflussreichsten Familien der Golfarchitektur hineingeboren zu werden und trotzdem etwas Eigenes daraus zu machen: nicht mehr zu bauen, sondern genauer hinzusehen, bevor man überhaupt anfängt.")
  ]
};

const storyGutSteinbach8080 = {
  _id: STORY.gutSteinbach8080,
  _type: "story",
  title: "80 KILOMETER. 80 PROZENT.",
  slug: slugOf("80-kilometer-80-prozent"),
  format: "the-good-stuff",
  kicker: "CHIEMGAU / KULINARIK",
  deck: "Wenn Regionalität keine Marketing-Floskel ist, sondern eine Zahl: wie Gut Steinbach und Restaurant HEIMAT ihre eigene Definition von Regionalität tatsächlich einhalten.",
  publishedAt: "2026-09-13T08:00:00.000Z",
  readingTime: 4,
  featured: false,
  aroundSelected: false,
  priority: 62,
  related: [ref(EXISTING_PLACE.gutSteinbach), ref(EXISTING_PLACE.restaurantHeimat), ref(EXISTING_DEST.reitImWinkl)],
  seoTitle: "Gut Steinbach: Das 80:80-Credo von Restaurant HEIMAT | AROUND",
  seoDescription: "80 Prozent aller Zutaten aus maximal 80 Kilometern: wie Küchenchef Achim Hack im Restaurant HEIMAT auf Gut Steinbach Regionalität nachprüfbar macht.",
  body: [
    block("80 Prozent aller Lebensmittel aus maximal 80 Kilometern Entfernung. Das ist kein Slogan, sondern eine Zahl, an der sich Küchenchef Achim Hack im Restaurant HEIMAT auf Gut Steinbach tatsächlich messen lässt. Für ein Wort wie „regional“, das in der Gastronomie beinahe bedeutungslos geworden ist, ist das ein ungewöhnlich konkretes Versprechen."),
    block("EINE ZAHL STATT EINES ADJEKTIVS", "h2"),
    block("Das 80:80-Credo von Gut Steinbach lässt sich nicht schönreden: 80 Kilometer sind eine harte Grenze, keine ungefähre Richtung. Was diese Distanz nicht hergibt, kommt nicht auf den Teller - unabhängig davon, wie gut es sich in der Küche gemacht hätte. Diese Selbstverpflichtung wurde 2021 mit dem Grünen Stern des Guide Michelin honoriert, einer Auszeichnung, die explizit für nachhaltige Gastronomie vergeben wird, nicht für klassische kulinarische Kriterien."),
    block("Gut Steinbach selbst gehört der Relais & Châteaux-Vereinigung an, einem internationalen Zusammenschluss unabhängiger Hotels und Restaurants mit eigenem Qualitätsanspruch. Für ein Haus, das ohnehin schon an strengen externen Kriterien gemessen wird, ist das 80:80-Credo eine zusätzliche, selbst auferlegte Messlatte - keine, die von außen verlangt wurde."),
    block("WAS VOM EIGENEN GUT KOMMT", "h2"),
    block("Ein Teil der Antwort auf die 80-Kilometer-Frage liegt direkt auf dem Gelände von Gut Steinbach: Kräuter aus dem eigenen Garten, Wild aus eigener Zucht. Der Betrieb selbst ist als Bioland-Betrieb zertifiziert - eine weitere Zahl, die sich überprüfen lässt, statt sich auf ein Gefühl zu verlassen. Wer im Restaurant HEIMAT isst, bekommt laut eigener Aussage des Hauses genau erklärt, woher das kommt, was auf dem Teller liegt: aus dem eigenen Garten, aus eigener Jagd, von Erzeugern aus der unmittelbaren Umgebung."),
    block("Diese Transparenz funktioniert nur, wenn sie sich nachvollziehen lässt: Wild aus eigener Zucht bedeutet, dass die Herkunft nicht über Zwischenhändler oder anonyme Lieferketten läuft, sondern direkt auf dem Gut nachweisbar ist. Für Gäste heißt das, dass eine Frage wie „woher kommt das“ eine konkrete Antwort bekommt, statt einer ausweichenden."),
    block("Serviert wird das Ganze auf einer Terrasse mit Panoramablick auf die umliegenden Berge - kein Zufall, sondern Teil desselben Grundgedankens: Die Küche soll nicht von der Landschaft ablenken, sondern zu ihr passen."),
    block("WARUM DAS FÜR EINEN GOLFTRIP WICHTIG IST", "h2"),
    block("Ein gutes Golf-Basecamp braucht mehr als ein gutes Bett und einen kurzen Weg zum Abschlag. Es braucht einen Grund, abends zu bleiben, statt woanders essen zu gehen. Ein Küchenkonzept, das sich an einer nachprüfbaren Zahl statt an einem vagen Regionalitätsversprechen orientiert, gibt genau diesen Grund - und macht aus einem Golf-Stopover eine Destination, an der das Essen ebenso Teil der Erinnerung wird wie die Runde davor."),
    block("80 Kilometer sind in einer Bergregion wie dem Chiemgau kein beliebiger Radius. Sie reichen aus, um saisonale, alpine Landwirtschaft einzuschließen, aber nicht so weit, dass daraus ein beliebiges „regional“ im Sinne von „irgendwo in Süddeutschland“ wird. Die Grenze ist eng genug, um tatsächlich etwas auszuschließen."),
    block("Bewusst ausgeklammert bleiben an dieser Stelle Preise und die aktuelle Menüführung - beides ändert sich mit der Saison und sagt wenig über das eigentliche Prinzip dahinter aus. Was bleibt, ist die Idee selbst: eine Zahl statt eines Versprechens."),
    block("Andere Häuser in der Region könnten dieselbe Idee übernehmen - eine öffentlich kommunizierte, nachprüfbare Kennzahl statt eines weichen Regionalitätsversprechens. Dass bisher wenige das tun, macht Gut Steinbach nicht zu einem Einzelfall aus Zufall, sondern zu einem, der zeigt, wie viel Spielraum in diesem Bereich noch ungenutzt bleibt."),
    block("Regionalität ist leicht zu behaupten und schwer zu belegen. 80 Kilometer sind eine Zahl, die man nachmessen kann.", "pullQuote"),
    block("Was Gut Steinbach und Restaurant HEIMAT damit vorführen, ist keine neue Idee - Regionalität als Küchenprinzip gibt es lange. Neu ist die Konsequenz, mit der aus einem weichen Versprechen eine harte Zahl gemacht wurde. Für AROUND ist genau das der Unterschied zwischen einem Hotel mit gutem Restaurant und einem Ort, an dem das Essen selbst zum Reisegrund wird.")
  ]
};

const storyEstoniaNext = {
  _id: STORY.estoniaNextRoadTrip,
  _type: "story",
  title: "IS ESTONIA GOLF'S NEXT GREAT ROAD TRIP?",
  slug: slugOf("is-estonia-golfs-next-great-road-trip"),
  format: "next",
  kicker: "ESTONIA / GOLF",
  deck: "Nicht die Frage, wie eine Golfreise durch Estland funktioniert - sondern warum diese Art von Destination als Nächstes wichtig werden könnte.",
  publishedAt: "2026-09-16T08:00:00.000Z",
  readingTime: 4,
  featured: false,
  aroundSelected: false,
  priority: 55,
  related: [ref(EXISTING_DEST.tallinn), ref(EXISTING_DEST.parnu), ref(EXISTING_PLACE.parnuBayGolf)],
  seoTitle: "Estland als nächste Golfdestination Europas? | AROUND",
  seoDescription: "Ein editorielles Argument statt Trendprognose: Warum Tallinn, Pärnu und Pärnu Bay Golf Links golferisch und kulturell mehr Substanz haben, als der Ruf Estlands vermuten lässt.",
  body: [
    block("TALLINN. PÄRNU. LINKS GOLF. REPEAT. hat gezeigt, wie eine kompakte Golfreise durch Estland funktioniert. Die interessantere Frage ist eine andere: Warum sollte ausgerechnet diese Art von Destination als Nächstes wichtig werden - für Golfreisende, die die üblichen südeuropäischen Ziele bereits kennen?"),
    block("KOMPAKTHEIT ALS ARGUMENT", "h2"),
    block("Die meisten etablierten europäischen Golfdestinationen sind groß gedacht: viele Plätze, viele Hotels, ein ganzes Küstenband voller Optionen. Estland bietet das Gegenteil - eine mittelalterliche Hauptstadt, eine Kurstadt und einen einzigen bemerkenswerten Linkskurs, alles innerhalb von zwei Autostunden. Für Reisende, die weniger Auswahl, aber mehr Kohärenz suchen, ist das kein Nachteil, sondern der eigentliche Reiz."),
    block("Diese Kompaktheit hat einen praktischen Vorteil, den größere Destinationen strukturell nicht bieten können: Es gibt kaum Entscheidungsdruck. Wer nach Portugal oder Spanien zum Golfen reist, wählt zwangsläufig zwischen Dutzenden Plätzen und Regionen. Wer nach Estland reist, trifft diese Entscheidung praktisch nicht - die Substanz liegt bereits fest, nicht verstreut."),
    block("STADT UND KÜSTE, NICHT NUR KÜSTE", "h2"),
    block("Was Estland von reinen Küsten-Golfzielen unterscheidet, ist Tallinn: eine seit 1997 als UNESCO-Welterbe gelistete Altstadt, die einer Golfreise eine kulturelle Dimension gibt, die viele etablierte Ziele so nicht bieten. Pärnu wiederum trägt seit 1996 offiziell den Titel „Estlands Sommerhauptstadt“ und eine Bäderkultur, die bis 1838 zurückreicht - Golf trifft hier auf eigenständige Reiseziele, nicht auf reine Resort-Infrastruktur."),
    block("Tallinns Flughafen gilt zudem als einer der am besten angebundenen und kompaktesten Europas, was die Anreise selbst zu einem kleineren Hindernis macht, als der geografische Abstand vermuten lässt."),
    block("Estlands Identität ist dabei eher nordisch als kontinentaleuropäisch geprägt - geografisch und kulturell näher an Finnland und Skandinavien als an den etablierten Golfdestinationen Mittel- und Südeuropas. Das erklärt auch, warum sich eine Reise hierher anders anfühlt als ein weiterer Trip an eine der immer gleichen Küsten."),
    block("EIN LINKSKURS, DER FÜR SICH STEHT", "h2"),
    block("Der Pärnu Bay Golf Links ist nach eigener und vielfach zitierter Beschreibung der erste echte Linkskurs des Baltikums - kein Nebenprodukt eines größeren Resorts, sondern ein eigenständiges golferisches Argument. Das ist relevant für die Frage nach der Zukunft: Eine Destination, die golferisch etwas Eigenständiges zu bieten hat, funktioniert unabhängig von kurzfristigen Trends."),
    block("Ein einzelner herausragender Platz reicht selten aus, um eine ganze Destination zu tragen - aber er reicht aus, um eine Destination erst überhaupt in Betracht zu ziehen. Genau diese Funktion erfüllt der Pärnu Bay Golf Links für Estland als golferisches Reiseziel."),
    block("VORSICHT VOR DER GROSSEN ERZÄHLUNG", "h2"),
    block("Es wäre leicht, an dieser Stelle große Worte zu bemühen - Estland als kommendes Golfziel, als nächste Boomregion. Belastbare Zahlen dafür liegen nicht vor, und AROUND schreibt keine Prognosen, die sich nicht belegen lassen. Was sich dagegen belegen lässt: Die golferische und kulturelle Substanz ist bereits vorhanden. Was noch fehlt, ist Aufmerksamkeit - nicht Substanz."),
    block("Der Titel dieser Story ist bewusst eine Frage, keine Behauptung. Genau das unterscheidet ein „Next“-Stück von einer Ranking-Liste: Es öffnet ein Argument, statt ein Ergebnis zu verkünden."),
    block("Nicht jede interessante Destination muss laut ankündigen, dass sie kommt. Manche liegen einfach schon da und warten darauf, bemerkt zu werden.", "pullQuote"),
    block("Ob Estland tatsächlich zur nächsten relevanten Golfdestination Europas wird, lässt sich heute nicht seriös vorhersagen. Was sich mit Sicherheit sagen lässt: Wer auf kompakte Reisen, kulturelle Substanz und einen eigenständigen Linkskurs Wert legt, findet in Tallinn, Pärnu und Pärnu Bay bereits heute mehr, als der Ruf des Landes als Golfziel vermuten lässt. Wer heute bucht, bucht keine etablierte Marke, sondern eine Wette auf eine Region, die golferisch bereits mehr zu bieten hat, als ihr öffentliches Bild vermuten lässt - das allein macht die Reise interessant, unabhängig davon, ob daraus je ein großer Trend wird.")
  ]
};

const newStories = [
  storyTwoCountries,
  story48Hours,
  storyWinklmoosNights,
  storyCynthiaDye,
  storyGutSteinbach8080,
  storyEstoniaNext
];

type LogFn = (line: string) => void;

export function EditorialPilotV02SeedTool() {
  const client = useClient({apiVersion: "2026-03-01"}).withConfig({useCdn: false});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const addLog: LogFn = line => setLog(prev => [...prev, line]);

  async function upsertPerson(doc: Record<string, unknown>, addLogFn: LogFn) {
    const id = doc._id as string;
    const before = await client.fetch(`*[_id == $id][0]{"hasBio": defined(bio)}`, {id});
    const bioAlreadyPresent = Boolean(before?.hasBio);
    await client.createIfNotExists(doc as any);
    const {_id, _type, bio, ...fields} = doc;
    await client.patch(id).set(fields).commit();
    // bio uses setIfMissing for the same reason Story body does - never
    // overwrite something a human may have since written/enriched with a
    // real portrait or edited text.
    await client.patch(id).setIfMissing({bio}).commit();
    addLogFn(
      bioAlreadyPresent
        ? `⚠ person „${doc.title}“ (${id}): Bio war bereits gesetzt - NICHT überschrieben.`
        : `✓ person „${doc.title}“ (${id}) angelegt, Bio geschrieben.`
    );
  }

  async function upsertStory(doc: Record<string, unknown>, addLogFn: LogFn) {
    const id = doc._id as string;
    const before = await client.fetch(`*[_id == $id][0]{"hasBody": defined(body), "hasHero": defined(heroImage)}`, {id});
    const bodyAlreadyPresent = Boolean(before?.hasBody);
    const heroAlreadyPresent = Boolean(before?.hasHero);
    await client.createIfNotExists(doc as any);
    const {_id, _type, body, heroImage, ...fields} = doc;
    await client.patch(id).set(fields).commit();
    // body AND heroImage are intentionally setIfMissing-only: a human may
    // enrich either with rights-cleared editorial media later - a reseed
    // must never wipe that. Story 7 seeds an already rights-cleared,
    // already-uploaded AROUND photo as its initial heroImage (see
    // EXISTING_ASSET above); every other Story has no heroImage in its
    // document object, so this call only ever touches `body` for those.
    const protectedFields: Record<string, unknown> = {body};
    if (heroImage) protectedFields.heroImage = heroImage;
    await client.patch(id).setIfMissing(protectedFields).commit();
    addLogFn(
      bodyAlreadyPresent
        ? `⚠ story „${doc.title}“ (${id}): Body war bereits gesetzt - NICHT überschrieben.`
        : `✓ story „${doc.title}“ (${id}) angelegt, Body geschrieben.`
    );
    if (heroImage) {
      addLogFn(
        heroAlreadyPresent
          ? `⚠ story „${doc.title}“ (${id}): heroImage war bereits gesetzt - NICHT überschrieben.`
          : `✓ story „${doc.title}“ (${id}): heroImage gesetzt (bereits vorhandenes, rechtlich geklärtes AROUND-Foto).`
      );
    }
  }

  async function runSeed() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setError("");
    setLog([]);
    try {
      addLog("→ Person: Cynthia Dye McGarey …");
      await upsertPerson(cynthiaDyeMcGareyPerson, addLog);

      addLog("→ Stories 7–12 …");
      for (const doc of newStories) await upsertStory(doc, addLog);

      addLog("ℹ Keine bestehenden Destinations/Places wurden angelegt oder verändert - alle Relationen referenzieren ausschließlich vorhandene Dokumente.");
      addLog("ℹ Keine neuen/externen Bilder importiert. Story 7 referenziert ein bereits vorhandenes, bereits rechtlich geklärtes AROUND-Foto (kein Upload, keine externe Quelle) - siehe docs/editorial-pilot-pack-v02/README.md und media-manifest.json für den vollständigen Rechte-Status und nächste Schritte.");
      addLog("✓ Editorial Pilot Pack v0.2 fertig (12 Stories insgesamt).");
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
        <div style={{fontSize: 12, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 18}}>AROUND · EDITORIAL PILOT PACK V0.2</div>
        <h1 style={{fontSize: "clamp(36px,6vw,74px)", lineHeight: .96, letterSpacing: "-.05em", margin: "0 0 24px"}}>SIX MORE STORIES.<br/>TWELVE IN TOTAL.</h1>
        <p style={{fontSize: 18, lineHeight: 1.5, maxWidth: 760, margin: "0 0 28px"}}>
          Legt sechs neue Stories (7–12) und eine neue Person (Cynthia Dye McGarey) an bzw. aktualisiert sie
          (deterministische IDs, kein Duplizieren). Erstellt oder verändert dabei keine bestehende Destination
          oder Place - alle Relationen referenzieren ausschließlich bereits vorhandene Dokumente über das
          kanonische <code>related[]</code>-Feld. Es wird kein neues oder externes Bild importiert - Story 7 referenziert lediglich ein bereits vorhandenes, bereits rechtlich geklärtes AROUND-Foto erneut.
        </p>
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, margin: "0 0 26px"}}>
          {["6 neue Stories", "1 neue Person", "0 neue Places", "1 wiederverwendetes Bild"].map(x => (
            <div key={x} style={{border: "1px solid #212322", padding: 16, fontWeight: 900}}>{x}</div>
          ))}
        </div>
        <button
          onClick={runSeed}
          disabled={running}
          style={{border: 0, background: "#d6ea2a", color: "#212322", fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", padding: "15px 20px", cursor: running ? "wait" : "pointer"}}
        >
          {running ? "IMPORT LÄUFT …" : done ? "NOCHMAL AKTUALISIEREN" : "EDITORIAL PILOT PACK V0.2 IMPORTIEREN"}
        </button>
        {error && <div style={{marginTop: 20, padding: 16, background: "#f55096", fontWeight: 800}}>Fehler: {error}</div>}
        <div style={{marginTop: 28, background: "#212322", color: "#f5f3ee", padding: 20, minHeight: 150, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, lineHeight: 1.7}}>
          {log.length ? log.map((line, i) => <div key={`${i}-${line}`}>{line}</div>) : <div style={{opacity: .65}}>Bereit. Noch nichts importiert.</div>}
        </div>
        {done && (
          <div style={{marginTop: 24, border: "1px solid #212322", padding: 20}}>
            <strong>Nächster Schritt:</strong>
            <div style={{marginTop: 8, lineHeight: 1.6}}>
              Bilder gemäß docs/editorial-pilot-pack-v02/media-manifest.json prüfen/beschaffen und im Studio manuell auf den
              jeweiligen Story-/Person-Dokumenten ergänzen (Hero + Gallery / Portrait). Ein erneuter Import überschreibt
              keine so ergänzten Bilder oder Body-/Bio-Texte.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
