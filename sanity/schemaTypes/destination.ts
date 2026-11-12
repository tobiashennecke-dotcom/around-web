import { defineField, defineType } from "sanity";
import { topicsField } from "./topic";
import { PlaceGalleryBulkInput } from "../components/PlaceGalleryBulkInput";
import { DestinationOnlineInput } from "../components/DestinationOnlineInput";

export const destination = defineType({
  name: "destination",
  title: "Destination",
  type: "document",
  groups: [
    { name: "basics", title: "Basics", default: true },
    { name: "editorial", title: "Editorial" },
    { name: "media", title: "Media" },
    { name: "facts", title: "Reisefakten" },
    { name: "relations", title: "Relations" },
    { name: "publishing", title: "Publishing" },
    { name: "seo", title: "SEO" }
  ],
  fields: [
    defineField({
      name:"isOnline", title:"Online", type:"boolean", group:["basics","publishing"], initialValue:false,
      description:"Schalter für die Website. Aus = Destination, ihre Places und Stories, die nur zu ihr gehören, sind ausgeblendet. Inhalte bleiben im CMS erhalten. Fehlt der Wert bei älteren Destinationen, gilt sie als online.",
      components:{ input: DestinationOnlineInput }
    }),
    defineField({
      name:"unlisted", title:"Nur per Direktlink", type:"boolean", group:["basics","publishing"], initialValue:false,
      description:"An = erreichbar über den Link, aber nicht auf Start, Entdecken, Suche und Sitemap. Dazu noindex und der Hinweis „Recherche-Entwurf“. Online muss dafür an sein."
    }),
    defineField({ name:"title", title:"Title", type:"string", group:"basics", validation:r=>r.required() }),
    defineField({ name:"slug", title:"Slug", type:"slug", group:"basics", options:{source:"title"}, validation:r=>r.required() }),
    defineField({ name:"kicker", title:"Kicker / Eyebrow", type:"string", group:"basics", description:"Small line above the headline, e.g. Portugal / Atlantic Coast." }),
    defineField({ name:"summary", title:"Teaser", type:"text", rows:3, group:"basics", description:"Short editorial teaser used on cards and the destination hero." }),
    defineField({ name:"country", title:"Country", type:"string", group:"basics" }),
    defineField({ name:"coordinates", title:"Coordinates", type:"geopoint", group:"basics" }),

    defineField({ name:"whyGo", title:"WHY GO", type:"text", rows:7, group:"editorial", description:"The editorial reason why this destination is worth the trip." }),
    defineField({ name:"aroundTake", title:"AROUND Take", type:"text", rows:4, group:"editorial", description:"A concise, opinionated AROUND point of view. Used as a pull quote / feature statement." }),
    defineField({ name:"bestFor", title:"Best for", type:"array", group:"editorial", of:[{type:"string"}], options:{layout:"tags"}, description:"Examples: City + Golf, Food First, Weekend, Roadtrip." }),

    defineField({
      name:"heroImage", title:"Hero image", type:"image", group:"media", options:{hotspot:true},
      fields:[
        defineField({name:"alt", title:"Alt text", type:"string", description:"Describe the image for accessibility and SEO."}),
        defineField({name:"caption", title:"Caption", type:"string"}),
        defineField({name:"credit", title:"Credit", type:"string"})
      ]
    }),
    defineField({
      name:"gallery", title:"Gallery", type:"array", group:"media",
      components:{input:PlaceGalleryBulkInput},
      of:[{type:"image",options:{hotspot:true},fields:[
        {name:"alt",title:"Alt text",type:"string"},
        {name:"caption",title:"Caption",type:"string"},
        {name:"credit",title:"Credit",type:"string"}
      ]}]
    }),

    defineField({
      name:"itinerary", title:"AROUND JOURNEY / Travel edit", type:"object", group:"editorial",
      description:"Optional example route, not a fixed recommended trip duration. Reorder stops and offer additional optional Places.",
      fields:[
        defineField({name:"title",title:"Journey title",type:"string",description:"Example: LISSABON & CASCAIS"}),
        defineField({name:"intro",title:"Introduction",type:"text",rows:3}),
        defineField({name:"durationAdvice",title:"How long to go? (optional)",type:"text",rows:3}),
        defineField({name:"paceAdvice",title:"Choose your pace (optional)",type:"text",rows:3}),
        defineField({name:"alternatives",title:"Optional Places / further inspiration",type:"array",description:"Not part of the default Trip import",of:[{
          type:"object",name:"journeyAlternative",title:"Optional Place",
          fields:[
            {name:"place",type:"reference",to:[{type:"place"}],title:"Place",validation:(r:any)=>r.required()},
            {name:"reason",type:"text",title:"Why add it?",rows:2}
          ],
          preview:{select:{title:"place.title",subtitle:"reason"}}
        }]}),
        defineField({name:"days",title:"Days",type:"array",of:[{
          type:"object",name:"itineraryDay",title:"Day",
          fields:[
            {name:"label",type:"string",title:"Day headline",validation:(r:any)=>r.required()},
            {name:"summary",type:"text",title:"Editorial subline",rows:2},
            {name:"stops",type:"array",title:"Stops in order",of:[{
              type:"object",name:"itineraryStop",title:"Stop",
              fields:[
                {name:"place",type:"reference",to:[{type:"place"}],title:"Place",validation:(r:any)=>r.required()},
                {name:"period",type:"string",title:"Display label",description:"e.g. VORMITTAG"},
                {name:"slot",type:"string",title:"Planner slot",options:{list:[
                  {title:"Flexible",value:"flex"},{title:"Morning",value:"morning"},{title:"Midday",value:"midday"},
                  {title:"Afternoon",value:"afternoon"},{title:"Evening",value:"evening"},{title:"Stay",value:"stay"}]}},
                {name:"copy",type:"text",title:"Editorial copy",rows:3}
              ],
              preview:{select:{title:"place.title",subtitle:"period"}}
            }]}
          ],
          preview:{select:{title:"label",subtitle:"summary"}}
        }]})
      ]
    }),

    defineField({
      name:"timeZone", title:"Zeitzone", type:"string", group:"facts",
      description:"Daraus rechnet die Seite die Zeitverschiebung zu Deutschland selbst aus, inklusive Sommer-/Winterzeit. Nie von Hand pflegen.",
      options:{ list:[
        {title:"Deutschland / Mitteleuropa (Europe/Berlin)",value:"Europe/Berlin"},
        {title:"Österreich (Europe/Vienna)",value:"Europe/Vienna"},
        {title:"Schweiz (Europe/Zurich)",value:"Europe/Zurich"},
        {title:"Italien (Europe/Rome)",value:"Europe/Rome"},
        {title:"Spanien Festland / Mallorca (Europe/Madrid)",value:"Europe/Madrid"},
        {title:"Frankreich (Europe/Paris)",value:"Europe/Paris"},
        {title:"Niederlande (Europe/Amsterdam)",value:"Europe/Amsterdam"},
        {title:"Dänemark (Europe/Copenhagen)",value:"Europe/Copenhagen"},
        {title:"Schweden (Europe/Stockholm)",value:"Europe/Stockholm"},
        {title:"Portugal Festland (Europe/Lisbon)",value:"Europe/Lisbon"},
        {title:"Madeira (Atlantic/Madeira)",value:"Atlantic/Madeira"},
        {title:"Azoren (Atlantic/Azores)",value:"Atlantic/Azores"},
        {title:"Kanaren (Atlantic/Canary)",value:"Atlantic/Canary"},
        {title:"Großbritannien (Europe/London)",value:"Europe/London"},
        {title:"Irland (Europe/Dublin)",value:"Europe/Dublin"},
        {title:"Estland (Europe/Tallinn)",value:"Europe/Tallinn"},
        {title:"Griechenland (Europe/Athens)",value:"Europe/Athens"},
        {title:"Zypern (Asia/Nicosia)",value:"Asia/Nicosia"},
        {title:"Türkei (Europe/Istanbul)",value:"Europe/Istanbul"},
        {title:"Montenegro / Kroatien (Europe/Podgorica)",value:"Europe/Podgorica"},
        {title:"Ägypten (Africa/Cairo)",value:"Africa/Cairo"},
        {title:"Marokko (Africa/Casablanca)",value:"Africa/Casablanca"},
        {title:"Südafrika (Africa/Johannesburg)",value:"Africa/Johannesburg"},
        {title:"Mauritius (Indian/Mauritius)",value:"Indian/Mauritius"},
        {title:"Seychellen (Indian/Mahe)",value:"Indian/Mahe"},
        {title:"VAE / Dubai (Asia/Dubai)",value:"Asia/Dubai"},
        {title:"Katar (Asia/Qatar)",value:"Asia/Qatar"},
        {title:"Thailand (Asia/Bangkok)",value:"Asia/Bangkok"},
        {title:"USA Ostküste (America/New_York)",value:"America/New_York"},
        {title:"USA Westküste (America/Los_Angeles)",value:"America/Los_Angeles"},
        {title:"Mexiko Karibik (America/Cancun)",value:"America/Cancun"},
        {title:"Dominikanische Republik (America/Santo_Domingo)",value:"America/Santo_Domingo"}
      ]}
    }),
    defineField({
      name:"bestMonths", title:"Beste Reisezeit", type:"array", group:"facts",
      of:[{type:"string"}],
      options:{ layout:"grid", list:[
        {title:"Jan",value:"1"},{title:"Feb",value:"2"},{title:"Mär",value:"3"},{title:"Apr",value:"4"},
        {title:"Mai",value:"5"},{title:"Jun",value:"6"},{title:"Jul",value:"7"},{title:"Aug",value:"8"},
        {title:"Sep",value:"9"},{title:"Okt",value:"10"},{title:"Nov",value:"11"},{title:"Dez",value:"12"}
      ]},
      description:"Die Monate, in denen wir hinfahren würden – Golf und alles drumherum. Die Seite fasst sie zu Zeiträumen zusammen (z. B. Okt – Apr)."
    }),
    defineField({ name:"seasonNote", title:"Reisezeit-Hinweis (optional)", type:"string", group:"facts", validation:r=>r.max(120), description:"Ein Satz, z. B. „Dez – März Regenzeit, meist kurze Schauer.“" }),
    defineField({
      name:"airport", title:"Nächster Flughafen (optional)", type:"object", group:"facts",
      description:"Bleibt stabil, egal von wo man abfliegt. Keine Flugzeiten oder Airline-Regeln – die ändern sich zu oft.",
      fields:[
        defineField({name:"code",title:"IATA-Code",type:"string",validation:r=>r.max(3).uppercase()}),
        defineField({name:"name",title:"Name",type:"string"}),
        defineField({name:"transferMinutes",title:"Transfer zur Destination (Minuten, ca.)",type:"number",validation:r=>r.min(0).max(600).integer()})
      ]
    }),

    defineField({
      name:"regions", title:"Regionen", type:"array", group:"relations",
      description:"Optional. Teilt die Destination in Ecken auf (z. B. Lissabon & Cascais / Silberküste). Reihenfolge = Reihenfolge auf der Seite. Places ohne Region erscheinen weiter normal unter DRUMHERUM.",
      of:[{
        type:"object", name:"destinationRegion", title:"Region",
        fields:[
          defineField({name:"title",title:"Name",type:"string",validation:r=>r.required()}),
          defineField({name:"summary",title:"Kurzbeschreibung",type:"text",rows:3,description:"Wofür steht diese Ecke? 1–3 Sätze."}),
          defineField({name:"places",title:"Places in dieser Region",type:"array",of:[{type:"reference",to:[{type:"place"}]}],validation:r=>r.unique()})
        ],
        preview:{ select:{title:"title",subtitle:"summary"} }
      }]
    }),
    defineField({ name:"places", title:"Places", type:"array", group:"relations", of:[{type:"reference",to:[{type:"place"}]}], description:"Curated order. This controls which places appear on the destination page." }),
    defineField({ name:"stories", title:"Stories", type:"array", group:"relations", of:[{type:"reference",to:[{type:"story"}]}], description:"Curated stories for this destination." }),

    topicsField("publishing"),
    defineField({ name:"featured", title:"Featured", type:"boolean", group:"publishing", initialValue:false, description:"Can be used for homepage and discovery highlights." }),
    defineField({ name:"aroundSelected", title:"AROUND Selected", type:"boolean", group:"publishing", initialValue:false, description:"Editorial seal only. Never a paid placement." }),
    defineField({ name:"priority", title:"Editorial priority", type:"number", group:"publishing", initialValue:50, validation:r=>r.min(0).max(100), description:"Higher numbers surface earlier in curated feeds." }),

    defineField({ name:"seoTitle", title:"SEO title", type:"string", group:"seo", validation:r=>r.max(60) }),
    defineField({ name:"seoDescription", title:"SEO description", type:"text", rows:3, group:"seo", validation:r=>r.max(160) }),
    defineField({ name:"socialImage", title:"Social image", type:"image", group:"seo", options:{hotspot:true} })
  ],
  preview: {
    select: { title:"title", subtitle:"country", media:"heroImage", selected:"aroundSelected" },
    prepare({title,subtitle,media,selected}) {
      return { title: selected ? `✓ ${title}` : title, subtitle: subtitle || "Destination", media };
    }
  }
});
