import Link from "next/link";
import { SaveCount } from "./SaveCount";
import { HeaderAccount } from "./HeaderAccount";
import { AroundMark, AroundWordmark } from "./AroundLogo";

export function Header() {
  return (
    <header className="header">
      <div className="container headerInner">
        <Link href="/" className="wordmark" aria-label="AROUND Home">
          <AroundWordmark className="wordmarkLogo" />
        </Link>
        <nav className="desktopNav" aria-label="Hauptnavigation">
          <Link href="/discover">Entdecken</Link>
          <Link href="/search?type=destination">Reisen</Link>
          <Link href="/stories">Stories</Link>
          <Link href="/search?type=person">Menschen</Link>
          <Link href="/search?type=product">Ideen</Link>
        </nav>
        <div className="headerActions">
          <Link className="headerSearch" href="/search" aria-label="Suche">⌕</Link>
          <Link className="headerMyAround" href="/my-around">
            <AroundMark className="mark mark--mini" />
            <span className="savedLabel">MY AROUND</span>
            <SaveCount className="saveCount--header" />
          </Link>
          <HeaderAccount />
        </div>
      </div>
    </header>
  );
}
