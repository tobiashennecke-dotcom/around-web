import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlace } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";

export default async function PlacePage({ params }: { params: Promise<{slug:string}>}) {
  const { slug } = await params;
  const place = await getPlace(slug);
  if (!place) notFound();

  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className={`eyebrow ${place.accent}`}>{place.kicker}</div>
          <h1>{place.title.toUpperCase()}</h1>
          <p className="heroIntro">{place.description}</p>
          <div className="heroActions">
            <SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} label="Place merken" />
            {place.destination && (
              <Link className="primary" href={`/destinations/${place.destination.slug}`}>
                {place.destination.title} →
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container editorialGrid">
          <div>
            <div className="eyebrow lime">Warum wir ihn mögen</div>
            <h2 className="sectionTitle">Nicht perfekt.<br/>Gut so.</h2>
          </div>
          <div className="featureCard">
            <p className="serif" style={{fontSize:34,lineHeight:1.16}}>{place.whyWeLikeIt}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
