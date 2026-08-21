import { defineField, defineType } from "sanity";

export const story = defineType({
  name:"story",
  title:"Story",
  type:"document",
  groups:[
    {name:"basics",title:"Basics",default:true},
    {name:"content",title:"Story body"},
    {name:"relations",title:"Connections"},
    {name:"publishing",title:"Publishing"},
    {name:"seo",title:"SEO"}
  ],
  fields:[
    defineField({name:"title",title:"Title",type:"string",group:"basics",validation:r=>r.required()}),
    defineField({name:"slug",title:"Slug",type:"slug",group:"basics",options:{source:"title"},validation:r=>r.required()}),
    defineField({
      name:"format",title:"AROUND format",type:"string",group:"basics",
      options:{list:[
        {title:"Worth the Trip",value:"worth-the-trip"},
        {title:"48 Hours",value:"48-hours"},
        {title:"Local Knowledge",value:"local-knowledge"},
        {title:"People to Know",value:"people-to-know"},
        {title:"Course Correction",value:"course-correction"},
        {title:"The Good Stuff",value:"the-good-stuff"},
        {title:"Next",value:"next"},
        {title:"After 18",value:"after-18"},
        {title:"Manifest",value:"manifest"},
        {title:"Story",value:"story"}
      ]},
      initialValue:"story"
    }),
    defineField({name:"kicker",title:"Kicker / Eyebrow",type:"string",group:"basics"}),
    defineField({name:"deck",title:"Deck / Teaser",type:"text",rows:4,group:"basics"}),
    defineField({name:"author",title:"Author",type:"reference",group:"basics",to:[{type:"person"}]}),
    defineField({name:"publishedAt",title:"Publication date",type:"datetime",group:"basics",initialValue:()=>new Date().toISOString()}),
    defineField({name:"readingTime",title:"Reading time (minutes)",type:"number",group:"basics",validation:r=>r.min(1).max(60)}),
    defineField({
      name:"heroImage",title:"Hero image",type:"image",group:"basics",options:{hotspot:true},
      fields:[
        defineField({name:"alt",title:"Alt text",type:"string",description:"Important for accessibility and SEO.",options:{isHighlighted:true}}),
        defineField({name:"caption",title:"Caption",type:"string"}),
        defineField({name:"credit",title:"Credit",type:"string"})
      ]
    }),

    defineField({
      name:"body",title:"Story",type:"array",group:"content",
      of:[
        {
          type:"block",
          styles:[
            {title:"Normal",value:"normal"},
            {title:"Heading 2",value:"h2"},
            {title:"Heading 3",value:"h3"},
            {title:"Pull quote",value:"pullQuote"},
            {title:"Quote",value:"blockquote"}
          ],
          marks:{
            decorators:[
              {title:"Strong",value:"strong"},
              {title:"Emphasis",value:"em"}
            ],
            annotations:[
              {name:"link",title:"External link",type:"object",fields:[
                {name:"href",title:"URL",type:"url"},
                {name:"blank",title:"Open in new tab",type:"boolean",initialValue:true}
              ]}
            ]
          }
        },
        {
          type:"image",title:"Editorial image",options:{hotspot:true},
          fields:[
            {name:"alt",title:"Alt text",type:"string",description:"Important for accessibility and SEO.",options:{isHighlighted:true}},
            {name:"caption",title:"Caption",type:"string"},
            {name:"credit",title:"Credit",type:"string"},
            {name:"layout",title:"Layout",type:"string",options:{list:[
              {title:"Article width",value:"article"},
              {title:"Wide",value:"wide"},
              {title:"Full bleed",value:"full"}
            ]},initialValue:"wide"}
          ]
        }
      ]
    }),

    defineField({
      name:"related",title:"IN THIS STORY",type:"array",group:"relations",
      description:"Curated objects that the reader can continue into after / during the story.",
      of:[{type:"reference",to:[
        {type:"destination"},{type:"place"},{type:"person"},{type:"product"},{type:"collection"}
      ]}]
    }),

    defineField({name:"featured",title:"Featured",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"aroundSelected",title:"AROUND Selected",type:"boolean",group:"publishing",initialValue:false}),
    defineField({name:"priority",title:"Editorial priority",type:"number",group:"publishing",initialValue:50,validation:r=>r.min(0).max(100)}),

    defineField({name:"seoTitle",title:"SEO title",type:"string",group:"seo",validation:r=>r.max(60)}),
    defineField({name:"seoDescription",title:"SEO description",type:"text",rows:3,group:"seo",validation:r=>r.max(160)}),
    defineField({name:"socialImage",title:"Social image",type:"image",group:"seo",options:{hotspot:true}})
  ],
  preview:{
    select:{title:"title",format:"format",date:"publishedAt",media:"heroImage"},
    prepare({title,format,date,media}){
      const dateLabel=date?new Date(date).toLocaleDateString("de-DE"):"Draft";
      return {title,subtitle:`${format||"Story"} · ${dateLabel}`,media};
    }
  }
});
