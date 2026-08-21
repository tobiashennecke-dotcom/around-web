import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlace } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const place=await getPlace(slug);
  if(!place) return {};
  const title=place.seoTitle || `${place.title} — AROUND`;
  const description=place.seoDescription || place.description;
  const image=place.socialImage || place.image;
  return {title,description,openGraph:{title,description,images:image?[image]:undefined}};
}

export default async function PlacePage({ params }: { params: Promise<{slug:string}>}) {
  const { slug } = await params;
  const place = await getPlace(slug);
  if (!place) notFound();

  return (
    <main>
      <section
        className={`hero ${place.image ? "heroWithImage" : ""}`}
        style={place.image ? {backgroundImage:`linear-gradient(rgba(18,20,19,.25),rgba(18,20,19,.8)),url(${place.image})`} : undefined}
      >
        <div className="container">
          <div className={`eyebrow ${place.accent}`}>{place.aroundSelected ? "AROUND SELECTED · " : ""}{place.kicker}</div>
          <h1>{place.title.toUpperCase()}</h1>
          <p className="heroIntro">{place.description}</p>
          <div className="heroActions">
            <SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} label="Place merken" />
            {place.destination && (
              <Link className="primary" href={`/destinations/${place.destination.slug}`}>
                {place.destination.title} →
              </Link>
            )}
            {place.website && <a className="secondary" href={place.website} target="_blank" rel="noreferrer">Website ↗</a>}
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
            {place.aroundTake && <div><div className="eyebrow">AROUND TAKE</div><p>{place.aroundTake}</p></div>}
          </div>
        </div>
      </section>

      {place.goodToKnow && place.goodToKnow.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="eyebrow lime">GOOD TO KNOW</div>
            <div className="factsGrid">
              {place.goodToKnow.map((fact,index)=><div className="fact" key={`${fact.label}-${index}`}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
