import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { TripPicker } from "@/components/TripPicker";
import { contentHref } from "@/components/ContentCard";
import { contentTypeLabel, normalizeContentRole } from "@/lib/content-role";
import type { ContentCard } from "@/lib/types";

type Size = "wide" | "large" | "regular";

type Props = {
  place: ContentCard;
  size?: Size;
};

/**
 * Story -> Place -> Trip conversion card. Deliberately not the generic
 * ContentCard: this card's job is to make a Story's related Place feel like
 * a real trip building block, not a "related product". Trip Intelligence
 * itself is never invoked here - adding a Place only makes it an unplanned
 * Trip candidate; Best Day/Fit/Conflict logic remains the Planner's job.
 */
export function StoryPlaceCard({ place, size = "regular" }: Props) {
  const href = contentHref(place);
  const role = normalizeContentRole(place.placeType);
  const roleLabel = contentTypeLabel(place.type, place.placeType);
  const savePayload = { sourceId: place.id, sourceType: place.type, sourceRole: role, title: place.title, slug: place.slug };

  return (
    <article className={`storyPlaceCard storyPlaceCard--${size}`}>
      <Link href={href} className="storyPlaceCardMedia" aria-label={place.title}>
        {place.image ? (
          <img src={place.image} alt={place.title} loading="lazy" />
        ) : (
          <div className="storyPlaceCardTypographic" aria-hidden="true">
            <span>{roleLabel}</span>
          </div>
        )}
        {place.aroundSelected && <span className="selectedBadge">AROUND SELECTED</span>}
      </Link>
      <div className="storyPlaceCardBody">
        <span className="tag blue">{roleLabel}</span>
        <h3>
          <Link href={href}>{place.title}</Link>
        </h3>
        {place.description && <p>{place.description}</p>}
        <div className="storyPlaceCardActions">
          <Link href={href} className="storyPlaceCardView">
            VIEW {roleLabel} →
          </Link>
          <div className="storyPlaceCardControls">
            <SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} placeType={place.placeType} label="Merken" />
            {role && <TripPicker item={savePayload} label="+ ZUM TRIP" />}
          </div>
        </div>
      </div>
    </article>
  );
}
