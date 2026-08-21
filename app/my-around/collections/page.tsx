import { CollectionsClient } from "./CollectionsClient";

export default function MyCollectionsPage() {
  return (
    <main className="myCollectionsPage">
      <section className="myCollectionsHero">
        <div className="container myCollectionsHeroGrid">
          <div>
            <div className="eyebrow lime">MY AROUND / COLLECTIONS</div>
            <h1>FUNDSTÜCKE.<br/>MIT PLAN.</h1>
          </div>
          <p className="serif">Aus einzelnen Drops werden Listen, Ideen und irgendwann vielleicht eine Reise.</p>
        </div>
      </section>
      <section className="section myCollectionsContent">
        <div className="container"><CollectionsClient /></div>
      </section>
    </main>
  );
}
