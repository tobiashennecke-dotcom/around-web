import Link from "next/link";
import type { TopicLink } from "@/lib/types";

/** "MEHR ZU" - visible Themen first, then Schlagwörter. Renders nothing when none are visible. */
export function TopicLinks({ topics, tone = "light" }: { topics?: TopicLink[]; tone?: "light" | "dark" }) {
  if (!topics || topics.length === 0) return null;
  const sorted = [...topics].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "theme" ? -1 : 1));
  return (
    <section className={`topicLinks topicLinks--${tone}`} aria-label="Themen und Schlagwörter">
      <div className="container topicLinksInner">
        <span className="eyebrow">MEHR ZU</span>
        <ul>
          {sorted.map(topic => (
            <li key={topic.id}>
              <Link href={`/themen/${topic.slug}`} className={`topicChip topicChip--${topic.kind}`}>
                {topic.kind === "theme" ? `${topic.title} →` : `#${topic.title}`}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
