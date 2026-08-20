import { defineField, defineType } from "sanity";
export const objectType = defineType({
  name:"object",title:"Object / Product",type:"document",
  fields:[
    defineField({name:"title",type:"string",validation:r=>r.required()}),
    defineField({name:"slug",type:"slug",options:{source:"title"},validation:r=>r.required()}),
    defineField({name:"summary",type:"text"}),
    defineField({name:"category",type:"string"}),
    defineField({name:"image",type:"image",options:{hotspot:true}}),
    defineField({name:"url",type:"url"})
  ]
});
