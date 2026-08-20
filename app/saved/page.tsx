import Link from "next/link";
import { SavedClient } from "./SavedClient";

export default function SavedPage() {
  return (
    <main className="section">
      <div className="container">
        <div className="eyebrow lime">THE DROP / MY AROUND</div>
        <h1 className="sectionTitle" style={{margin:"16px 0 40px"}}>Gespeichert.</h1>
        <SavedClient />
        <div style={{marginTop:30}}><Link className="primary" href="/discover">Weiter entdecken →</Link></div>
      </div>
    </main>
  );
}
