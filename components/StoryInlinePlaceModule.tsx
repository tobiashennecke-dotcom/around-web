import Link from "next/link";
import { SaveButton } from "@/components/SaveButton";
import { TripPicker } from "@/components/TripPicker";
import { contentHref } from "@/components/ContentCard";
import { contentTypeLabel, normalizeContentRole } from "@/lib/content-role";
import type { ContentCard } from "@/lib/types";

type Layout = "auto" | "feature" | "compact";

type Props = {
  place?: ContentCard;
  layout?: Layout;
  editorialLine?: string;
};

const HEADLINE_BY_ROLE: Record<string, string> = {
  play: "PLAY THIS.",
  stay: "STAY HERE.",
  eat: "EAT HERE.",
  do: "DO THIS."
};

/**
 * Editorial Portable Text module: lets an editor deliberately place one of
 * the Story's already-related Places at an exact point in the article - by
 * hand in Studio, never algorithmically or via AI. The Place must already
 * exist in story.related[] (enforced in the Sanity schema, not here).
 *
 * Different job from v1.25c's StoryPlaceBridge: that renders the complete
 * post-article "BUILD THE TRIP" summary of every related Place; this is a
 * single contextual interruption inside the article body. Both can and
 * should coexist for the same Place.
 */
export function StoryInlinePlaceModule({ place, layout = "auto", editorialLine }: Props) {
  if (!place) return null;

  const href = contentHref(place);
  const role = normalizeContentRole(place.placeType);
  const roleLabel = contentTypeLabel(place.type, place.placeType);
  const headline = (role && HEADLINE_BY_ROLE[role]) || "GO DEEPER.";
  const savePayload = { sourceId: place.id, sourceType: place.type, sourceRole: role, title: place.title, slug: place.slug };

  return (
    <div className={`storyPlaceModule storyPlaceModule--${layout}`}>
      <Link href={href} className="storyPlaceModuleMedia" aria-label={place.title}>
        {place.image ? (
          <img src={place.image} alt={place.title} loading="lazy" />
        ) : (
          <div className="storyPlaceModuleTypographic" aria-hidden="true">
            <span>{roleLabel}</span>
          </div>
        )}
      </Link>
      <div className="storyPlaceModuleBody">
        <div className="storyPlaceModuleHeadline">{headline}</div>
        <h3 className="storyPlaceModuleTitle">
          <Link href={href}>{place.title}</Link>
        </h3>
        {editorialLine && <p className="storyPlaceModuleEditorialLine">{editorialLine}</p>}
        {place.description && <p className="storyPlaceModuleDescription">{place.description}</p>}
        <div className="storyPlaceModuleActions">
          <Link href={href} className="storyPlaceModuleView">
            VIEW {roleLabel} →
          </Link>
          <div className="storyPlaceModuleControls">
            <SaveButton sourceId={place.id} sourceType={place.type} title={place.title} slug={place.slug} placeType={place.placeType} label="Merken" />
            {role && <TripPicker item={savePayload} label="+ ZUM TRIP" />}
          </div>
        </div>
      </div>
    </div>
  );
}
