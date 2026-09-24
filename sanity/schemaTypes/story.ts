import { defineField, defineType } from "sanity";
import { PlaceGalleryBulkInput } from "../components/PlaceGalleryBulkInput";

function stripDraftPrefix(id?: string) {
  return id ? id.replace(/^drafts\./, "") : id;
}

/** IDs of every Place already present in the Story's canonical related[] - the only Places a placeModule may reference. */
function relatedPlaceIds(document: any): string[] {
  const refs = Array.isArray(document?.related) ? document.related : [];
  return refs
    .map((ref: any) => stripDraftPrefix(ref?._ref))
    .filter((id: string | undefined): id is string => Boolean(id));
}

/**
 * Studio-preview-only role label so an editor sees PLAY/STAY/EAT/DO in the
 * block list, matching what readers see. The canonical mapping used for all
 * actual rendering lives in lib/content-role.ts - this is a deliberately
 * tiny, Studio-only duplicate, not a second source of truth for the app.
 */
function previewRoleLabel(placeType?: string) {
  const value = (placeType || "").toLowerCase();
  if (value === "course" || value === "play") return "PLAY";
  if (value === "stay") return "STAY";
  if (value === "eat" || value === "drink") return "EAT";
  if (value === "do" || value === "culture") return "DO";
  return placeType ? placeType.toUpperCase() : "PLACE";
}

const placeModule = {
  type: "object",
  name: "placeModule",
  title: "AROUND Place Module",
  fields: [
    defineField({
      name: "place",
      title: "Place",
      type: "reference",
      to: [{ type: "place" }],
      description: "Only Places already connected under IN THIS STORY can be selected. Add the Place under IN THIS STORY first.",
      options: {
        filter: ({ document }: any) => {
          const ids = relatedPlaceIds(document);
          return {
            filter: `_type == "place" && _id in $ids`,
            params: { ids: ids.length ? ids : ["__none__"] }
          };
        }
      },
      validation: r => r.required().custom((value: any, context: any) => {
        if (!value?._ref) return true;
        const ids = relatedPlaceIds(context.document);
        if (!ids.includes(stripDraftPrefix(value._ref) || "")) {
          return "Dieser Place muss zuerst unter IN THIS STORY mit der Story verknüpft werden.";
        }
        return true;
      })
    }),
    defineField({
      name: "layout",
      title: "Display",
      type: "string",
      options: {
        list: [
          { title: "Auto", value: "auto" },
          { title: "Feature", value: "feature" },
          { title: "Compact", value: "compact" }
        ],
        layout: "radio"
      },
      initialValue: "auto"
    }),
    defineField({
      name: "editorialLine",
      title: "Editorial line",
      type: "text",
      rows: 3,
      description: "Optional, hand-written contextual copy for this exact point in the Story - not a second Place description, and never AI-generated. Works best as 1-2 short sentences.",
      validation: r => r.max(240).warning("Die Editorial Line funktioniert am besten als 1–2 kurze Sätze.")
    })
  ],
  preview: {
    select: { placeTitle: "place.title", placeType: "place.placeType", layout: "layout" },
    prepare({ placeTitle, placeType, layout }: any) {
      if (!placeTitle) {
        return { title: "AROUND PLACE MODULE", subtitle: "Place auswählen" };
      }
      return {
        title: "AROUND PLACE MODULE",
        subtitle: `${placeTitle} · ${previewRoleLabel(placeType)} · ${(layout || "auto").toUpperCase()}`
      };
    }
  }
};

const premiumGate = {
  type: "object",
  name: "premiumGate",
  title: "AROUND Premium Gate",
  description: "Marks the editorial point where a future Premium wall would appear. Placement metadata only - there is no active paywall yet, and this block currently renders nothing on the site.",
  fields: [
    defineField({
      name: "note",
      title: "Internal note (optional)",
      type: "string",
      description: "Optional internal note about this gate placement. Never shown to readers."
    })
  ],
  preview: {
    prepare() {
      return {
        title: "AROUND PREMIUM GATE",
        subtitle: "Paywall position · currently inactive"
      };
    }
  }
};

