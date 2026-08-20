import { defineField, defineType } from "sanity";

export const place = defineType({
  name:"place",
  title:"Place",
  type:"document",
  fields:[
    defineField({name:"title",type:"string",validation:r=>r.required()}),
    defineField({name:"slug",type:"slug",options:{source:"title"},validation:r=>r.required()}),
    defineField({name:"kicker",type:"string"}),
    defineField({name:"summary",type:"text",rows:3}),
    defineField({
      name:"placeType",type:"string",
      options:{list:[
        {title:"Course",value:"course"},
        {title:"Stay",value:"stay"},
        {title:"Eat",value:"eat"},
        {title:"Do",value:"do"}
      ]}
    }),
    defineField({name:"destination",type:"reference",to:[{type:"destination"}]}),
    defineField({name:"whyWeLikeIt",type:"text",rows:6}),
    defineField({name:"heroImage",type:"image",options:{hotspot:true}}),
    defineField({name:"website",type:"url"})
  ]
});
