import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/access";
import { loadInsights } from "@/lib/admin/insights";
import type { RankedItem } from "@/lib/admin/insights-aggregate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Insights · AROUND",
  robots: { index: false, follow: false }
};

const TYPE_LABEL: Record<string, string> = {
  destination: "DESTINATIONS",
  place: "PLACES",
  story: "STORIES",
  person: "PEOPLE",
  object: "OBJECTS",
  product: "OBJECTS",
  collection: "COLLECTIONS"
};

const HREF_BASE: Record<string, string> = {
  destination: "/destinations/",
  place: "/places/",
  story: "/stories/",
  person: "/people/",
  object: "/objects/",
  product: "/objects/",
  collection: "/collections/"
};

function href(type: string, slug: string | null) {
  return slug && HREF_BASE[type] ? `${HREF_BASE[type]}${slug}` : null;
}

function date(value: string | null) {
  if (!value) return "–";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date(value));
}

function Title({ type, slug, title }: { type: string; slug: string | null; title: string }) {
  const link = href(type, slug);
  return link ? <Link href={link}>{title}</Link> : <>{title}</>;
}

function RankTable({ items, empty, showRole }: { items: RankedItem[]; empty: string; showRole?: boolean }) {
  if (items.length === 0) return <p className="insightsEmpty">{empty}</p>;
  return (
    <table className="insightsTable">
      <thead>
        <tr><th>#</th><th>Titel</th>{showRole ? <th>Rolle</th> : <th>Typ</th>}<th className="num">Saves</th><th>Zuletzt</th></tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.sourceId}>
            <td className="rank">{index + 1}</td>
            <td><Title type={item.sourceType} slug={item.slug} title={item.title} /></td>
            <td>{showRole ? (item.sourceRole || "–").toUpperCase() : TYPE_LABEL[item.sourceType] || item.sourceType}</td>
            <td className="num">{item.saves}</td>
            <td>{date(item.lastSavedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdminInsightsPage() {
  const supabase = await createClient();
  if (!supabase) notFound();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/account?next=/admin/insights");
  if (!isAdminEmail(data.user.email)) notFound();

  const result = await loadInsights();

  return (
    <main className="insightsPage">
      <section className="insightsHero">
        <div className="container">
          <div className="eyebrow lime">INTERN · NUR FÜR DICH</div>
          <h1>WAS<br/>GESPEICHERT<br/>WIRD.</h1>
          {result.ok && <p className="insightsStamp">Stand {date(result.generatedAt)} · nur angemeldete Konten, Gast-Saves bleiben im Browser</p>}
        </div>
      </section>

      <section className="section">
        <div className="container insightsBody">
          {!result.ok ? (
            <div className="insightsNotice">
              <div className="eyebrow">NOCH NICHT VERBUNDEN</div>
              {result.reason === "missing_secret_key" ? (
                <p>In Vercel fehlt die Variable <code>SUPABASE_SECRET_KEY</code> für dieses Projekt. Danach neu deployen.</p>
              ) : (
                <p>Die Daten konnten nicht geladen werden: <code>{result.detail}</code></p>
              )}
            </div>
          ) : (
            <>
              <div className="insightsKpis">
                <div><span>{result.insights.totals.accounts}</span>Konten</div>
                <div><span>{result.insights.totals.accountsWithSaves}</span>Konten mit Saves</div>
                <div><span>{result.insights.totals.saves}</span>Saves gesamt</div>
                <div><span>{result.insights.totals.savesLast7Days}</span>Saves · 7 Tage</div>
                <div><span>{result.insights.totals.trips}</span>Trips</div>
              </div>

              {result.insights.byType.length > 0 && (
                <p className="insightsTypes">
                  {result.insights.byType.map(entry => (
                    <span key={entry.type}>{TYPE_LABEL[entry.type] || entry.type} <strong>{entry.saves}</strong></span>
                  ))}
                </p>
              )}

              <section className="insightsBlock">
                <h2>Destinations</h2>
                <p className="insightsHint">Alles, was zu einer Destination gehört: die Destination selbst, ihre Places und Stories dazu.</p>
                {result.insights.destinations.length === 0 ? (
                  <p className="insightsEmpty">Noch nichts gespeichert.</p>
                ) : (
                  <table className="insightsTable">
                    <thead>
                      <tr><th>#</th><th>Destination</th><th className="num">Gesamt</th><th className="num">Direkt</th><th className="num">Places</th><th className="num">Stories</th><th className="num">Konten</th></tr>
                    </thead>
                    <tbody>
                      {result.insights.destinations.map((entry, index) => (
                        <tr key={entry.id}>
                          <td className="rank">{index + 1}</td>
                          <td><Title type="destination" slug={entry.slug} title={entry.title} /></td>
                          <td className="num strong">{entry.total}</td>
                          <td className="num">{entry.direct}</td>
                          <td className="num">{entry.places}</td>
                          <td className="num">{entry.stories}</td>
                          <td className="num">{entry.accounts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {result.insights.unassignedSaves > 0 && (
                  <p className="insightsHint">{result.insights.unassignedSaves} Saves ohne Destination (z. B. People, Objects oder Stories ohne Ortsbezug).</p>
                )}
              </section>

              <section className="insightsBlock">
                <h2>Stories</h2>
                <RankTable items={result.insights.topStories} empty="Noch keine Story gespeichert." />
              </section>

              <section className="insightsBlock">
                <h2>Places</h2>
                <RankTable items={result.insights.topPlaces} empty="Noch kein Place gespeichert." showRole />
              </section>

              {result.insights.topOther.length > 0 && (
                <section className="insightsBlock">
                  <h2>People, Objects &amp; Co.</h2>
                  <RankTable items={result.insights.topOther} empty="" />
                </section>
              )}

              <section className="insightsBlock">
                <h2>Konten</h2>
                <table className="insightsTable">
                  <thead>
                    <tr><th>E-Mail</th><th>Login</th><th className="num">Saves</th><th className="num">Trips</th><th>Angelegt</th><th>Zuletzt aktiv</th></tr>
                  </thead>
                  <tbody>
                    {result.insights.accounts.map(account => (
                      <tr key={account.id}>
                        <td>{account.email || "–"}</td>
                        <td>{account.provider === "google" ? "Google" : "E-Mail"}</td>
                        <td className="num strong">{account.saves}</td>
                        <td className="num">{account.trips}</td>
                        <td>{date(account.created_at)}</td>
                        <td>{date(account.last_sign_in_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="insightsBlock">
                <h2>Zuletzt gespeichert</h2>
                {result.insights.recent.length === 0 ? (
                  <p className="insightsEmpty">Noch nichts gespeichert.</p>
                ) : (
                  <table className="insightsTable">
                    <thead>
                      <tr><th>Wann</th><th>Konto</th><th>Typ</th><th>Titel</th></tr>
                    </thead>
                    <tbody>
                      {result.insights.recent.map((save, index) => (
                        <tr key={`${save.createdAt}-${index}`}>
                          <td>{date(save.createdAt)}</td>
                          <td>{save.email || "–"}</td>
                          <td>{TYPE_LABEL[save.sourceType] || save.sourceType}{save.sourceRole ? ` · ${save.sourceRole.toUpperCase()}` : ""}</td>
                          <td><Title type={save.sourceType} slug={save.slug} title={save.title} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
