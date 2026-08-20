import Link from "next/link";

export function MobileNav() {
  return (
    <nav className="mobileBottom" aria-label="Mobile Navigation">
      <Link href="/discover"><b>○</b><span>Entdecken</span></Link>
      <Link href="/search"><b>⌕</b><span>Suche</span></Link>
      <Link href="/saved"><b>●</b><span>Gespeichert</span></Link>
      <Link href="/collections/city-golf"><b>+</b><span>Collections</span></Link>
    </nav>
  );
}