export const story = defineType({
  name:"story",
  title:"Story",
  type:"document",
  groups:[
    {name:"basics",title:"Basics",default:true},
    {name:"content",title:"Story body"},
    {name:"relations",title:"Connections"},
    {name:"publishing",title:"Publishing"},
    {name:"seo",title:"SEO"}
  ],
  fields:[
    defineField({name:"title",title:"Title",type:"string",group:"basics",validation:r=>r.required()}),
    defineField({
      name:"teaserTitle",title:"Teaserüberschrift",type:"string",group:"basics",
      description:"Optionaler kurzer Titel für den großen Teaser auf Entdecken. Die Artikelüberschrift bleibt unverändert.",
      validation:r=>r.max(60).warning("Für zwei bis drei Zeilen möglichst unter 60 Zeichen bleiben.")
    }),
    defineField({
      name:"teaserDescription",title:"Teaser-Kurztext",type:"text",rows:2,group:"basics",
      description:"Optionaler kurzer Satz für den großen Teaser auf Entdecken.",
      validation:r=>r.max(160).warning("Ein kurzer Satz mit maximal 160 Zeichen lässt dem Bild mehr Raum.")
    }),
    defineField({name:"slug",title:"Slug",type:"slug",group:"basics",options:{source:"title"},validation:r=>r.required()}),
    defineField({
      name:"format",title:"AROUND format",type:"string",group:"basics",
      options:{list:[
        {title:"Worth the Trip",value:"worth-the-trip"},
        {title:"48 Hours",value:"48-hours"},
        {title:"Local Knowledge",value:"local-knowledge"},
        {title:"People to Know",value:"people-to-know"},
        {title:"Course Correction",value:"course-correction"},
        {title:"The Good Stuff",value:"the-good-stuff"},
        {title:"Next",value:"next"},
        {title:"After 18",value:"after-18"},
        {title:"Manifest",value:"manifest"},
        {title:"Story",value:"story"}
      ]},
      initialValue:"story"
    }),
    defineField({name:"kicker",title:"Kicker / Eyebrow",type:"string",group:"basics"}),
    defineField({name:"deck",title:"Deck / Teaser",type:"text",rows:4,group:"basics"}),
    defineField({name:"author",title:"Author",type:"reference",group:"basics",to:[{type:"person"}]}),
    defineField({name:"publishedAt",title:"Publication date",type:"datetime",group:"basics",initialValue:()=>new Date().toISOString()}),
    defineField({name:"readingTime",title:"Reading time (minutes)",type:"number",group:"basics",validation:r=>r.min(1).max(60)}),
    defineField({
      name:"heroImage",title:"Hero image",type:"image",group:"basics",options:{hotspot:true},
      fields:[
        defineField({name:"alt",title:"Alt text",type:"string",description:"Important for accessibility and SEO."}),
        defineField({name:"caption",title:"Caption",type:"string"}),
        defineField({name:"credit",title:"Credit",type:"string"})
      ]
    }),

    defineField({
      name:"body",title:"Story",type:"array",group:"content",
      of:[
        {
          type:"block",
          styles:[
            {title:"Normal",value:"normal"},
            {title:"Heading 2",value:"h2"},
            {title:"Heading 3",value:"h3"},
            {title:"Pull quote",value:"pullQuote"},
            {title:"Quote",value:"blockquote"}
          ],
          marks:{
            decorators:[
              {title:"Strong",value:"strong"},
              {title:"Emphasis",value:"em"}
            ],
            annotations:[
              {name:"link",title:"External link",type:"object",fields:[
                {name:"href",title:"URL",type:"url"},
                {name:"blank",title:"Open in new tab",type:"boolean",initialValue:true}
              ]}
            ]
          }
        },
        {
          type:"image",title:"Editorial image",options:{hotspot:true},
          fields:[
            {name:"alt",title:"Alt text",type:"string",description:"Important for accessibility and SEO."},
            {name:"caption",title:"Caption",type:"string"},
            {name:"credit",title:"Credit",type:"string"},
            {name:"layout",title:"Layout",type:"string",options:{list:[
              {title:"Article width",value:"article"},
              {title:"Wide",value:"wide"},
              {title:"Full bleed",value:"full"}
            ]},initialValue:"wide"}
          ]
        },
        {
          type:"object",name:"mediaGallery",title:"Editorial Gallery",
          description:"A quiet tile grid with fullscreen viewing - for a set of images, not a single deliberate editorial image.",
          fields:[
            {
              name:"images",title:"Images",type:"array",
              components:{input:PlaceGalleryBulkInput},
              validation:r=>r.min(2).max(20),
              of:[{
                type:"image",options:{hotspot:true},
                fields:[
                  {name:"alt",title:"Alt text",type:"string",description:"Important for accessibility and SEO."},
                  {name:"caption",title:"Caption",type:"string"},
                  {name:"credit",title:"Credit",type:"string"}
                ]
              }]
            }
          ],
          preview:{
            select:{images:"images"},
            prepare({images}){
              const count=Array.isArray(images)?images.length:0;
              return {title:"Editorial Gallery",subtitle:`${count} ${count===1?"Bild":"Bilder"}`,media:images?.[0]};
            }
          }
        },
        placeModule,
        premiumGate
      ],
      validation: r => r.custom((blocks: any) => {
        if (!Array.isArray(blocks)) return true;
        const gateCount = blocks.filter((block: any) => block?._type === "premiumGate").length;
        if (gateCount > 1) return "Eine Story darf maximal ein AROUND Premium Gate enthalten.";
        return true;
      })
    }),

    defineField({
      name:"related",title:"IN THIS STORY",type:"array",group:"relations",
      description:"Curated objects that the reader can continue into after / during the story.",
      of:[{type:"reference",to:[
        {type:"destination"},{type:"place"},{type:"person"},{type:"product"},{type:"collection"}
      ]}]
    }),

    defineField({name:"featured",title:"Featured",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"aroundSelected",title:"AROUND Selected",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"priority",title:"Editorial priority",type:"number",group:"publishing",initialValue:50,validation:r=>r.min(0).max(100)}),
    defineField({
      name:"accessTier",title:"Access tier",type:"string",group:"publishing",
      description:"Controls the reader access gate. This is NOT AROUND Selected, and Premium does not mean higher editorial quality - it only marks a Story for the Premium wall. A Premium Story requires exactly one AROUND Premium Gate in its body. Stories without this field behave as Free.",
      options:{list:[{title:"Free",value:"free"},{title:"Premium",value:"premium"}],layout:"radio"},
      initialValue:"free",
      validation: r => r.custom((value: any, context: any) => {
        if (value !== "premium") return true;
        const body = Array.isArray((context?.document as any)?.body) ? (context.document as any).body : [];
        const hasGate = body.some((block: any) => block?._type === "premiumGate");
        return hasGate ? true : "Eine Premium Story braucht ein AROUND Premium Gate im Body, bevor sie veröffentlicht werden kann.";
      })
    }),

    defineField({name:"seoTitle",title:"SEO title",type:"string",group:"seo",validation:r=>r.max(60)}),
    defineField({name:"seoDescription",title:"SEO description",type:"text",rows:3,group:"seo",validation:r=>r.max(160)}),
    defineField({name:"socialImage",title:"Social image",type:"image",group:"seo",options:{hotspot:true}})
  ],
  preview:{
    select:{title:"title",format:"format",date:"publishedAt",media:"heroImage"},
    prepare({title,format,date,media}){
      const dateLabel=date?new Date(date).toLocaleDateString("de-DE"):"Draft";
      return {title,subtitle:`${format||"Story"} · ${dateLabel}`,media};
    }
  }
});
