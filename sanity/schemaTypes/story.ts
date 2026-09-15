import { defineField, defineType } from "sanity";

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
      type: "string",
      description: "Optional short contextual line written specifically for this point in the Story. Do not repeat the Place description.",
      validation: r => r.max(120)
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
        placeModule
      ]
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
