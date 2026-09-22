import type { Metadata } from "next";
import "./preview.css";
import { previewContent } from "@/lib/preview-content";
import { PreviewHeader } from "@/components/preview/PreviewHeader";
import { PreviewHero } from "@/components/preview/PreviewHero";
import { AroundIntro } from "@/components/preview/AroundIntro";
import { ProductJourney } from "@/components/preview/ProductJourney";
import { EditorialPrinciples } from "@/components/preview/EditorialPrinciples";
import { FieldStories } from "@/components/preview/FieldStories";
import { AroundIt } from "@/components/preview/AroundIt";
import { SaveDemo } from "@/components/preview/SaveDemo";
import { EditorialUniverse } from "@/components/preview/EditorialUniverse";
import { PartnerSection } from "@/components/preview/PartnerSection";
import { PreviewContact } from "@/components/preview/PreviewContact";
import { PreviewStatus } from "@/components/preview/PreviewStatus";
import { PreviewFooter } from "@/components/preview/PreviewFooter";

export const metadata: Metadata = {
  title: previewContent.seo.title,
  description: previewContent.seo.description,
  openGraph: {
    title: previewContent.seo.title,
    description: previewContent.seo.description,
    images: [{ url: previewContent.seo.ogImage }]
  },
  twitter: {
    card: "summary_large_image",
    title: previewContent.seo.title,
    description: previewContent.seo.description,
    images: [previewContent.seo.ogImage]
  },
  robots: previewContent.seo.noindex
    ? { index: false, follow: false }
    : { index: true, follow: true }
};

export default function PreviewPage() {
  return (
    <div className="pv-page">
      <PreviewHeader />
      <main>
        <PreviewHero />
        <AroundIntro />
        <ProductJourney />
        <EditorialPrinciples />
        <FieldStories />
        <AroundIt />
        <SaveDemo />
        <EditorialUniverse />
        <PartnerSection />
        <PreviewContact />
        <PreviewStatus />
      </main>
      <PreviewFooter />
    </div>
  );
}
