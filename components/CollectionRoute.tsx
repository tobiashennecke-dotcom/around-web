import { ContentCard } from "@/components/ContentCard";
import { StoryTripActions } from "@/components/StoryTripActions";
import type { CollectionDay, ContentCard as Card } from "@/lib/types";

type Props = { days: CollectionDay[]; intro?: string; places: Card[]; tripTitle: string };

/** Collection als Route (spec 16): day by day, then "Als Trip übernehmen". */
export function CollectionRoute({ days, intro, places, tripTitle }: Props) {
  return <section className="section"><div className="container">
    <div className="eyebrow">ROUTE / {days.length} {days.length === 1 ? "TAG" : "TAGE"}</div>
    <h2 className="sectionTitle" style={{margin:"14px 0 20px"}}>Der Plan.</h2>
    {intro ? <p className="collectionRouteIntro">{intro}</p> : null}
    <ol className="collectionRoute">
      {days.map(day=><li key={day.key} className="collectionRouteDay">
        <div className="collectionRouteHead">
          <div className="collectionRouteLabel">{day.label}</div>
          {day.title ? <h3>{day.title}</h3> : null}
          {day.text ? <p>{day.text}</p> : null}
        </div>
        <div className="cardGrid">{day.items.map(item=><ContentCard key={`${day.key}-${item.id}`} item={item}/>)}</div>
      </li>)}
    </ol>
    {places.length >= 2 ? <div className="collectionRouteTrip">
      <div className="eyebrow">DARAUS WIRD EINE REISE</div>
      <StoryTripActions places={places} tripTitle={tripTitle} />
    </div> : null}
  </div></section>;
}
