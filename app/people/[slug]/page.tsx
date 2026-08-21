import {notFound} from "next/navigation";
import {getPerson} from "@/lib/content";
import {SaveButton} from "@/components/SaveButton";
import {StoryBody} from "@/components/StoryBody";

export default async function PersonPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const person=await getPerson(slug);
  if(!person) notFound();
  return <main>
    <section className="hero peopleHero" style={person.image?{backgroundImage:`linear-gradient(rgba(18,20,19,.2),rgba(18,20,19,.82)),url(${person.image})`}:undefined}>
      <div className="container"><div className="eyebrow pink">PEOPLE TO KNOW</div><h1>{person.title.toUpperCase()}</h1><p className="heroIntro">{person.description}</p><div className="heroActions"><SaveButton sourceId={person.id} sourceType={person.type} title={person.title} slug={person.slug} label="Person merken"/></div></div>
    </section>
    <section className="section"><div className="container editorialGrid"><div><div className="eyebrow pink">{person.role || "Person"}</div><h2 className="sectionTitle">Perspektive<br/>zählt.</h2>{person.location&&<p>{person.location}</p>}</div><div className="articleBody"><StoryBody value={person.bio||[]} />{person.website&&<p><a href={person.website} target="_blank" rel="noreferrer">Website ↗</a></p>}{person.instagram&&<p><a href={person.instagram} target="_blank" rel="noreferrer">Instagram ↗</a></p>}</div></div></section>
  </main>;
}
