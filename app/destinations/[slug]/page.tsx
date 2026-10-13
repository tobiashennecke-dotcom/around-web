import "./destination.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDestination } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";
import { ContentCard } from "@/components/ContentCard";
import { StoryRail } from "@/components/StoryRail";
import { LisbonTripImport } from "@/components/LisbonTripImport";

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

      {slug === "lisbon" && (
        <section className="section destination48" id="48-hours" aria-labelledby="destination48-heading">
          <div className="container">
            <div className="eyebrow lime">THE AROUND EDIT / 48 HOURS</div>
            <div className="destination48Intro">
              <h2 className="sectionTitle" id="destination48-heading">48 HOURS.<br/>LISSABON & CASCAIS.</h2>
              <p>Ein Wochenende zwischen Atlantik, Fairways und Stadtleben. Kein eng getakteter Stundenplan – sondern zwei kuratierte Tage, die Platz für eigene Entdeckungen lassen.</p>
            </div>
            <div className="destination48Days">
              {[
                { day:"01", label:"ANKOMMEN & ATLANTIK", summary:"Küste zuerst. Die Stadt läuft dir nicht weg.", stops:[
                  { period:"NACHMITTAG", slug:"boca-do-inferno-cascais", copy:"Beginne dort, wo der Atlantik die Dramaturgie übernimmt: zwischen Fels und Brandung." },
                  { period:"CHECK-IN", slug:"the-albatroz-hotel-cascais", copy:"Cascais als Basis: kurze Wege zum Wasser statt einer weiteren Fahrt in die Stadt." },
                  { period:"ABEND", slug:"mar-do-inferno-cascais", copy:"Fisch und Meeresfrüchte an der Küste. Vorab reservieren und genug Zeit mitbringen." }
                ]},
                { day:"02", label:"GOLF & CITY", summary:"Erst den Wind lesen. Dann die Stadt.", stops:[
                  { period:"VORMITTAG", slug:"oitavos-dunes", copy:"Die Runde am Atlantik ist der sportliche Anker. Abschlagzeit vorher buchen." },
                  { period:"NACHMITTAG", slug:"casa-das-historias-paula-rego", copy:"Eine bewusst andere Perspektive auf Cascais: Kunst, Architektur und ein ruhigerer Takt." },
                  { period:"ABEND / LISBOA", slug:"prado-lissabon", copy:"Zum Abschluss in die Stadt. Ein Abend für saisonale portugiesische Küche; Tisch reservieren." }
                ]}
              ].map(day => (
                <article className="destination48Day" key={day.day}>
                  <div className="destination48DayHeader">
                    <span className="destination48DayNumber">{day.day}</span>
                    <div><h3>{day.label}</h3><p>{day.summary}</p></div>
                  </div>
                  <ol className="destination48Stops">
                    {day.stops.map(stop => {
                      const place = linkedPlaces.find(item => item.slug === stop.slug);
                      if (!place) return null;
                      return <li className="destination48Stop" key={stop.slug}>
                        <span className="destination48Period">{stop.period}</span>
                        <div className="destination48StopContent">
                          <h4><Link href={`/places/${place.slug}`}>{place.title} <span aria-hidden="true">↗</span></Link></h4>
                          <p>{stop.copy}</p>
                          <SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} placeType={place.placeType} label="Place merken" />
                        </div>
                      </li>;
                    })}
                  </ol>
                </article>
              ))}
            </div>
            <LisbonTripImport destinationId={destination.id} places={linkedPlaces} />
            <p className="destination48Note">AROUND ROUTE NOTE · Redaktionelle Reihenfolge, keine bestätigten Fahr- oder Öffnungszeiten. Prüfe vor deiner Reise Abschlagszeiten, Reservierungen und Öffnungszeiten. Einzelne Places lassen sich direkt über THE DROP speichern.</p>
          </div>
        </section>
      )}

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
