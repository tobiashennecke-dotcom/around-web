import { defineField } from "sanity";
import { audioEmbed, videoEmbed } from "../../lib/embeds";

/**
 * Story 2.0 body modules (spec 14). External players only: YouTube / Vimeo
 * for video, Spotify / Apple for audio. No uploads, no hosting costs.
 * All modules are additive Portable Text objects - existing Stories are
 * untouched.
 */

function stripDraftPrefix(id?: string) {
  return id ? id.replace(/^drafts\./, "") : id;
}

function relatedPlaceIds(document: any): string[] {
  const refs = Array.isArray(document?.related) ? document.related : [];
  return refs
    .map((ref: any) => stripDraftPrefix(ref?._ref))
    .filter((id: string | undefined): id is string => Boolean(id));
}

const LAYOUT_FIELD = defineField({
  name: "layout",
  title: "Breite",
  type: "string",
  options: {
    list: [
      { title: "Artikelbreite", value: "article" },
      { title: "Breit", value: "wide" },
      { title: "Volle Breite", value: "full" }
    ],
    layout: "radio"
  },
  initialValue: "wide"
});

export const storyVideo = {
  type: "object",
  name: "storyVideo",
  title: "Video (YouTube / Vimeo)",
  fields: [
    defineField({
      name: "platform",
      title: "Plattform",
      type: "string",
      options: { list: [{ title: "YouTube", value: "youtube" }, { title: "Vimeo", value: "vimeo" }], layout: "radio" },
      initialValue: "youtube",
      validation: r => r.required()
    }),
    defineField({
      name: "url",
      title: "Link zum Video",
      type: "url",
      description: "Einfach den normalen Teilen-Link einfügen, z. B. https://youtu.be/… oder https://vimeo.com/…",
      validation: r => r.required().custom((value: any, context: any) => {
        if (!value) return true;
        const platform = context?.parent?.platform;
        return videoEmbed(platform, value) ? true : `Das ist kein gültiger ${platform === "vimeo" ? "Vimeo" : "YouTube"}-Link.`;
      })
    }),
    defineField({
      name: "poster",
      title: "Vorschaubild",
      type: "image",
      options: { hotspot: true },
      description: "Pflicht. Wird gezeigt, bis jemand auf Abspielen klickt. Ein eigenes Bild, damit vor dem Klick keine Daten an YouTube oder Vimeo gehen.",
      fields: [defineField({ name: "alt", title: "Alt-Text", type: "string", validation: r => r.required() })],
      validation: r => r.required()
    }),
    defineField({ name: "title", title: "Titel", type: "string", validation: r => r.required().max(90) }),
    defineField({ name: "duration", title: "Dauer", type: "string", description: "Optional, z. B. 1:20" }),
    defineField({ name: "caption", title: "Bildunterschrift", type: "string" }),
    defineField({ name: "credit", title: "Credit", type: "string" }),
    LAYOUT_FIELD
  ],
  preview: {
    select: { title: "title", platform: "platform", media: "poster" },
    prepare({ title, platform, media }: any) {
      return { title: title || "VIDEO", subtitle: `VIDEO · ${platform === "vimeo" ? "Vimeo" : "YouTube"}`, media };
    }
  }
};

