import { defineField, defineType } from "sanity";
export const person = defineType({
  name:"person",title:"Person",type:"document",
  fields:[
    defineField({name:"title",type:"string",validation:r=>r.required()}),
    defineField({name:"slug",type:"slug",options:{source:"title"},validation:r=>r.required()}),
    defineField({name:"summary",type:"text"}),
    defineField({name:"portrait",type:"image",options:{hotspot:true}}),
    defineField({name:"links",type:"array",of:[{type:"url"}]})
  ]
});
