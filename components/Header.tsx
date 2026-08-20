import Link from "next/link";

export function Header() {
  return (
    <header className="header">
      <div className="container headerInner">
        <Link href="/" className="wordmark" aria-label="AROUND Home">
          ar<span className="o">o</span>und
        </Link>
        <nav className="desktopNav" aria-label="Hauptnavigation">
          <Link href="/discover">Entdecken</Link>
          <Link href="/destinations/lisbon">Reisen</Link>
          <Link href="/stories/warum-lissabon-mehr-ist-als-golf">Stories</Link>
          <Link href="/collections/city-golf">Collections</Link>
          <Link href="/search">Suche</Link>
        </nav>
        <div className="headerActions">
          <Link className="headerAction" href="/search">⌕</Link>
          <Link className="headerAction" href="/saved"><span className="savedLabel">MY AROUND</span></Link>
          <Link className="headerAction" href="/account">Account</Link>
        </div>
      </div>
    </header>
  );
}
