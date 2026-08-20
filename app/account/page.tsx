import { AccountClient } from "./AccountClient";

export default function AccountPage() {
  return (
    <main className="section">
      <div className="container">
        <div className="eyebrow lime">Account</div>
        <h1 className="sectionTitle" style={{margin:"16px 0 40px"}}>MY AROUND.</h1>
        <div className="editorialGrid">
          <AccountClient />
          <div className="featureCard limeBg">
            <div className="eyebrow">Warum ein Account?</div>
            <h2 style={{fontSize:48}}>Saves werden zu Reisen.</h2>
            <p className="serif" style={{fontSize:23}}>
              Gast-Saves funktionieren sofort. Ein Account macht sie geräteübergreifend
              und öffnet später Collections und Trips.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
