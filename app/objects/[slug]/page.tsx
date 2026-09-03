import {notFound} from "next/navigation";
import {getProduct} from "@/lib/content";
import {SaveButton} from "@/components/SaveButton";

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const product=await getProduct(slug);
  if(!product) notFound();
  return <main>
    <section className="hero" style={product.image?{backgroundImage:`linear-gradient(rgba(18,20,19,.2),rgba(18,20,19,.84)),url(${product.image})`}:undefined}>
      <div className="container"><div className="eyebrow blue">{product.aroundSelected?"AROUND SELECTED · ":""}{product.kicker || "THE GOOD STUFF"}</div><h1>{product.title.toUpperCase()}</h1><p className="heroIntro">{product.description}</p><div className="heroActions"><SaveButton sourceId={product.id} sourceType={product.type} title={product.title} slug={product.slug} label="Object merken"/>{product.url&&<a className="primary" href={product.url} target="_blank" rel="noreferrer">Mehr erfahren ↗</a>}</div></div>
    </section>
    {product.whyItMatters&&<section className="section"><div className="container editorialGrid"><div><div className="eyebrow blue">WHY IT MATTERS</div><h2 className="sectionTitle">Nicht mehr.<br/>Besser.</h2></div><div className="featureCard"><p className="serif" style={{fontSize:34,lineHeight:1.16}}>{product.whyItMatters}</p></div></div></section>}
  </main>;
}

// AROUND editorial freshness: refresh published Sanity content without a redeploy.
export const revalidate = 30;
