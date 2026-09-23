import "./people.css";
import {notFound} from "next/navigation";
import {getPerson} from "@/lib/content";
import {SaveButton} from "@/components/SaveButton";
import {StoryBody} from "@/components/StoryBody";
import {StoryRail} from "@/components/StoryRail";

export default async function PersonPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const person=await getPerson(slug);
  if(!person) notFound();
  return <main className="personPage">
    <section className="hero peopleHero" style={person.image?{backgroundImage:`url(${person.image})`}:undefined}>
      <div className="container personHeroInner"><div className="eyebrow pink personHeroEyebrow">PEOPLE TO KNOW</div><h1>{person.title.toUpperCase()}</h1><p className="heroIntro personHeroIntro">{person.description}</p><div className="heroActions personHeroActions"><SaveButton sourceId={person.id} sourceType={person.type} title={person.title} slug={person.slug} label="Person merken"/></div></div>
    </section>
    <section className="section personEditorial"><div className="container editorialGrid personEditorialGrid"><div className="personEditorialAside"><div className="eyebrow pink">{person.role || "Person"}</div><h2 className="sectionTitle">Perspektive<br/>zählt.</h2>{person.location&&<p className="personLocation">{person.location}</p>}</div><div className="articleBody personBio"><StoryBody value={person.bio||[]} />{person.website&&<p><a href={person.website} target="_blank" rel="noreferrer">Website ↗</a></p>}{person.instagram&&<p><a href={person.instagram} target="_blank" rel="noreferrer">Instagram ↗</a></p>}</div></div></section>
    <StoryRail
      className="personStories"
      stories={person.stories || []}
      eyebrow="STORIES"
      title={`WITH & ABOUT ${person.title.toUpperCase()}.`}
    />
  </main>;
}

// AROUND editorial freshness: refresh published Sanity content without a redeploy.
export const revalidate = 30;

// AROUND CMS routing: allow newly published Sanity slugs without a redeploy.
export const dynamicParams = true;
