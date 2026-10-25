import { legalComplete } from "@/lib/legal";

/** Visible until every placeholder in lib/legal.ts is replaced. */
export function LegalDraftNotice() {
  if (legalComplete) return null;
  return (
    <p className="legalDraftNotice">
      ENTWURF — Angaben in [eckigen Klammern] werden vor dem Launch ergänzt.
    </p>
  );
}
