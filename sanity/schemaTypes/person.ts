import { defineField, defineType } from "sanity";

export const person = defineType({
  name:"person",title:"Person",type:"document",
  groups:[
    {name:"basics",title:"Basics",default:true},
    {name:"editorial",title:"Editorial"},
    {name:"links",title:"Links"},
    {name:"publishing",title:"Publishing"}
  ],
  fields:[
    defineField({name:"title",title:"Name",type:"string",group:"basics",validation:r=>r.required()}),
    defineField({name:"slug",title:"Slug",type:"slug",group:"basics",options:{source:"title"},validation:r=>r.required()}),
    defineField({name:"role",title:"Role / Description",type:"string",group:"basics"}),
    defineField({name:"location",title:"Location",type:"string",group:"basics"}),
    defineField({name:"summary",title:"Teaser",type:"text",rows:3,group:"basics"}),
    defineField({
      name:"portrait",title:"Portrait",type:"image",group:"basics",options:{hotspot:true},
      fields:[
        defineField({name:"alt",title:"Alt text",type:"string",options:{isHighlighted:true}}),
        defineField({name:"credit",title:"Credit",type:"string"})
      ]
    }),
    defineField({
      name:"bio",title:"Bio / Profile",type:"array",group:"editorial",of:[{
        type:"block",styles:[
          {title:"Normal",value:"normal"},{title:"Heading 2",value:"h2"},{title:"Quote",value:"blockquote"}
        ]
      }]
    }),
    defineField({name:"website",title:"Website",type:"url",group:"links"}),
    defineField({name:"instagram",title:"Instagram URL",type:"url",group:"links"}),
    defineField({name:"featured",title:"Featured",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"priority",title:"Editorial priority",type:"number",group:"publishing",initialValue:50,validation:r=>r.min(0).max(100)})
  ],
  preview:{select:{title:"title",subtitle:"role",media:"portrait"}}
});
