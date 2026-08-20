import { notFound } from "next/navigation";
import Link from "next/link";
import { getStory } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";

export default async function StoryPage({ params }: { params: Promise<{slug:string}>}) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  return (
    <main>
      <section className="section">
        <div className="container">
          <span className="tag blue">{story.kicker}</span>
          <h1 className="serif" style={{fontSize:"clamp(60px,8vw,114px)",lineHeight:.88,letterSpacing:"-.05em",margin:"18px 0 28px",maxWidth:1160}}>
            {story.title}
          </h1>
          <p style={{fontSize:26,lineHeight:1.18,maxWidth:780}}>{story.deck}</p>
        </div>
      </section>

      <div className="article">
        <aside>
          <div className="eyebrow">AROUND Editorial</div>
          <div style={{marginTop:22}}>
            <SaveButton sourceId={story.id} sourceType={story.type} title={story.title} slug={story.slug} label="Story merken" />
          </div>
        </aside>
        <article className="articleBody">
          <p>{story.body[0]}</p>
          <p>{story.body[1]}</p>
          <div className="pull">Die Runde ist nicht das Ziel der Reise. Sie ist der Anfang von ihr.</div>
          <h2>Editorial wird Discovery.</h2>
          <p>{story.body[2]}</p>
          <div className="inStory">
            <div className="eyebrow lime">IN THIS STORY</div>
            <h3 style={{fontSize:32}}>Weiterentdecken</h3>
            <p><Link href="/destinations/lisbon">Lisbon →</Link></p>
            <p><Link href="/places/oitavos-dunes">Oitavos Dunes →</Link></p>
            <p><Link href="/places/prado">Prado →</Link></p>
          </div>
        </article>
      </div>
    </main>
  );
}