export const storyAudio = {
  type: "object",
  name: "storyAudio",
  title: "Zum Hören (Spotify / Apple)",
  fields: [
    defineField({
      name: "kind",
      title: "Art",
      type: "string",
      options: {
        list: [
          { title: "Beitrag an dieser Stelle im Text", value: "feature" },
          { title: "Vorlesefassung der ganzen Story", value: "readAloud" }
        ],
        layout: "radio"
      },
      initialValue: "feature",
      description: "Die Vorlesefassung erscheint als „Anhören“ oben in der Story und spielt in einer Leiste unten weiter, während man liest.",
      validation: r => r.required()
    }),
    defineField({
      name: "platform",
      title: "Plattform",
      type: "string",
      options: { list: [{ title: "Spotify", value: "spotify" }, { title: "Apple Podcasts / Apple Music", value: "apple" }], layout: "radio" },
      initialValue: "spotify",
      validation: r => r.required()
    }),
    defineField({
      name: "url",
      title: "Link",
      type: "url",
      description: "Teilen-Link zur Folge oder zum Titel, z. B. https://open.spotify.com/episode/… oder https://podcasts.apple.com/de/podcast/…?i=…",
      validation: r => r.required().custom((value: any, context: any) => {
        if (!value) return true;
        const platform = context?.parent?.platform;
        return audioEmbed(platform, value) ? true : `Das ist kein gültiger ${platform === "apple" ? "Apple-Podcasts- oder Apple-Music" : "Spotify"}-Link.`;
      })
    }),
    defineField({ name: "title", title: "Titel", type: "string", validation: r => r.required().max(90) }),
    defineField({ name: "speaker", title: "Sprecher / Gast", type: "string" }),
    defineField({ name: "duration", title: "Dauer", type: "string", description: "Optional, z. B. 12 Min." }),
    defineField({
      name: "alsoUrl",
      title: "Auch hören auf",
      type: "url",
      description: "Optional: dieselbe Folge auf der jeweils anderen Plattform.",
      validation: r => r.custom((value: any) => {
        if (!value) return true;
        return audioEmbed("spotify", value) || audioEmbed("apple", value) ? true : "Bitte einen Spotify- oder Apple-Link einfügen.";
      })
    }),
    defineField({
      name: "transcript",
      title: "Transkript",
      type: "text",
      rows: 8,
      description: "Empfohlen. Wird unter der Story aufklappbar gezeigt. Gut für Barrierefreiheit und Google."
    })
  ],
  preview: {
    select: { title: "title", platform: "platform", kind: "kind" },
    prepare({ title, platform, kind }: any) {
      const service = platform === "apple" ? "Apple" : "Spotify";
      return { title: title || "ZUM HÖREN", subtitle: `${kind === "readAloud" ? "VORLESEFASSUNG" : "ZUM HÖREN"} · ${service}` };
    }
  }
};

export const storyOTon = {
  type: "object",
  name: "storyOTon",
  title: "O-Ton",
  description: "Nur wörtliche Zitate aus echten Gesprächen.",
  fields: [
    defineField({ name: "quote", title: "Zitat", type: "text", rows: 3, validation: r => r.required().max(280) }),
    defineField({ name: "person", title: "Person (falls angelegt)", type: "reference", to: [{ type: "person" }] }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Nur nötig, wenn die Person nicht als Person angelegt ist.",
      validation: r => r.custom((value: any, context: any) => (value || context?.parent?.person?._ref ? true : "Bitte eine Person auswählen oder einen Namen eintragen."))
    }),
    defineField({ name: "role", title: "Funktion", type: "string", description: "z. B. Head-Pro, Clubmanager" })
  ],
  preview: {
    select: { quote: "quote", name: "name", personName: "person.title" },
    prepare({ quote, name, personName }: any) {
      return { title: quote ? `„${String(quote).slice(0, 60)}${String(quote).length > 60 ? "…" : ""}“` : "O-TON", subtitle: `O-TON · ${personName || name || "Person fehlt"}` };
    }
  }
};

export const storyFacts = {
  type: "object",
  name: "storyFacts",
  title: "Auf einen Blick",
  fields: [
    defineField({ name: "title", title: "Überschrift", type: "string", initialValue: "Auf einen Blick" }),
    defineField({
      name: "rows",
      title: "Zeilen",
      type: "array",
      validation: r => r.required().min(3).max(8),
      of: [{
        type: "object",
        name: "factRow",
        fields: [
          defineField({ name: "label", title: "Bezeichnung", type: "string", validation: r => r.required().max(40) }),
          defineField({ name: "value", title: "Wert", type: "string", validation: r => r.required().max(140) })
        ],
        preview: { select: { title: "label", subtitle: "value" } }
      }]
    }),
    defineField({
      name: "asOf",
      title: "Stand",
      type: "date",
      description: "Pflicht, sobald Preise, Öffnungszeiten oder Greenfees drinstehen."
    })
  ],
  preview: {
    select: { title: "title", rows: "rows" },
    prepare({ title, rows }: any) {
      const count = Array.isArray(rows) ? rows.length : 0;
      return { title: title || "Auf einen Blick", subtitle: `AUF EINEN BLICK · ${count} Zeilen` };
    }
  }
};

