import "./destination.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDestination } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";
import { ContentCard } from "@/components/ContentCard";
import { StoryRail } from "@/components/StoryRail";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const destination=await getDestination(slug);
  if(!destination) return {};
  const title=destination.seoTitle || `${destination.title} — AROUND`;
  const description=destination.seoDescription || destination.description;
  const image=destination.socialImage || destination.image;
  return {title,description,openGraph:{title,description,images:image?[image]:undefined}};
}

export default async function DestinationPage({ params }: { params: Promise<{ slug:string }> }) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) notFound();
  const linkedPlaces = destination.places || [];
  const linkedStories = destination.stories || [];
  const roleSections = [
    { id: "play", title: "PLAY", roles: ["course"] },
    { id: "stay", title: "STAY", roles: ["stay"] },
    { id: "eat", title: "EAT", roles: ["eat", "drink"] },
    { id: "do", title: "DO", roles: ["do", "culture", "shop"] }
  ].map(section => ({
    ...section,
    items: linkedPlaces.filter(place => section.roles.includes(place.placeType || ""))
  })).filter(section => section.items.length > 0);
  const otherPlaces = linkedPlaces.filter(place =>
    !["course", "stay", "eat", "drink", "do", "culture", "shop"].includes(place.placeType || "")
  );

  return (
    <main className="destinationPage">
      <section
        className={`hero destinationHero ${destination.image ? "heroWithImage" : ""}`}
        style={destination.image ? {backgroundImage:`url(${destination.image})`} : undefined}
      >
        <div className="container">
          <div className="eyebrow lime destinationHeroEyebrow">{destination.aroundSelected ? "AROUND SELECTED · " : ""}{destination.kicker}</div>
          <h1>{destination.title.toUpperCase()}</h1>
          <p className="heroIntro destinationHeroIntro">{destination.description}</p>
          {destination.bestFor && destination.bestFor.length > 0 && (
            <div className="metaPills">{destination.bestFor.map(item=><span key={item}>{item}</span>)}</div>
          )}
          <div className="heroActions">
            <SaveButton sourceId={destination.id} sourceType={destination.type} title={destination.title} slug={destination.slug} label={`${destination.title} merken`} />
            <Link href="#play" className="primary">Entdecken →</Link>
          </div>
        </div>
      </section>

      <section className="section destinationWhySection">
        <div className="container editorialGrid destinationWhyGrid">
          <div>
            <div className="eyebrow lime">WHY GO</div>
            <h2 className="sectionTitle destinationWhyHeading">WARUM<br/>HIN?</h2>
            <p className="destinationWhyCopy">{destination.whyGo}</p>
          </div>
          <div className="destinationTake">
            <div className="eyebrow lime destinationTakeLabel">AROUND TAKE</div>
            <p className="destinationTakeQuote">
              „{destination.aroundTake || "Eine Destination ist dann gut, wenn die Runde nicht der einzige Grund war, hinzufahren."}“
            </p>
          </div>
        </div>
      </section>

      <section className="section destinationAroundSection" id="play">
        <div className="container">
          <div className="eyebrow lime">PLAY / STAY / EAT / DO</div>
          <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>AROUND IT.</h2>
          {linkedPlaces.length > 0 ? (
            <div className="destinationRoleSections">
              {roleSections.map(section => (
                <section key={section.id} aria-labelledby={`destination-${section.id}`} className="destinationRoleSection">
                  <h3 id={`destination-${section.id}`} className="destinationRoleTitle">{section.title}</h3>
                  <div className="cardGrid">{section.items.map(item => <ContentCard key={item.id} item={item}/>)}</div>
                </section>
              ))}
              {otherPlaces.length > 0 && (
                <section aria-labelledby="destination-more" className="destinationRoleSection">
                  <h3 id="destination-more" className="destinationRoleTitle">MORE</h3>
                  <div className="cardGrid">{otherPlaces.map(item => <ContentCard key={item.id} item={item}/>)}</div>
                </section>
              )}
            </div>
          ) : (
            <p>Noch keine Places mit dieser Destination verknüpft.</p>
          )}
        </div>
      </section>

      <StoryRail
        stories={linkedStories}
        eyebrow="STORIES FROM HERE"
        title="READ THE PLACE."
      />
    </main>
  );
}

// AROUND editorial freshness: refresh published Sanity content without a redeploy.
export const revalidate = 30;

// AROUND CMS routing: allow newly published Sanity slugs without a redeploy.
export const dynamicParams = true;
