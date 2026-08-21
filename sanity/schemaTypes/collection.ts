import { defineField, defineType } from "sanity";

export const collection = defineType({
  name:"collection",title:"Collection",type:"document",
  groups:[
    {name:"basics",title:"Basics",default:true},
    {name:"content",title:"Items"},
    {name:"publishing",title:"Publishing"},
    {name:"seo",title:"SEO"}
  ],
  fields:[
    defineField({name:"title",title:"Title",type:"string",group:"basics",validation:r=>r.required()}),
    defineField({name:"slug",title:"Slug",type:"slug",group:"basics",options:{source:"title"},validation:r=>r.required()}),
    defineField({name:"kicker",title:"Kicker / Eyebrow",type:"string",group:"basics"}),
    defineField({name:"summary",title:"Teaser",type:"text",rows:3,group:"basics"}),
    defineField({
      name:"heroImage",title:"Hero image",type:"image",group:"basics",options:{hotspot:true},fields:[
        defineField({name:"alt",title:"Alt text",type:"string"}),
        defineField({name:"credit",title:"Credit",type:"string"})
      ]
    }),
    defineField({
      name:"items",title:"Curated items",type:"array",group:"content",
      description:"Order matters: this is the editorial sequence shown on the collection page.",
      of:[{type:"reference",to:[
        {type:"destination"},{type:"place"},{type:"story"},{type:"person"},{type:"product"}
      ]}]
    }),
    defineField({name:"featured",title:"Featured",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"priority",title:"Editorial priority",type:"number",group:"publishing",initialValue:50,validation:r=>r.min(0).max(100)}),
    defineField({name:"seoTitle",title:"SEO title",type:"string",group:"seo",validation:r=>r.max(60)}),
    defineField({name:"seoDescription",title:"SEO description",type:"text",rows:3,group:"seo",validation:r=>r.max(160)}),
    defineField({name:"socialImage",title:"Social image",type:"image",group:"seo",options:{hotspot:true}})
  ],
  preview:{select:{title:"title",subtitle:"kicker",media:"heroImage"}}
});
