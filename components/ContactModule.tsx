import type { ContactChannel } from "@/lib/content";

/** Editorial contact channel ("TIPP FÜR UNS?"). Footer = compact, story = after the read. */
export function ContactModule({ contact, variant }: { contact: ContactChannel | null; variant: "footer" | "story" }) {
  if (!contact) return null;
  if (variant === "footer" && !contact.showInFooter) return null;
  if (variant === "story" && !contact.showOnStories) return null;
  return (
    <section className={`contactModule contactModule--${variant}`} aria-label="Kontakt zur Redaktion">
      <div className="container contactModuleInner">
        <div>
          <div className="eyebrow lime">{contact.headline}</div>
          {contact.text && <p>{contact.text}</p>}
        </div>
        <div className="contactModuleActions">
          {contact.whatsappUrl && (
            <a className="primary" href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp an die Redaktion →</a>
          )}
          {contact.email && (
            <a className="secondary contactModuleMail" href={`mailto:${contact.email}`}>{contact.email}</a>
          )}
        </div>
      </div>
    </section>
  );
}
