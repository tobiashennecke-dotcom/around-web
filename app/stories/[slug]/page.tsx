import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStory } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";
import { StoryBody } from "@/components/StoryBody";
import { contentHref } from "@/components/ContentCard";
import type { ContentCard } from "@/lib/types";

function typeLabel(item: ContentCard) {
  if (item.type === "destination") return "Destination";
  if (item.type === "place") return "Place";
  if (item.type === "person") return "Person";
  if (item.type === "product") return "Object";
  if (item.type === "collection") return "Collection";
  return "Story";
}

function formatDate(value?:string){
  if(!value) return null;
  return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(value));
}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const story=await getStory(slug);
  if(!story) return {};
  const title=story.seoTitle || `${story.title} — AROUND`;
  const description=story.seoDescription || story.deck;
  const image=story.socialImage || story.image;
  return {title,description,openGraph:{title,description,type:"article",images:image?[image]:undefined}};
}

export default async function StoryPage({ params }: { params: Promise<{slug:string}>}) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();
  const related = story.related || [];
  const date=formatDate(story.publishedAt);

  return (
    <main>
      <section className="section storyHero">
        <div className="container">
          <span className="tag blue">{story.format || story.kicker || "Story"}</span>
          <h1 className="serif" style={{fontSize:"clamp(60px,8vw,114px)",lineHeight:.88,letterSpacing:"-.05em",margin:"18px 0 28px",maxWidth:1160}}>
            {story.title}
          </h1>
          <p style={{fontSize:26,lineHeight:1.18,maxWidth:780}}>{story.deck}</p>
          <div className="storyMeta">
            {story.author && <span>Von {story.author.title}</span>}
            {date && <span>{date}</span>}
            {story.readingTime && <span>{story.readingTime} Min. Lesezeit</span>}
          </div>
        </div>
      </section>

      {story.image && (
        <div className="storyHeroImage"><img src={story.image} alt="" /></div>
      )}

      <div className="article">
        <aside>
          <div className="eyebrow">AROUND Editorial</div>
          {story.author && <div className="authorMini"><strong>{story.author.title}</strong>{story.author.role && <span>{story.author.role}</span>}</div>}
          <div style={{marginTop:22}}>
            <SaveButton sourceId={story.id} sourceType={story.type} title={story.title} slug={story.slug} label="Story merken" />
          </div>
        </aside>
        <article className="articleBody">
          <StoryBody value={story.body} />

          {related.length > 0 && (
            <div className="inStory">
              <div className="eyebrow lime">IN THIS STORY</div>
              <h3 style={{fontSize:32}}>Weiterentdecken</h3>
              {related.map(item => (
                <p key={item.id}>
                  <Link href={contentHref(item)}>{item.title} <span>· {typeLabel(item)} →</span></Link>
                </p>
              ))}
            </div>
          )}
        </article>
      </div>
    </main>
  );
}
