import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { Footer } from "@/components/Footer";

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
        <Header />
        {children}
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
