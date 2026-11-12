import "./topics.css";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicsIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Themen",
  description: "Einstiege nach Laune statt nach Land: Themen und Schlagwörter bei AROUND."
};

export default async function TopicsIndexPage() {
  const topics = await getTopicsIndex();
  const themes = topics.filter(t => t.kind === "theme" && t.count > 0);
  const tags = topics.filter(t => t.kind === "tag" && t.count > 0);
  if (!themes.length && !tags.length) notFound();

  return (
    <main className="topicPage">
      <section className="topicHero topicHero--index">
        <div className="container">
          <div className="eyebrow lime">THEMEN</div>
          <h1>Worauf hast du Lust?</h1>
          <p className="topicHeroIntro">Nicht jedes Ziel beginnt mit einem Land. Manchmal mit einer Laune.</p>
        </div>
      </section>

      {themes.length > 0 && (
        <section className="section">
          <div className="container topicIndexGrid">
            {themes.map((theme, index) => (
              <Link
                key={theme.id}
                href={`/themen/${theme.slug}`}
                className={`topicIndexCard ${theme.image ? "topicIndexCard--image" : ""}`}
                style={theme.image ? { backgroundImage: `linear-gradient(180deg,rgba(15,16,15,.05),rgba(15,16,15,.82)),url(${theme.image})` } : undefined}
              >
                <span className="topicIndexNumber">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  {theme.kicker && <span className="eyebrow">{theme.kicker}</span>}
                  <h2>{theme.title}</h2>
                  {theme.intro && <p>{theme.intro}</p>}
                  <span className="textLink">{theme.count} {theme.count === 1 ? "Eintrag" : "Einträge"} →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <section className="section topicTagCloud">
          <div className="container">
            <div className="eyebrow lime">SCHLAGWÖRTER</div>
            <ul>
              {tags.map(tag => (
                <li key={tag.id}><Link href={`/themen/${tag.slug}`} className="topicChip topicChip--tag">#{tag.title} <small>{tag.count}</small></Link></li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

export const revalidate = 60;
