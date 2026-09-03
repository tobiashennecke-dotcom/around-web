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

function typeLabel(item: CardType) {
  if (item.type === "destination") return "DESTINATION";
  if (item.type === "place") {
    const role = (item.placeType || "").toLowerCase();
    if (role === "course" || role === "play") return "PLAY";
    if (role === "stay") return "STAY";
    if (role === "eat" || role === "drink") return "EAT";
    if (role === "do" || role === "culture") return "DO";
    return "PLACE";
  }
  if (item.type === "story") return "STORY";
  if (item.type === "person") return "PEOPLE";
  if (item.type === "product") return "OBJECT";
  if (item.type === "collection") return "COLLECTION";
  return item.type.toUpperCase();
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
        <span className="cardTypeStamp">{typeLabel(item)}</span>
      </Link>
      <div className="cardBody">
        <span className={tagClass}>{item.type === "place" ? typeLabel(item) : (item.kicker || typeLabel(item))}</span>
        <h3><Link href={contentHref(item)}>{item.title}</Link></h3>
        {item.description && <p>{item.description}</p>}
        <div className="cardMeta">
          <span>{typeLabel(item)}{item.featured ? " · Featured" : ""}</span>
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
