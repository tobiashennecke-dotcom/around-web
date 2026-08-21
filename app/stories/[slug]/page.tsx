import { notFound } from "next/navigation";
import Link from "next/link";
import { getStory } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";
import type { ContentCard } from "@/lib/types";

function href(item: ContentCard) {
  if (item.type === "destination") return `/destinations/${item.slug}`;
  if (item.type === "place") return `/places/${item.slug}`;
  if (item.type === "story") return `/stories/${item.slug}`;
  if (item.type === "collection") return `/collections/${item.slug}`;
  return "/discover";
}

function typeLabel(item: ContentCard) {
  if (item.type === "destination") return "Destination";
  if (item.type === "place") return "Place";
  if (item.type === "person") return "Person";
  if (item.type === "product") return "Object";
  if (item.type === "collection") return "Collection";
  return "Story";
}

export default async function StoryPage({ params }: { params: Promise<{slug:string}>}) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();
  const related = story.related || [];
  const [first, second, third, ...rest] = story.body;

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
          {first && <p>{first}</p>}
          {second && <p>{second}</p>}
          <div className="pull">Die Runde ist nicht das Ziel der Reise. Sie ist der Anfang von ihr.</div>
          <h2>Editorial wird Discovery.</h2>
          {third && <p>{third}</p>}

          {related.length > 0 && (
            <div className="inStory">
              <div className="eyebrow lime">IN THIS STORY</div>
              <h3 style={{fontSize:32}}>Weiterentdecken</h3>
              {related.map(item => (
                <p key={item.id}>
                  <Link href={href(item)}>{item.title} <span>· {typeLabel(item)} →</span></Link>
                </p>
              ))}
            </div>
          )}

          {rest.map((paragraph, index) => <p key={`${story.id}-rest-${index}`}>{paragraph}</p>)}
        </article>
      </div>
    </main>
  );
}
