import { defineField, defineType } from "sanity";

export const story = defineType({
  name:"story",
  title:"Story",
  type:"document",
  fields:[
    defineField({name:"title",type:"string",validation:r=>r.required()}),
    defineField({name:"slug",type:"slug",options:{source:"title"},validation:r=>r.required()}),
    defineField({name:"kicker",type:"string"}),
    defineField({name:"deck",type:"text",rows:4}),
    defineField({name:"heroImage",type:"image",options:{hotspot:true}}),
    defineField({
      name:"body",type:"array",
      of:[
        {type:"block"},
        {type:"image",options:{hotspot:true}}
      ]
    }),
    defineField({
      name:"related",type:"array",
      of:[{type:"reference",to:[
        {type:"destination"},{type:"place"},{type:"person"},{type:"object"},{type:"collection"}
      ]}]
    })
  ]
});
