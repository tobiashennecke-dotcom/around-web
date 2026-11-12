import "../topics.css";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard } from "@/components/ContentCard";
import { TopicLinks } from "@/components/TopicLinks";
import { getTopic } from "@/lib/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) return {};
  const title = topic.kind === "theme" ? topic.title : `#${topic.title}`;
  const description = topic.intro || `${topic.title} bei AROUND: Orte, Stories und Reisen.`;
  return { title, description, openGraph: { title, description, images: topic.image ? [topic.image] : undefined } };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) notFound();

  const isTheme = topic.kind === "theme";
  const travel = topic.items.filter(item => item.type === "destination" || item.type === "place");
  const reads = topic.items.filter(item => item.type !== "destination" && item.type !== "place");

  return (
    <main className="topicPage">
      <section
        className={`topicHero ${topic.image ? "topicHero--image" : ""} topicHero--${topic.kind}`}
        style={topic.image ? { backgroundImage: `linear-gradient(180deg,rgba(15,16,15,.25),rgba(15,16,15,.8)),url(${topic.image})` } : undefined}
      >
        <div className="container">
          <div className="eyebrow lime">{topic.kicker || (isTheme ? "THEMA" : "SCHLAGWORT")}</div>
          <h1>{isTheme ? topic.title : `#${topic.title}`}</h1>
          {topic.intro && <p className="topicHeroIntro">{topic.intro}</p>}
          <p className="topicHeroCount">{topic.items.length === 1 ? "1 Eintrag" : `${topic.items.length} Einträge`}</p>
        </div>
        {topic.imageCredit && <span className="topicHeroCredit">Foto: {topic.imageCredit}</span>}
      </section>

      {topic.items.length === 0 && (
        <section className="section"><div className="container"><p>Hier kommt bald mehr. <Link href="/discover" className="textLink">Solange: Entdecken →</Link></p></div></section>
      )}

      {travel.length > 0 && (
        <section className="section topicSection">
          <div className="container">
            <div className="sectionHead">
              <div>
                <div className="eyebrow lime">ORTE</div>
                <h2 className="sectionTitle">Go somewhere.</h2>
              </div>
            </div>
            <div className="cardGrid">{travel.map(item => <ContentCard key={item.id} item={item} />)}</div>
          </div>
        </section>
      )}

      {reads.length > 0 && (
        <section className="section topicSection topicSection--reads">
          <div className="container">
            <div className="sectionHead">
              <div>
                <div className="eyebrow lime">STORIES & MEHR</div>
                <h2 className="sectionTitle">Read on.</h2>
              </div>
            </div>
            <div className="cardGrid">{reads.map(item => <ContentCard key={item.id} item={item} />)}</div>
          </div>
        </section>
      )}

      <TopicLinks topics={topic.related} />
    </main>
  );
}

export const revalidate = 30;
export const dynamicParams = true;
