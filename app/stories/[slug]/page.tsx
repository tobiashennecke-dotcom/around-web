import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStory } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";
import { StoryBody } from "@/components/StoryBody";
import { StoryRelationIndex } from "@/components/StoryRelationIndex";
import { StoryPlaceBridge } from "@/components/StoryPlaceBridge";
import { PremiumStoryGate } from "@/components/PremiumStoryGate";
import { PremiumAccessBadge } from "@/components/PremiumAccessBadge";
import { contentHref } from "@/components/ContentCard";
import { splitStoryRelations } from "@/lib/story-relations";
import { hasEntitlement } from "@/lib/access/entitlements";
import { resolveStoryAccessState, splitStoryBodyAtPremiumGate } from "@/lib/story-access";
import { StoryReadingProgress } from "@/components/StoryReadingProgress";
import { StoryReadAloud } from "@/components/StoryReadAloud";
import { getReadAloud, getStoryChapters, MIN_CHAPTERS, type StoryChapter } from "@/lib/story-modules";
import { isDraftPreview } from "@/lib/sanity/read-client";

function ChapterNav({ chapters, className }: { chapters: StoryChapter[]; className: string }) {
  return (
    <nav className={`storyChapters ${className}`} aria-label="Kapitel">
      <div className="eyebrow">Kapitel</div>
      <ol>
        {chapters.map((chapter, index) => (
          <li key={chapter.id}><a href={`#${chapter.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{chapter.title}</a></li>
        ))}
      </ol>
    </nav>
  );
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
  const { places, destinations, people } = splitStoryRelations(related);
  const date=formatDate(story.publishedAt);

  // Server-side access decision: no entitlement query for Free Stories at
  // all. hasEntitlement() only ever asks "read_premium_stories" - never
  // plan/subscriptionStatus.
  const entitled = story.accessTier === "premium" ? await hasEntitlement("read_premium_stories") : false;
  const accessState = resolveStoryAccessState({ accessTier: story.accessTier, hasPremiumEntitlement: entitled });
  const locked = accessState === "premium-locked";

  // A locked reader must never receive afterGate blocks through any
  // component - visibleBody is the only body value ever rendered, and a
  // malformed Premium Story (no gate) fails closed to zero body blocks
  // rather than leaking the full text.
  let visibleBody: unknown[] = story.body;
  if (locked) {
    const split = splitStoryBodyAtPremiumGate(story.body);
    visibleBody = split.hasGate ? split.beforeGate : [];
  }

  const chapters = getStoryChapters(visibleBody);
  const showChapters = chapters.length >= MIN_CHAPTERS;
  const readAloud = getReadAloud(visibleBody);
  const firstDestination = destinations[0];
  const draftPreview = await isDraftPreview();

  return (
    <main>
      <StoryReadingProgress />
      {draftPreview && (
        <div className="storyDraftBanner" role="status">
          <span>Vorschau mit Entwürfen. Nur für dich sichtbar.</span>
          <a href="/api/draft-mode/disable">Vorschau beenden</a>
        </div>
      )}
      <section className="section storyHero">
        <div className="container">
          <div className="storyHeroTags">
            <span className="tag blue">{story.format || story.kicker || "Story"}</span>
            {story.accessTier === "premium" && <PremiumAccessBadge />}
          </div>
          <h1 className="storyTitle">
            {story.title}
          </h1>
          <p style={{fontSize:26,lineHeight:1.18,maxWidth:780}}>{story.deck}</p>
          <div className="storyMeta">
            {story.author && <span>Von {story.author.title}</span>}
            {date && <span>{date}</span>}
            {story.readingTime && <span>{story.readingTime} Min. Lesezeit</span>}
            {story.disclosure && <a href="#hinweis-zur-recherche" className="storyMetaLink">Hinweis zur Recherche</a>}
          </div>
          {readAloud && (
            <div className="storyMetaActions">
              <StoryReadAloud
                src={readAloud.embed.src}
                provider={readAloud.embed.provider}
                title={readAloud.title}
                speaker={readAloud.speaker}
                duration={readAloud.duration}
                height={readAloud.embed.height}
              />
            </div>
          )}
        </div>
      </section>

      {story.image && (
        <figure className="storyHeroFigure">
          <div className="storyHeroImage"><img src={story.image} alt={story.imageAlt || ""} /></div>
          {(story.imageCaption || story.imageCredit) && (
            <figcaption className="storyHeroCaption">
              {story.imageCaption && <span>{story.imageCaption}</span>}
              {story.imageCredit && <small>Foto: {story.imageCredit}</small>}
            </figcaption>
          )}
        </figure>
      )}

      <div className="article">
        <aside>
          <div className="eyebrow">AROUND Editorial</div>
          {story.author && <div className="authorMini"><strong>{story.author.title}</strong>{story.author.role && <span>{story.author.role}</span>}</div>}
          <div style={{marginTop:22}}>
            <SaveButton sourceId={story.id} sourceType={story.type} title={story.title} slug={story.slug} label="Story merken" />
          </div>
          {showChapters && <ChapterNav chapters={chapters} className="storyChapters--aside" />}
          <StoryRelationIndex related={related} />
        </aside>
        <article className="articleBody">
          {showChapters && <ChapterNav chapters={chapters} className="storyChapters--inline" />}
          <StoryBody value={visibleBody} />
          {locked && <PremiumStoryGate />}
          {readAloud?.transcript && (
            <details className="storyTranscript">
              <summary>Transkript der Vorlesefassung</summary>
              <p>{readAloud.transcript}</p>
            </details>
          )}
          {story.disclosure && (
            <p id="hinweis-zur-recherche" className="storyDisclosure"><strong>Hinweis zur Recherche:</strong> {story.disclosure}</p>
          )}
        </article>
      </div>

      <StoryPlaceBridge places={places} tripTitle={firstDestination?.title || story.title} destinationSourceId={firstDestination?.id} />

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

// v1.26f: Premium access is user-specific (it depends on the requesting
// user's own entitlement), so this route can no longer use ISR - a cached
// response rendered for one user's entitlement must never be served to a
// different user. Every request is rendered fresh; there is no revalidate
// window to keep here. Public Story-list pages (e.g. /stories) are
// unaffected and may keep their own normal caching.
export const dynamic = "force-dynamic";

// AROUND CMS routing: allow newly published Sanity slugs without a redeploy.
export const dynamicParams = true;
