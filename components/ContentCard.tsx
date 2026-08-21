import Link from "next/link";
import type { ContentCard as CardType } from "@/lib/types";
import { SaveButton } from "./SaveButton";

export function contentHref(item: CardType) {
  if (item.type === "destination") return `/destinations/${item.slug}`;
  if (item.type === "place") return `/places/${item.slug}`;
  if (item.type === "story") return `/stories/${item.slug}`;
  if (item.type === "person") return `/people/${item.slug}`;
  if (item.type === "product") return `/objects/${item.slug}`;
  if (item.type === "collection") return `/collections/${item.slug}`;
  return "/discover";
}

function typeLabel(type: CardType["type"]) {
  if (type === "destination") return "Destination";
  if (type === "place") return "Place";
  if (type === "story") return "Story";
  if (type === "person") return "People";
  if (type === "product") return "Object";
  if (type === "collection") return "Collection";
  return type;
}

export function ContentCard({ item }: { item: CardType }) {
  const tagClass = item.accent === "blue" ? "tag blue" : item.accent === "pink" ? "tag pink" : "tag";
  return (
    <article className={`card card--${item.accent}`}>
      <Link href={contentHref(item)} className="cardMedia" aria-label={item.title}>
        {item.image ? (
          <img src={item.image} alt={item.title} loading="lazy" />
        ) : (
          <div className="cardPlaceholder" aria-hidden="true" />
        )}
        {item.aroundSelected && <span className="selectedBadge">AROUND SELECTED</span>}
        <span className="cardTypeStamp">{typeLabel(item.type)}</span>
      </Link>
      <div className="cardBody">
        <span className={tagClass}>{item.kicker || typeLabel(item.type)}</span>
        <h3><Link href={contentHref(item)}>{item.title}</Link></h3>
        {item.description && <p>{item.description}</p>}
        <div className="cardMeta">
          <span>{item.featured ? "Featured" : typeLabel(item.type)}</span>
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
