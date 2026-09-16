type Props = {
  className?: string;
};

/**
 * Reader-facing PREMIUM access marker - represents ACCESS STATUS ONLY, never
 * editorial quality. Must stay visually and logically independent from
 * AROUND Selected (an editorial judgment badge, see .selectedBadge): no
 * shared class, no shared visual language, and never gold/crown/star/
 * "best"/"exclusive" language. The label always spells out PREMIUM in text
 * - never an icon-only marker.
 */
export function PremiumAccessBadge({ className = "" }: Props) {
  return <span className={`premiumBadge ${className}`.trim()}>PREMIUM</span>;
}
