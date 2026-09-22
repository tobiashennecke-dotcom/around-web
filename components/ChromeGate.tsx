"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The /preview partner onepager brings its own minimal header/footer (see
 * components/preview/*) and must not surface the live product's global nav,
 * search or My AROUND chrome. Everything else keeps the existing Header/
 * Footer/MobileNav unchanged.
 */
export function ChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/preview")) return null;
  return <>{children}</>;
}
