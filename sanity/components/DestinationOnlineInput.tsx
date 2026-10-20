"use client";

import {useEffect, useState} from "react";
import {useClient, useFormValue, type BooleanInputProps} from "sanity";

type Counts = {places: number; stories: number};

/**
 * Destination Online/Offline switch with a plain-language summary of what
 * the switch carries along: the Places that belong to this destination and
 * the Stories that relate to it. The rule itself lives in
 * lib/sanity/queries.ts (DESTINATION_ONLINE / PLACE_ONLINE / STORY_ONLINE);
 * this component only explains it to editors.
 */
export function DestinationOnlineInput(props: BooleanInputProps) {
  const client = useClient({apiVersion: "2026-03-01"}).withConfig({useCdn: false});
  const rawId = useFormValue(["_id"]) as string | undefined;
  const id = rawId?.replace(/^drafts\./, "");
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    client
      .fetch<Counts>(
        `{
          "places": count(*[_type == "place" && destination._ref == $id && !(_id in path("drafts.**"))]),
          "stories": count(*[_type == "story" && $id in related[]._ref && !(_id in path("drafts.**"))])
        }`,
        {id}
      )
      .then(result => { if (!cancelled) setCounts(result); })
      .catch(() => { if (!cancelled) setCounts(null); });
    return () => { cancelled = true; };
  }, [client, id]);

  const online = props.value !== false;

  return (
    <div>
      {props.renderDefault(props)}
      <p style={{margin: "8px 0 0", fontSize: 13, lineHeight: 1.45}}>
        {online
          ? "Online: Die Destination ist auf der Website sichtbar."
          : "Offline: Die Destination ist auf der Website ausgeblendet."}
        {counts
          ? ` Der Schalter gilt auch für ${counts.places} ${counts.places === 1 ? "Place" : "Places"} und die Sichtbarkeit von ${counts.stories} verknüpften ${counts.stories === 1 ? "Story" : "Stories"}.`
          : ""}
      </p>
    </div>
  );
}
