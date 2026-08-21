import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollection } from "@/lib/content";
import { SaveButton } from "@/components/SaveButton";
import type { ContentCard } from "@/lib/types";

function href(item: ContentCard) {
  if (item.type === "destination") return `/destinations/${item.slug}`;
  if (item.type === "place") return `/places/${item.slug}`;
  if (item.type === "story") return `/stories/${item.slug}`;
  if (item.type === "collection") return `/collections/${item.slug}`;
  return "/discover";
}

export default async function CollectionPage({ params }: { params: Promise<{slug:string}>}) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();
  const items = collection.items || [];

  return (
    <main>
      <section className="hero" style={{minHeight:"62vh"}}>
        <div className="container">
          <div className="eyebrow lime">{collection.kicker}</div>
          <h1>{collection.title.toUpperCase()}</h1>
          <p className="heroIntro">{collection.description}</p>
          <div className="heroActions">
            <SaveButton sourceId={collection.id} sourceType={collection.type} title={collection.title} slug={collection.slug} label="Collection merken"/>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="collectionList">
            {items.map((item,index) => (
              <div className="collectionRow" key={item.id}>
                <div className="eyebrow">{String(index+1).padStart(2,"0")}</div>
                <h3><Link href={href(item)}>{item.title}</Link></h3>
                <p>{item.description}</p>
                <SaveButton sourceId={item.id} sourceType={item.type} title={item.title} slug={item.slug}/>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
