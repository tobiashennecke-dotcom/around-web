import type { MediaItem } from "@/lib/types";

function sized(url: string) {
  return url.includes("cdn.sanity.io/") ? `${url}?w=1400&auto=format&q=78&fit=max` : url;
}

/** Full-bleed picture sequence: one image per screen, one sentence per image. */
export function ImmersiveRun({ items, title }: { items: MediaItem[]; title: string }) {
  const total = String(items.length).padStart(2, "0");
  return (
    <section className="immersiveRun" aria-label={`${title} in Bildern`}>
      {items.map((item, index) => (
        <figure className="immersiveShot" key={`${item.url}-${index}`}>
          <img src={sized(item.url)} alt={item.alt || item.caption || title} loading={index < 2 ? "eager" : "lazy"} />
          <figcaption className="container">
            <span className="immersiveIndex">{String(index + 1).padStart(2, "0")} / {total}</span>
            {item.caption && <strong>{item.caption}</strong>}
            {item.credit && <small>Foto: {item.credit}</small>}
          </figcaption>
        </figure>
      ))}
    </section>
  );
}
