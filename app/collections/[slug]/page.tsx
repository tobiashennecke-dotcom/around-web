import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection } from "@/lib/content";
import { ContentCard } from "@/components/ContentCard";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const collection=await getCollection(slug);
  if(!collection) return {};
  const title=collection.seoTitle || `${collection.title} — AROUND`;
  const description=collection.seoDescription || collection.description;
  const image=collection.socialImage || collection.image;
  return {title,description,openGraph:{title,description,images:image?[image]:undefined}};
}

export default async function CollectionPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const collection=await getCollection(slug);
  if(!collection) notFound();
  const items=collection.items || [];

  return <main>
    <section
      className={`hero ${collection.image ? "heroWithImage" : ""}`}
      style={collection.image ? {backgroundImage:`linear-gradient(rgba(18,20,19,.25),rgba(18,20,19,.82)),url(${collection.image})`} : undefined}
    >
      <div className="container">
        <div className="eyebrow lime">{collection.kicker || "AROUND COLLECTION"}</div>
        <h1>{collection.title.toUpperCase()}</h1>
        <p className="heroIntro">{collection.description}</p>
      </div>
    </section>
    <section className="section"><div className="container">
      <div className="eyebrow">CURATED / NOT COMPLETE</div>
      <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>Die Auswahl.</h2>
      {items.length ? <div className="cardGrid">{items.map(item=><ContentCard key={item.id} item={item}/>)}</div> : <p>Noch keine Inhalte in dieser Collection.</p>}
    </div></section>
  </main>;
}
