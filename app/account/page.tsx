import { AccountClient } from "./AccountClient";
import { CommunicationPreferences } from "@/components/CommunicationPreferences";

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
            <h2 style={{fontSize:48}}>DEIN AROUND. ÜBERALL.</h2>
            <p className="serif" style={{fontSize:23}}>
              Saves, Collections und Trips bleiben synchron – ohne dass aus jedem
              gespeicherten Fundstück automatisch eine Reise werden muss.
            </p>
          </div>
        </div>
        <CommunicationPreferences />
      </div>
    </main>
  );
}
