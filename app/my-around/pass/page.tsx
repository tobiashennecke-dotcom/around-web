import type { Metadata } from "next";
import { PassClient } from "./PassClient";

export const metadata: Metadata = { title: "AROUND Pass", robots: { index: false, follow: false } };

export default function PassPage() {
  return (
    <main className="myAroundPage">
      <section className="myAroundHero">
        <div className="container myAroundHeroGrid">
          <div>
            <div className="eyebrow lime">MY AROUND · PASS</div>
            <h1>WO DU<br/>WARST.</h1>
          </div>
          <div className="myAroundHeroAside">
            <p className="serif">Jeder Platz, den du gespielt hast, gibt einen Stempel. Was noch fehlt, steht auf der Bucket List.</p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <PassClient />
        </div>
      </section>
    </main>
  );
}
