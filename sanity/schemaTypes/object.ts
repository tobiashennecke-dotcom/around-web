import { defineField, defineType } from "sanity";

export const objectType = defineType({
  name:"product",title:"Object / Product",type:"document",
  groups:[
    {name:"basics",title:"Basics",default:true},
    {name:"editorial",title:"Editorial"},
    {name:"publishing",title:"Publishing"}
  ],
  fields:[
    defineField({name:"title",title:"Title",type:"string",group:"basics",validation:r=>r.required()}),
    defineField({name:"slug",title:"Slug",type:"slug",group:"basics",options:{source:"title"},validation:r=>r.required()}),
    defineField({name:"brand",title:"Brand / Maker",type:"string",group:"basics"}),
    defineField({
      name:"category",title:"Category",type:"string",group:"basics",options:{list:[
        {title:"Gear",value:"gear"},{title:"Design",value:"design"},{title:"Tech",value:"tech"},
        {title:"Book / Media",value:"media"},{title:"App",value:"app"},{title:"Other",value:"other"}
      ]}
    }),
    defineField({name:"summary",title:"Teaser",type:"text",rows:3,group:"basics"}),
    defineField({
      name:"image",title:"Image",type:"image",group:"basics",options:{hotspot:true},fields:[
        defineField({name:"alt",title:"Alt text",type:"string"}),
        defineField({name:"credit",title:"Credit",type:"string"})
      ]
    }),
    defineField({name:"whyItMatters",title:"Why it matters",type:"text",rows:6,group:"editorial"}),
    defineField({name:"url",title:"External URL",type:"url",group:"basics"}),
    defineField({name:"aroundSelected",title:"AROUND Selected",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"featured",title:"Featured",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"priority",title:"Editorial priority",type:"number",group:"publishing",initialValue:50,validation:r=>r.min(0).max(100)})
  ],
  preview:{select:{title:"title",brand:"brand",category:"category",media:"image",selected:"aroundSelected"},prepare({title,brand,category,media,selected}){return{title:selected?`✓ ${title}`:title,subtitle:[brand,category].filter(Boolean).join(" · "),media}}}
});