export const storyHoleLine = {
  type: "object",
  name: "storyHoleLine",
  title: "Das Loch (Die Linie)",
  description: "Zeigt, wie ein Loch gespielt wird: eine Linie vom Abschlag zur Fahne, der Ball läuft beim Scrollen mit. Braucht nur Scorecard-Daten und deine Notizen.",
  fields: [
    defineField({
      name: "place",
      title: "Golfplatz",
      type: "reference",
      to: [{ type: "place" }],
      description: "Nur Places, die unter IN THIS STORY verknüpft sind.",
      options: {
        filter: ({ document }: any) => {
          const ids = relatedPlaceIds(document);
          return { filter: `_type == "place" && _id in $ids`, params: { ids: ids.length ? ids : ["__none__"] } };
        }
      },
      validation: r => r.required().custom((value: any, context: any) => {
        if (!value?._ref) return true;
        return relatedPlaceIds(context.document).includes(stripDraftPrefix(value._ref) || "")
          ? true
          : "Dieser Place muss zuerst unter IN THIS STORY mit der Story verknüpft werden.";
      })
    }),
    defineField({ name: "holeNumber", title: "Lochnummer", type: "number", validation: r => r.required().integer().min(1).max(27) }),
    defineField({ name: "par", title: "Par", type: "number", validation: r => r.required().integer().min(3).max(6) }),
    defineField({ name: "length", title: "Länge (m)", type: "number", validation: r => r.required().integer().min(50).max(800) }),
    defineField({ name: "teeLabel", title: "Abschlag", type: "string", description: "z. B. Gelb. Wird neben der Länge gezeigt." }),
    defineField({
      name: "stations",
      title: "Stationen",
      type: "array",
      description: "2–4 Stationen. Die erste liegt bei 0 m (Abschlag), die letzte bei der Länge des Lochs (Grün).",
      of: [{
        type: "object",
        name: "holeStation",
        fields: [
          defineField({ name: "name", title: "Name", type: "string", description: "z. B. Abschlag, Landezone, Grün", validation: r => r.required().max(30) }),
          defineField({ name: "distance", title: "Entfernung vom Abschlag (m)", type: "number", validation: r => r.required().integer().min(0).max(800) }),
          defineField({ name: "elevation", title: "Höhe (m ü. NN)", type: "number", description: "Optional. Sind Höhen angegeben, zeigt die Linie das Gefälle." }),
          defineField({ name: "text", title: "Text", type: "text", rows: 2, validation: r => r.required().max(200) })
        ],
        preview: {
          select: { name: "name", distance: "distance", text: "text" },
          prepare({ name, distance, text }: any) {
            return { title: `${name || "Station"} · ${typeof distance === "number" ? distance : "?"} m`, subtitle: text };
          }
        }
      }],
      validation: r => r.required().min(2).max(4).custom((stations: any, context: any) => {
        if (!Array.isArray(stations) || stations.length < 2) return true;
        const distances = stations.map((station: any) => station?.distance);
        if (distances.some((d: any) => typeof d !== "number")) return true;
        if (distances[0] !== 0) return "Die erste Station muss bei 0 m liegen (Abschlag).";
        for (let i = 1; i < distances.length; i++) {
          if (distances[i] <= distances[i - 1]) return "Die Entfernungen müssen von Station zu Station größer werden.";
        }
        const length = context?.parent?.length;
        if (typeof length === "number" && distances[distances.length - 1] !== length) {
          return `Die letzte Station (Grün) muss bei der Länge des Lochs liegen: ${length} m.`;
        }
        return true;
      })
    })
  ],
  preview: {
    select: { hole: "holeNumber", par: "par", placeTitle: "place.title", stations: "stations" },
    prepare({ hole, par, placeTitle, stations }: any) {
      const count = Array.isArray(stations) ? stations.length : 0;
      return { title: `DAS LOCH · Bahn ${hole || "?"} · Par ${par || "?"}`, subtitle: `${placeTitle || "Platz fehlt"} · ${count} Stationen` };
    }
  }
};
