import Link from "next/link";
import { ContentCard, contentHref } from "@/components/ContentCard";
import { getHomepageContent } from "@/lib/content";

export default async function HomePage() {
  const {featured,latest} = await getHomepageContent();
  const highlights = featured.length ? featured : latest.slice(0,2);

  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="eyebrow lime">THIS IS AROUND</div>
          <h1>Die Runde ist<br/>erst der Anfang.</h1>
          <p className="heroIntro">
            Orte, Menschen, Ideen und Reisen für alle, die Golf nicht als Grenze,
            sondern als Perspektive sehen.
          </p>
          <div className="heroActions">
            <Link className="primary" href="/discover">AROUND entdecken →</Link>
            {latest.find(item=>item.type === "story") && (
              <Link className="secondary" href={contentHref(latest.find(item=>item.type === "story")!)}>Neueste Story</Link>
            )}
          </div>
        </div>
      </section>

      {highlights.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="editorialGrid">
              {highlights.slice(0,2).map((item,index)=>(
                <Link
                  href={contentHref(item)}
                  key={item.id}
                  className={`featureCard ${index===1 ? "dark" : ""}`}
                  style={item.image ? {
                    backgroundImage:`linear-gradient(rgba(20,22,21,.18),rgba(20,22,21,.55)),url(${item.image})`,
                    backgroundSize:"cover",backgroundPosition:"center",color:"#F5F3EE"
                  } : undefined}
                >
                  <div><div className="eyebrow lime">{item.kicker || (item.featured ? "FEATURED" : "THIS IS AROUND")}</div><h2>{item.title}</h2></div>
                  <p className="serif" style={{fontSize:26,maxWidth:520}}>{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="eyebrow">THIS IS AROUND</div>
          <h2 className="sectionTitle" style={{margin:"14px 0 40px"}}>Entdecken.</h2>
          <div className="cardGrid">
            {latest.slice(0,9).map(item => <ContentCard item={item} key={item.id} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
