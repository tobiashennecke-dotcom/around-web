import { notFound } from "next/navigation";
import Link from "next/link";
import { cityGolf, content, findById } from "@/lib/sample-content";
import { SaveButton } from "@/components/SaveButton";

export default async function CollectionPage({ params }: { params: Promise<{slug:string}>}) {
  const { slug } = await params;
  if (slug !== cityGolf.slug) notFound();
  const items = cityGolf.itemIds.map(findById).filter(Boolean);

  return (
    <main>
      <section className="hero" style={{minHeight:"62vh"}}>
        <div className="container">
          <div className="eyebrow lime">{cityGolf.kicker}</div>
          <h1>CITY +<br/>GOLF</h1>
          <p className="heroIntro">{cityGolf.description}</p>
          <div className="heroActions">
            <SaveButton sourceId={cityGolf.id} sourceType={cityGolf.type} title={cityGolf.title} slug={cityGolf.slug} label="Collection merken"/>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="collectionList">
            {items.map((item,index)=> item && (
              <div className="collectionRow" key={item.id}>
                <div className="eyebrow">{String(index+1).padStart(2,"0")}</div>
                <h3>
                  <Link href={
                    item.type === "destination" ? `/destinations/${item.slug}` :
                    item.type === "place" ? `/places/${item.slug}` :
                    item.type === "story" ? `/stories/${item.slug}` : "/discover"
                  }>{item.title}</Link>
                </h3>
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
