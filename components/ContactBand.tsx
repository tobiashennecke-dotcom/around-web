import type { ContactChannel } from "@/lib/content";

/**
 * Editorial contact channel ("TIPP FÜR UNS?"): its own band directly above the
 * footer on every page (stories included), never inside the footer itself.
 */
export function ContactBand({ contact }: { contact: ContactChannel | null }) {
  if (!contact || !contact.showInFooter) return null;
  return (
    <section className="contactBand" aria-label="Kontakt zur Redaktion">
      <div className="container contactBandGrid">
        <h2 className="contactBandTitle">{contact.headline}</h2>
        <div className="contactBandAside">
          {contact.text && <p>{contact.text}</p>}
          <div className="contactBandActions">
            {contact.whatsappUrl && (
              <a className="contactBandPrimary" href={contact.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp an die Redaktion →</a>
            )}
            {contact.email && (
              <a className="contactBandSecondary" href={`mailto:${contact.email}`}>{contact.email}</a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
