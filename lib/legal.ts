/**
 * Operator data for /impressum and /datenschutz. This is the only place to
 * fill in. Every value in [eckigen Klammern] is a placeholder: while any
 * placeholder is left, both pages show a draft notice and stay noindex.
 *
 * Optional lines (phone, VAT id, register) can be set to "" to hide them.
 */
export const LEGAL = {
  /** Name of the person or company that operates AROUND, incl. legal form. */
  operator: "[Name / Firma inkl. Rechtsform]",
  street: "[Straße Hausnummer]",
  city: "[PLZ Ort]",
  country: "Deutschland",
  email: "[hello@thisisaround.de]",
  phone: "[Telefonnummer]",
  /** Legal representative, only for companies (GmbH, UG …). */
  representative: "",
  /** e.g. "Amtsgericht Musterstadt, HRB 12345" — only if registered. */
  register: "",
  /** USt-IdNr. per § 27a UStG — only if one exists. */
  vatId: "",
  /** Responsible for editorial content per § 18 Abs. 2 MStV, with address. */
  editorialResponsible: "[Vorname Nachname, Anschrift wie oben]",
  /** Region of the Supabase project (Dashboard → Settings → General), e.g. "Frankfurt (EU)". */
  supabaseRegion: "[Supabase-Region prüfen]",
  /** Date the privacy policy was last reviewed. */
  privacyUpdated: "[TT.MM.JJJJ]"
};

export function isPlaceholder(value: string) {
  return /^\[.*\]$/.test(value.trim());
}

export const legalComplete = Object.values(LEGAL).every(value => !isPlaceholder(value));
