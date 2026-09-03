"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SaveCount } from "./SaveCount";

function active(pathname: string, href: string) {
  if (href === "/discover") return pathname === "/" || pathname.startsWith("/discover");
  if (href === "/search") return pathname.startsWith("/search");
  if (href === "/saved") return pathname.startsWith("/saved");
  return pathname.startsWith("/my-around/");
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobileBottom mobileBottomV14" aria-label="Mobile Navigation">
      <Link href="/discover" className={active(pathname, "/discover") ? "active" : ""}>
        <span className="mobileNavIcon mobileNavIcon--discover" aria-hidden="true" />
        <span>Entdecken</span>
      </Link>
      <Link href="/search" className={active(pathname, "/search") ? "active" : ""}>
        <span className="mobileNavIcon mobileNavIcon--search" aria-hidden="true" />
        <span>Suche</span>
      </Link>
      <Link href="/saved" className={active(pathname, "/saved") ? "active" : ""}>
        <span className="mobileNavSavedIcon" aria-hidden="true">
          <span className="drop drop--nav" />
          <SaveCount className="saveCount--nav" />
        </span>
        <span>Gespeichert</span>
      </Link>
      <Link href="/my-around/planen" className={active(pathname, "/my-around/planen") ? "active" : ""}>
        <span className="mobileNavIcon mobileNavIcon--plan" aria-hidden="true" />
        <span>Planen</span>
      </Link>
    </nav>
  );
}
