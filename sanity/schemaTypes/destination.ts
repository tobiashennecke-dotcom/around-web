import { defineField, defineType } from "sanity";
import { PlaceGalleryBulkInput } from "../components/PlaceGalleryBulkInput";

export const destination = defineType({
  name: "destination",
  title: "Destination",
  type: "document",
  groups: [
    { name: "basics", title: "Basics", default: true },
    { name: "editorial", title: "Editorial" },
    { name: "media", title: "Media" },
    { name: "relations", title: "Relations" },
    { name: "publishing", title: "Publishing" },
    { name: "seo", title: "SEO" }
  ],
  fields: [
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
      name:"itinerary", title:"48 HOURS / Journey", type:"object", group:"editorial",
      description:"Optional curated route. Add days and reorder stops here. Each stop references an existing Place; the page and Trip Planner use this same sequence.",
      fields:[
        defineField({name:"title",title:"Journey title",type:"string",description:"Example: LISSABON & CASCAIS"}),
        defineField({name:"intro",title:"Introduction",type:"text",rows:3}),
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
        }]}
      ]
    }),

    defineField({ name:"places", title:"Places", type:"array", group:"relations", of:[{type:"reference",to:[{type:"place"}]}], description:"Curated order. This controls which places appear on the destination page." }),
    defineField({ name:"stories", title:"Stories", type:"array", group:"relations", of:[{type:"reference",to:[{type:"story"}]}], description:"Curated stories for this destination." }),

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
