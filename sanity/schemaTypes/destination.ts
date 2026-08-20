import { defineField, defineType } from "sanity";

export const destination = defineType({
  name: "destination",
  title: "Destination",
  type: "document",
  fields: [
    defineField({ name:"title", type:"string", validation:r=>r.required() }),
    defineField({ name:"slug", type:"slug", options:{source:"title"}, validation:r=>r.required() }),
    defineField({ name:"kicker", type:"string" }),
    defineField({ name:"summary", type:"text", rows:3 }),
    defineField({ name:"country", type:"string" }),
    defineField({ name:"coordinates", type:"geopoint" }),
    defineField({ name:"whyGo", type:"text", rows:6 }),
    defineField({ name:"heroImage", type:"image", options:{hotspot:true} }),
    defineField({ name:"places", type:"array", of:[{type:"reference",to:[{type:"place"}]}] }),
    defineField({ name:"stories", type:"array", of:[{type:"reference",to:[{type:"story"}]}] })
  ]
});
