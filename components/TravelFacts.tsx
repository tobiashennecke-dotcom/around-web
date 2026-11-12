import type { TravelFacts as Facts } from "@/lib/types";
import { formatMonthRanges, formatTransfer, timeDifference } from "@/lib/travel-facts";

/** Stable destination facts only - computed where possible, never flight times or airline rules. */
export function TravelFacts({ facts }: { facts?: Facts }) {
  if (!facts) return null;
  const time = timeDifference(facts.timeZone);
  const months = formatMonthRanges(facts.bestMonths);
  const transfer = formatTransfer(facts.airport?.transferMinutes);
  const airport = facts.airport && (facts.airport.code || facts.airport.name)
    ? [facts.airport.code, facts.airport.name].filter(Boolean).join(" · ")
    : null;

  const items = [
    time && { label: "ZEITVERSCHIEBUNG", value: time.label, note: time.note || "zu Deutschland" },
    months && { label: "BESTE REISEZEIT", value: months, note: facts.seasonNote },
    airport && { label: "NÄCHSTER FLUGHAFEN", value: airport, note: transfer ? `${transfer} Transfer` : undefined }
  ].filter(Boolean) as Array<{ label: string; value: string; note?: string }>;

  if (!items.length) return null;
  return (
    <section className="travelFacts" aria-label="Reisefakten">
      <div className={`container travelFactsGrid travelFactsGrid--${items.length}`}>
        {items.map(item => (
          <div className="travelFact" key={item.label}>
            <span className="travelFactLabel">{item.label}</span>
            <strong className="travelFactValue">{item.value}</strong>
            {item.note && <span className="travelFactNote">{item.note}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
