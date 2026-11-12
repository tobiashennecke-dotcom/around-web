import { defineField, defineType } from "sanity";

/**
 * Singleton (id around-contact): the editorial contact channel ("Tipp für
 * uns?"). Every channel is optional; the band above the footer only renders
 * when at least one channel is filled AND the module is switched on.
 */
export const contactSettings = defineType({
  name: "contactSettings",
  title: "Kontakt zur Redaktion",
  type: "document",
  fields: [
    defineField({ name: "isEnabled", title: "Kontaktmodul zeigen", type: "boolean", initialValue: false }),
    defineField({ name: "headline", title: "Überschrift", type: "string", initialValue: "TIPP FÜR UNS?" }),
    defineField({
      name: "text", title: "Text", type: "text", rows: 3,
      initialValue: "Ein Platz, ein Hotel, eine Bar, die wir kennen sollten? Schreib uns. Wir lesen alles."
    }),
    defineField({
      name: "whatsappNumber", title: "WhatsApp-Nummer", type: "string",
      description: "International, z. B. +49 170 1234567. Leer = kein WhatsApp-Button.",
      validation: r => r.custom(value => !value || /^\+?[0-9 ()-]{7,20}$/.test(String(value)) || "Bitte als Telefonnummer, z. B. +49 170 1234567.")
    }),
    defineField({
      name: "whatsappPrefill", title: "WhatsApp-Vorlagetext", type: "string",
      initialValue: "Hi AROUND, ich hab einen Tipp für euch: "
    }),
    defineField({ name: "email", title: "E-Mail", type: "string", validation: r => r.email() }),
    defineField({
      name: "showInFooter", title: "Auf jeder Seite über dem Footer zeigen", type: "boolean", initialValue: true,
      description: "Eigener Lime-Block direkt über dem Footer – damit auch am Ende jeder Story."
    })
  ],
  preview: {
    select: { enabled: "isEnabled", wa: "whatsappNumber", mail: "email" },
    prepare({ enabled, wa, mail }) {
      return { title: "Kontakt zur Redaktion", subtitle: `${enabled ? "an" : "aus"} · ${[wa && "WhatsApp", mail && "Mail"].filter(Boolean).join(" + ") || "kein Kanal"}` };
    }
  }
});
