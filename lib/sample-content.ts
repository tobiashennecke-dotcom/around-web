import type { AroundCollection, ContentCard, Destination, Place, Story } from "./types";

export const lisbon: Destination = {
  id: "destination-lisbon",
  type: "destination",
  slug: "lisbon",
  title: "Lisbon",
  kicker: "Portugal / 38.7223° N",
  description: "Atlantic golf. City nights. Food worth staying for.",
  accent: "lime",
  country: "Portugal",
  latitude: 38.7223,
  longitude: -9.1393,
  whyGo: "Lissabon funktioniert nicht nur wegen der Golfplätze. Atlantik, Architektur, Food und Stadt liegen nah genug beieinander, damit eine Runde der Anfang statt das gesamte Programm ist.",
  placeIds: ["place-oitavos", "place-prado", "place-lisbon-stay"],
  storyIds: ["story-lisbon-beyond-golf"]
};

export const places: Place[] = [
  {
    id: "place-oitavos",
    type: "place",
    slug: "oitavos-dunes",
    title: "Oitavos Dunes",
    kicker: "AROUND Selected / Cascais",
    description: "Golf zwischen Dünen, Pinien und Atlantik.",
    accent: "lime",
    destinationId: "destination-lisbon",
    placeType: "course",
    whyWeLikeIt: "Ein Platz mit Kante. Wind, Landschaft und Raum bestimmen die Runde."
  },
  {
    id: "place-prado",
    type: "place",
    slug: "prado",
    title: "Prado",
    kicker: "After 18",
    description: "Modernes Portugal ohne Folklore.",
    accent: "pink",
    destinationId: "destination-lisbon",
    placeType: "eat",
    whyWeLikeIt: "Ein Dinner, das die Reise genauso definiert wie die Runde."
  },
  {
    id: "place-lisbon-stay",
    type: "place",
    slug: "lisbon-design-stay",
    title: "Lisbon Design Stay",
    kicker: "Stay Different",
    description: "Urban, ruhig, nah genug am Abend.",
    accent: "lime",
    destinationId: "destination-lisbon",
    placeType: "stay",
    whyWeLikeIt: "Stadt statt Golfresort. Damit die Destination nicht am Clubhaus endet."
  }
];

export const stories: Story[] = [
  {
    id: "story-lisbon-beyond-golf",
    type: "story",
    slug: "warum-lissabon-mehr-ist-als-golf",
    title: "Warum Lissabon mehr ist als Golf.",
    kicker: "WORTH THE TRIP",
    description: "Eine Story über Plätze, Stadt und die Lücke dazwischen.",
    accent: "blue",
    deck: "Die interessantesten Golfreisen beginnen dort, wo der Platz nicht mehr der einzige Programmpunkt ist.",
    body: [
      "Golfreisen haben ein merkwürdiges Talent: Sie machen aus Orten manchmal nur Kulissen für Tee Times.",
      "Lissabon ist interessant, weil sich diese Logik hier leicht brechen lässt. Atlantik und Stadt liegen nah genug beieinander, dass Golf nicht jede Stunde übernehmen muss.",
      "Genau dort liegt die Produktidee von AROUND: Ein Artikel endet nicht nach dem letzten Absatz. Er öffnet Orte, Menschen und Dinge, die man speichern und weiterverfolgen kann."
    ],
    relatedIds: ["destination-lisbon", "place-oitavos", "place-prado"]
  }
];

export const cityGolf: AroundCollection = {
  id: "collection-city-golf",
  type: "collection",
  slug: "city-golf",
  title: "City + Golf",
  kicker: "AROUND Collection / 01",
  description: "Städte, bei denen 18 Löcher nicht reichen.",
  accent: "lime",
  itemIds: ["destination-lisbon", "place-oitavos", "story-lisbon-beyond-golf"]
};

export const content: ContentCard[] = [
  lisbon,
  ...places,
  ...stories,
  cityGolf,
  {
    id: "person-margaux",
    type: "person",
    slug: "margaux-brooks",
    title: "Margaux Brooks",
    kicker: "People to Know",
    description: "Golf. Kunst. Perspektive.",
    accent: "pink"
  }
];

export function findBySlug(slug: string) {
  return content.find(item => item.slug === slug);
}

export function findById(id: string) {
  return content.find(item => item.id === id);
}

export function searchContent(query: string, type?: string) {
  const q = query.trim().toLowerCase();
  return content.filter(item => {
    const typeOk = !type || type === "all" || item.type === type;
    const queryOk = !q || `${item.title} ${item.kicker ?? ""} ${item.description}`.toLowerCase().includes(q);
    return typeOk && queryOk;
  });
}
