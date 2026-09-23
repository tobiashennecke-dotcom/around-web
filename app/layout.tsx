import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { Footer } from "@/components/Footer";
import { ChromeGate } from "@/components/ChromeGate";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: {
    default: "AROUND — Golf. Weiter gedacht.",
    template: "%s — AROUND"
  },
  description: "Golf Media + Discovery. Orte, Menschen, Ideen und Reisen rund um das Spiel."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <ChromeGate>
          <Header />
        </ChromeGate>
        {children}
        <ChromeGate>
          <Footer />
        </ChromeGate>
        <ChromeGate>
          <MobileNav />
        </ChromeGate>
        <Analytics />
      </body>
    </html>
  );
}
