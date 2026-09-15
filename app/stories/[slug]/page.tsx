import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStory } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";
import { StoryBody } from "@/components/StoryBody";
import { StoryRelationIndex } from "@/components/StoryRelationIndex";
import { StoryPlaceBridge } from "@/components/StoryPlaceBridge";
import { contentHref } from "@/components/ContentCard";
import { splitStoryRelations } from "@/lib/story-relations";

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
  const { places, destinations, people } = splitStoryRelations(related);
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
          <StoryRelationIndex related={related} />
        </aside>
        <article className="articleBody">
          <StoryBody value={story.body} />
        </article>
      </div>

      <StoryPlaceBridge places={places} />

      {destinations.length > 0 && (
        <section className="section storyKeepExploring">
          <div className="container">
            <div className="eyebrow lime">KEEP EXPLORING.</div>
            <div className="storyKeepExploringList">
              {destinations.map(destination => (
                <Link key={destination.id} href={contentHref(destination)} className="storyKeepExploringItem">
                  <span>{destination.title}</span>
                  <span className="storyKeepExploringCta">Explore the destination →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section className="section storyPeopleContinuation">
          <div className="container">
            <div className="eyebrow pink">PEOPLE TO KNOW</div>
            <div className="storyPeopleList">
              {people.map(person => (
                <Link key={person.id} href={contentHref(person)} className="storyPeopleItem">
                  <span>{person.title}</span>
                  <span className="storyPeopleCta">VIEW PROFILE →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// AROUND editorial freshness: refresh published Sanity content without a redeploy.
export const revalidate = 30;

// AROUND CMS routing: allow newly published Sanity slugs without a redeploy.
export const dynamicParams = true;
