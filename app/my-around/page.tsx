import { MyAroundHomeClient } from "./MyAroundHomeClient";

export default function MyAroundPage() {
  return (
    <main className="myAroundPage">
      <section className="myAroundHero">
        <div className="container myAroundHeroGrid">
          <div>
            <div className="eyebrow lime">MY AROUND</div>
            <h1>YOUR<br/>AROUND.</h1>
          </div>
          <div className="myAroundHeroAside">
            <span className="drop drop--my-around" aria-hidden="true" />
            <p className="serif">Alles, was du behalten, ordnen und wirklich bereisen willst – an einem Ort.</p>
          </div>
        </div>
      </section>

      <section className="section myAroundContent">
        <div className="container">
          <MyAroundHomeClient />
        </div>
      </section>
    </main>
  );
}
