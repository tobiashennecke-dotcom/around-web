"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SaveCount } from "./SaveCount";

function isMyAroundActive(pathname: string) {
  return pathname === "/my-around" || pathname.startsWith("/saved") || pathname.startsWith("/my-around/collections");
}

function isPlanenActive(pathname: string) {
  return pathname.startsWith("/my-around/planen") || pathname.startsWith("/my-around/trips");
}

export function MobileNav() {
  const pathname = usePathname();
  const myAroundActive = isMyAroundActive(pathname);
  const planenActive = !myAroundActive && isPlanenActive(pathname);

  return (
    <nav className="mobileBottom mobileBottomV14" aria-label="Mobile Navigation">
      <Link href="/discover" className={pathname === "/" || pathname.startsWith("/discover") ? "active" : ""}>
        <span className="mobileNavIcon mobileNavIcon--discover" aria-hidden="true" />
        <span>Entdecken</span>
      </Link>
      <Link href="/search" className={pathname.startsWith("/search") ? "active" : ""}>
        <span className="mobileNavIcon mobileNavIcon--search" aria-hidden="true" />
        <span>Suche</span>
      </Link>
      <Link href="/my-around" className={myAroundActive ? "active" : ""} aria-current={myAroundActive ? "page" : undefined}>
        <span className="mobileNavSavedIcon" aria-hidden="true">
          <span className="drop drop--nav" />
          <SaveCount className="saveCount--nav" />
        </span>
        <span>MY AROUND</span>
      </Link>
      <Link href="/my-around/planen" className={planenActive ? "active" : ""} aria-current={planenActive ? "page" : undefined}>
        <span className="mobileNavIcon mobileNavIcon--plan" aria-hidden="true" />
        <span>Planen</span>
      </Link>
    </nav>
  );
}
