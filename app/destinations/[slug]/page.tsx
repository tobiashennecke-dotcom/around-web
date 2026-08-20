import { notFound } from "next/navigation";
import Link from "next/link";
import { places, stories } from "@/lib/sample-content";
import { getDestination } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";
import { ContentCard } from "@/components/ContentCard";

export default async function DestinationPage({ params }: { params: Promise<{ slug:string }> }) {
  const { slug } = await params;
  const lisbon = await getDestination(slug);
  if (!lisbon) notFound();

  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="eyebrow lime">{lisbon.kicker}</div>
          <h1>{lisbon.title.toUpperCase()}</h1>
          <p className="heroIntro">{lisbon.description}</p>
          <div className="heroActions">
            <SaveButton sourceId={lisbon.id} sourceType={lisbon.type} title={lisbon.title} slug={lisbon.slug} label="Lisbon merken" />
            <Link href="#play" className="primary">Entdecken →</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container editorialGrid">
          <div>
            <div className="eyebrow lime">Warum hin?</div>
            <h2 className="sectionTitle">Golf +<br/>Stadt.</h2>
            <p style={{fontSize:18,lineHeight:1.6,maxWidth:680}}>{lisbon.whyGo}</p>
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
          <div className="eyebrow lime">PLAY / STAY / EAT</div>
          <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>AROUND IT.</h2>
          <div className="cardGrid">{places.map(p=><ContentCard key={p.id} item={p}/>)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="eyebrow blue">STORIES</div>
          <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>Mehr als Reiseführer.</h2>
          <div className="cardGrid">{stories.map(s=><ContentCard key={s.id} item={s}/>)}</div>
        </div>
      </section>
    </main>
  );
}
