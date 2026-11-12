import Link from "next/link";
import { contentHref } from "@/components/ContentCard";
import type { DestinationRegion } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  course: "PLAY", stay: "STAY", eat: "EAT", drink: "EAT", do: "DO", culture: "DO", shop: "DO"
};

/** Regionen within a destination: where exactly, and what sits there. Editor order only. */
export function DestinationRegions({ regions, destinationTitle }: { regions?: DestinationRegion[]; destinationTitle: string }) {
  if (!regions || regions.length < 2) return null;
  return (
    <section className="section destinationRegions" id="regionen" aria-labelledby="destination-regions-heading">
      <div className="container">
        <div className="sectionHead">
          <div>
            <div className="eyebrow lime">REGIONEN</div>
            <h2 className="sectionTitle" id="destination-regions-heading">WO GENAU?</h2>
          </div>
          <p className="sectionNote">{destinationTitle} in {regions.length} Ecken. Jede funktioniert als eigene Basis.</p>
        </div>
        <div className={`destinationRegionsGrid destinationRegionsGrid--${Math.min(regions.length, 3)}`}>
          {regions.map((region, index) => (
            <article className="destinationRegion" key={region.key}>
              <span className="destinationRegionNumber">{String(index + 1).padStart(2, "0")}</span>
              <h3>{region.title}</h3>
              {region.summary && <p>{region.summary}</p>}
              <ul className="destinationRegionPlaces">
                {region.places.map(place => (
                  <li key={place.id}>
                    <Link href={contentHref(place)}>
                      <span className="destinationRegionRole">{ROLE_LABEL[place.placeType || ""] || "PLACE"}</span>
                      <span>{place.title}</span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
