import { notFound } from "next/navigation";
import Link from "next/link";
import { getDestination } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";
import { ContentCard } from "@/components/ContentCard";

export default async function DestinationPage({ params }: { params: Promise<{ slug:string }> }) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) notFound();
  const linkedPlaces = destination.places || [];
  const linkedStories = destination.stories || [];

  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="eyebrow lime">{destination.kicker}</div>
          <h1>{destination.title.toUpperCase()}</h1>
          <p className="heroIntro">{destination.description}</p>
          <div className="heroActions">
            <SaveButton sourceId={destination.id} sourceType={destination.type} title={destination.title} slug={destination.slug} label={`${destination.title} merken`} />
            <Link href="#play" className="primary">Entdecken →</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container editorialGrid">
          <div>
            <div className="eyebrow lime">Warum hin?</div>
            <h2 className="sectionTitle">Golf +<br/>Stadt.</h2>
            <p style={{fontSize:18,lineHeight:1.6,maxWidth:680}}>{destination.whyGo}</p>
          </div>
          <div className="featureCard dark">
            <div className="eyebrow lime">AROUND POV</div>
            <p className="serif" style={{fontSize:40,lineHeight:1.08}}>
              „Eine Destination ist dann gut, wenn die Runde nicht der einzige Grund war, hinzufahren.“
            </p>
          </div>
        </div>
      </section>

      <section className="section" id="play">
        <div className="container">
          <div className="eyebrow lime">PLAY / STAY / EAT / DO</div>
          <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>AROUND IT.</h2>
          {linkedPlaces.length > 0 ? (
            <div className="cardGrid">{linkedPlaces.map(item => <ContentCard key={item.id} item={item}/>)}</div>
          ) : (
            <p>Noch keine Places mit dieser Destination verknüpft.</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="eyebrow blue">STORIES</div>
          <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>Mehr als Reiseführer.</h2>
          {linkedStories.length > 0 ? (
            <div className="cardGrid">{linkedStories.map(item => <ContentCard key={item.id} item={item}/>)}</div>
          ) : (
            <p>Noch keine Stories mit dieser Destination verknüpft.</p>
          )}
        </div>
      </section>
    </main>
  );
}
