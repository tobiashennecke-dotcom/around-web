import Link from "next/link";
import type { ContentCard as CardType } from "@/lib/types";
import { SaveButton } from "./SaveButton";

function href(item: CardType) {
  if (item.type === "destination") return `/destinations/${item.slug}`;
  if (item.type === "place") return `/places/${item.slug}`;
  if (item.type === "story") return `/stories/${item.slug}`;
  if (item.type === "collection") return `/collections/${item.slug}`;
  return "/discover";
}

export function ContentCard({ item }: { item: CardType }) {
  const tagClass = item.accent === "blue" ? "tag blue" : item.accent === "pink" ? "tag pink" : "tag";
  return (
    <article className="card">
      <Link href={href(item)} className="cardMedia" aria-label={item.title}>
        <div style={{
          width:"100%",height:"100%",
          background:
            item.accent === "blue" ? "#0047BB" :
            item.accent === "pink" ? "#F55096" :
            "linear-gradient(135deg,#cbd6aa,#7c876c)"
        }} />
      </Link>
      <div className="cardBody">
        <span className={tagClass}>{item.kicker || item.type}</span>
        <h3><Link href={href(item)}>{item.title}</Link></h3>
        <p>{item.description}</p>
        <div className="cardMeta">
          <span>{item.type}</span>
          <SaveButton
            sourceId={item.id}
            sourceType={item.type}
            title={item.title}
            slug={item.slug}
          />
        </div>
      </div>
    </article>
  );
}
