import { SearchClient } from "./SearchClient";

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string;type?:string}>}) {
  const params=await searchParams;
  return (
    <main className="searchShell">
      <div className="container">
        <div className="eyebrow lime">AROUND Search</div>
        <h1 className="sectionTitle" style={{margin:"15px 0 30px"}}>Was suchst<br/>du wirklich?</h1>
        <p className="serif" style={{fontSize:28,maxWidth:700}}>
          Nicht nur Namen eintippen. Nach Gefühl, Format und Relevanz entdecken.
        </p>
        <SearchClient initialQuery={params.q || ""} initialType={params.type || "all"} />
      </div>
    </main>
  );
}

// AROUND editorial freshness: refresh published Sanity content without a redeploy.
export const revalidate = 30;
