import { defineField, defineType } from "sanity";

export const place = defineType({
  name:"place",
  title:"Place",
  type:"document",
  groups:[
    {name:"basics",title:"Basics",default:true},
    {name:"editorial",title:"Editorial"},
    {name:"play",title:"PLAY Details",hidden:({document}) => document?.placeType !== "course"},
    {name:"details",title:"Details"},
    {name:"planning",title:"Planning"},
    {name:"media",title:"Media"},
    {name:"commercial",title:"Commercial"},
    {name:"publishing",title:"Publishing"},
    {name:"internal",title:"Internal"},
    {name:"seo",title:"SEO"}
  ],
  fields:[
    defineField({name:"title",title:"Title",type:"string",group:"basics",validation:r=>r.required()}),
    defineField({name:"slug",title:"Slug",type:"slug",group:"basics",options:{source:"title"},validation:r=>r.required()}),
    defineField({name:"kicker",title:"Kicker / Eyebrow",type:"string",group:"basics"}),
    defineField({name:"summary",title:"Teaser",type:"text",rows:3,group:"basics"}),
    defineField({
      name:"placeType",title:"Place type",type:"string",group:"basics",
      options:{list:[
        {title:"Course",value:"course"},
        {title:"Stay",value:"stay"},
        {title:"Eat",value:"eat"},
        {title:"Drink",value:"drink"},
        {title:"Do",value:"do"},
        {title:"Shop",value:"shop"},
        {title:"Culture",value:"culture"}
      ]}
    }),
    defineField({name:"destination",title:"Destination",type:"reference",group:"basics",to:[{type:"destination"}]}),

    defineField({
      name:"defaultPlanningMode",title:"Default planning mode",type:"string",group:"planning",
      options:{list:[{title:"Flexible",value:"flexible"},{title:"Fixpunkt",value:"fixed"}],layout:"radio"},
      description:"Editorial recommendation for Trip Quick Add. Users can always override it."
    }),
    defineField({name:"suggestedDurationMinutes",title:"Suggested duration (minutes)",type:"number",group:"planning",validation:r=>r.min(15).max(720)}),
    defineField({
      name:"suggestedDaypart",title:"Suggested daypart",type:"string",group:"planning",
      options:{list:[
        {title:"Morning",value:"morning"},{title:"Midday",value:"midday"},{title:"Afternoon",value:"afternoon"},{title:"Evening",value:"evening"},{title:"All day",value:"all_day"}
      ]}
    }),
    defineField({
      name:"suggestedTime",title:"Suggested exact time",type:"string",group:"planning",
      description:"Optional HH:MM, e.g. 10:30. Only use when an exact time is editorially meaningful.",
      validation:r=>r.custom(value=>!value || /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value)) || "Use HH:MM, e.g. 10:30")
    }),

    defineField({name:"whyWeLikeIt",title:"Why we like it",type:"text",rows:7,group:"editorial"}),
    defineField({name:"aroundTake",title:"AROUND Take",type:"text",rows:4,group:"editorial",description:"Short editorial verdict / point of view."}),
    defineField({
      name:"goodToKnow",title:"Good to know",type:"array",group:"editorial",
      of:[{type:"object",name:"fact",title:"Fact",fields:[
        {name:"label",title:"Label",type:"string"},
        {name:"value",title:"Value",type:"string"}
      ],preview:{select:{title:"label",subtitle:"value"}}}]
    }),

    defineField({
      name:"theFeel",title:"The feel",type:"array",group:"editorial",of:[{type:"string"}],options:{layout:"tags"},
      description:"Short editorial descriptors, e.g. Alpine, Strategic, Unpolished. Used by WHY PLAY IT."
    }),
    defineField({
      name:"bestFor",title:"Best for",type:"array",group:"editorial",of:[{type:"string"}],options:{layout:"tags"},
      description:"Who this is editorially best for, e.g. Scenery hunters, Golf weekends, Better players."
    }),
    defineField({
      name:"aroundMoment",title:"The AROUND moment",type:"text",rows:3,group:"editorial",
      description:"A specific, memorable moment, hole or view - not generic marketing copy."
    }),
    defineField({
      name:"knowBeforeYouGo",title:"Know before you go",type:"text",rows:3,group:"editorial",
      description:"An honest, useful caveat or expectation-setting note. Editorial, not operator copy."
    }),

    defineField({name:"holes",title:"Holes",type:"number",group:"play",validation:r=>r.min(1).max(54)}),
    defineField({name:"par",title:"Par",type:"number",group:"play",validation:r=>r.min(27).max(90)}),
    defineField({
      name:"courseCharacter",title:"Course character",type:"string",group:"play",
      description:"Short editorial descriptor, e.g. Alpine, Parkland, Links, Heathland, Resort."
    }),
    defineField({
      name:"walkability",title:"Walkability",type:"string",group:"play",
      description:"e.g. Walkable, Hilly - cart recommended, Cart only."
    }),
    defineField({
      name:"cartAvailability",title:"Cart availability",type:"string",group:"play",
      description:"e.g. Carts available, Carts on request, No carts."
    }),
    defineField({
      name:"practiceFacilities",title:"Practice facilities",type:"array",group:"play",of:[{type:"string"}],options:{layout:"tags"},
      description:"e.g. Range, Putting green, Chipping area."
    }),
    defineField({
      name:"guestPlay",title:"Guest play",type:"text",rows:2,group:"play",
      description:"Editorial, stable description of guest access, e.g. handicap requirements. Not live availability."
    }),
    defineField({name:"season",title:"Season",type:"string",group:"play",description:"e.g. April–October."}),

    defineField({name:"address",title:"Address",type:"string",group:"details"}),
    defineField({name:"coordinates",title:"Coordinates",type:"geopoint",group:"details"}),
    defineField({name:"website",title:"Website",type:"url",group:"details"}),
    defineField({name:"instagram",title:"Instagram URL",type:"url",group:"details"}),
    defineField({
      name:"bookingUrl",title:"Booking / tee time URL",type:"url",group:"details",
      description:"Official operator booking page. The CTA only appears when this is set."
    }),
    defineField({
      name:"bookingLabel",title:"Booking CTA label",type:"string",group:"details",
      description:"Optional override, e.g. “Tee Times & Greenfees”. Falls back to a generic label."
    }),
    defineField({
      name:"operatorStatus",title:"Operator status",type:"object",group:"details",
      description:"Who last confirmed the operational facts on this page.",
      fields:[
        defineField({
          name:"source",title:"Source",type:"string",
          options:{list:[{title:"AROUND (researched)",value:"around"},{title:"Confirmed by operator",value:"operator"}],layout:"radio"}
        }),
        defineField({name:"lastVerifiedAt",title:"Last verified at",type:"datetime"})
      ]
    }),

    defineField({
      name:"heroImage",title:"Hero image",type:"image",group:"media",options:{hotspot:true},
      fields:[
        defineField({name:"alt",title:"Alt text",type:"string"}),
        defineField({name:"caption",title:"Caption",type:"string"}),
        defineField({name:"credit",title:"Credit",type:"string"})
      ]
    }),
    defineField({
      name:"gallery",title:"Gallery",type:"array",group:"media",
      of:[{type:"image",options:{hotspot:true},fields:[
        {name:"alt",title:"Alt text",type:"string"},
        {name:"caption",title:"Caption",type:"string"},
        {name:"credit",title:"Credit",type:"string"},
        {
          name:"layout",title:"Editorial layout",type:"string",initialValue:"auto",
          options:{list:[
            {title:"Auto",value:"auto"},
            {title:"Wide",value:"wide"},
            {title:"Portrait",value:"portrait"},
            {title:"Full bleed",value:"full"},
            {title:"Detail",value:"detail"}
          ],layout:"radio"}
        }
      ]}]
    }),

    defineField({
      name:"commercialPartner",title:"Commercial partner",type:"boolean",group:"commercial",initialValue:false,
      description:"Operational/commercial flag only. Must never influence AROUND Selected, editorial priority, WHY PLAY IT or AROUND IT relevance."
    }),

    defineField({name:"featured",title:"Featured",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"aroundSelected",title:"AROUND Selected",type:"boolean",group:"publishing",initialValue:false,description:"Editorial seal only. Never paid."}),
    defineField({name:"priority",title:"Editorial priority",type:"number",group:"publishing",initialValue:50,validation:r=>r.min(0).max(100)}),

    defineField({
      name:"editorialStatus",title:"Editorial status",type:"string",group:"internal",
      description:"Internal only: distinguishes first-hand AROUND knowledge from researched content. Not shown publicly.",
      options:{list:[{title:"Played",value:"played"},{title:"Visited",value:"visited"},{title:"Researched",value:"researched"}]}
    }),
    defineField({name:"lastEditorialReviewAt",title:"Last editorial review at",type:"datetime",group:"internal"}),

    defineField({name:"seoTitle",title:"SEO title",type:"string",group:"seo",validation:r=>r.max(60)}),
    defineField({name:"seoDescription",title:"SEO description",type:"text",rows:3,group:"seo",validation:r=>r.max(160)}),
    defineField({name:"socialImage",title:"Social image",type:"image",group:"seo",options:{hotspot:true}})
  ],
  preview:{
    select:{title:"title",type:"placeType",destination:"destination.title",media:"heroImage",selected:"aroundSelected"},
    prepare({title,type,destination,media,selected}){
      const subtitle=[type,destination].filter(Boolean).join(" · ");
      return {title:selected?`✓ ${title}`:title,subtitle:subtitle||"Place",media};
    }
  }
});
