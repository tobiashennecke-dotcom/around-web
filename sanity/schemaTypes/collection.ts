import { defineField, defineType } from "sanity";
export const collection = defineType({
  name:"collection",title:"Collection",type:"document",
  fields:[
    defineField({name:"title",type:"string",validation:r=>r.required()}),
    defineField({name:"slug",type:"slug",options:{source:"title"},validation:r=>r.required()}),
    defineField({name:"kicker",type:"string"}),
    defineField({name:"summary",type:"text",rows:3}),
    defineField({name:"heroImage",type:"image",options:{hotspot:true}}),
    defineField({
      name:"items",type:"array",
      of:[{type:"reference",to:[
        {type:"destination"},{type:"place"},{type:"story"},{type:"person"},{type:"product"}
      ]}]
    })
  ]
});
