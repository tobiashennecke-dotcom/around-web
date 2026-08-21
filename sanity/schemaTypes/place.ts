import { defineField, defineType } from "sanity";

export const place = defineType({
  name:"place",
  title:"Place",
  type:"document",
  groups:[
    {name:"basics",title:"Basics",default:true},
    {name:"editorial",title:"Editorial"},
    {name:"details",title:"Details"},
    {name:"media",title:"Media"},
    {name:"publishing",title:"Publishing"},
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

    defineField({name:"whyWeLikeIt",title:"Why we like it",type:"text",rows:7,group:"editorial"}),
    defineField({name:"aroundTake",title:"AROUND Take",type:"text",rows:4,group:"editorial",description:"Short editorial verdict / point of view."}),
    defineField({
      name:"goodToKnow",title:"Good to know",type:"array",group:"editorial",
      of:[{type:"object",name:"fact",title:"Fact",fields:[
        {name:"label",title:"Label",type:"string"},
        {name:"value",title:"Value",type:"string"}
      ],preview:{select:{title:"label",subtitle:"value"}}}]
    }),

    defineField({name:"address",title:"Address",type:"string",group:"details"}),
    defineField({name:"coordinates",title:"Coordinates",type:"geopoint",group:"details"}),
    defineField({name:"website",title:"Website",type:"url",group:"details"}),
    defineField({name:"instagram",title:"Instagram URL",type:"url",group:"details"}),

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
        {name:"credit",title:"Credit",type:"string"}
      ]}]
    }),

    defineField({name:"featured",title:"Featured",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"aroundSelected",title:"AROUND Selected",type:"boolean",group:"publishing",initialValue:false,description:"Editorial seal only. Never paid."}),
    defineField({name:"priority",title:"Editorial priority",type:"number",group:"publishing",initialValue:50,validation:r=>r.min(0).max(100)}),

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
