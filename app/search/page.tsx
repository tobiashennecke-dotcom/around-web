import { SearchClient } from "./SearchClient";

export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string;type?:string;role?:string;trip?:string}>}) {
  const params=await searchParams;
  return (
    <main className="searchShell searchShell--planning">
      <div className="container">
        <div className="eyebrow lime">AROUND SEARCH</div>
        <h1 className="sectionTitle" style={{margin:"15px 0 30px"}}>FINDEN.
          <br/>DANN PLANEN.</h1>
        <p className="searchIntro">Golf ist der Start. Finde PLAY, STAY, EAT und DO – und schiebe die richtigen Bausteine direkt in deinen Trip.</p>
        <SearchClient
          initialQuery={params.q || ""}
          initialType={params.type || "all"}
          initialRole={params.role || ""}
          tripId={params.trip || ""}
        />
      </div>
    </main>
  );
}
