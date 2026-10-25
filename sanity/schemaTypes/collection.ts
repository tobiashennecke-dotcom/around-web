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
      name:"format",title:"Form",type:"string",group:"basics",initialValue:"selection",
      options:{list:[{title:"Auswahl (Kacheln)",value:"selection"},{title:"Route (Tag für Tag)",value:"route"}],layout:"radio"},
      description:"Route zeigt die Collection als Plan mit Tagen, z. B. ein langes Wochenende."
    }),
    defineField({
      name:"intro",title:"Einstieg",type:"text",rows:3,group:"basics",
      hidden:({document}:any)=>document?.format!=="route",
      validation:r=>r.max(400)
    }),
    defineField({
      name:"days",title:"Tage",type:"array",group:"content",
      hidden:({document}:any)=>document?.format!=="route",
      description:"2 bis 7 Tage. Jeder Tag zeigt seine Einträge in dieser Reihenfolge.",
      validation:r=>r.custom((days:any,context:any)=>{
        if(context?.document?.format!=="route") return true;
        const count=Array.isArray(days)?days.length:0;
        if(count<2) return "Eine Route braucht mindestens zwei Tage.";
        if(count>7) return "Höchstens sieben Tage.";
        return true;
      }),
      of:[{
        type:"object",name:"collectionDay",title:"Tag",
        fields:[
          defineField({name:"label",title:"Label",type:"string",description:"z. B. Tag 1 · Radstadt",validation:r=>r.required().max(24)}),
          defineField({name:"title",title:"Überschrift",type:"string",description:"Optional, z. B. Die Gondel",validation:r=>r.max(60)}),
          defineField({name:"text",title:"Text",type:"text",rows:3,validation:r=>r.max(300)}),
          defineField({
            name:"items",title:"Einträge",type:"array",
            validation:r=>r.required().min(1).max(6),
            of:[{type:"reference",to:[{type:"place"},{type:"story"},{type:"destination"}]}]
          })
        ],
        preview:{
          select:{label:"label",title:"title",items:"items"},
          prepare({label,title,items}:any){
            const count=Array.isArray(items)?items.length:0;
            return {title:[label,title].filter(Boolean).join(" · ")||"Tag",subtitle:`${count} Einträge`};
          }
        }
      }]
    }),
    defineField({
      name:"items",title:"Curated items",type:"array",group:"content",
      description:"Order matters: this is the editorial sequence shown on the collection page. Bei einer Route nur nötig, wenn keine Tage angelegt sind.",
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
