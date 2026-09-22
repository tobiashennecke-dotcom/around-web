import type { Metadata } from "next";
import "./preview.css";
import { getPartnerPreview } from "@/lib/partner-preview";
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

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPartnerPreview();
  const { seo } = content;

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: [{ url: seo.ogImage }]
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.ogImage]
    },
    robots: seo.noindex ? { index: false, follow: false } : { index: true, follow: true }
  };
}

export default async function PreviewPage() {
  const content = await getPartnerPreview();

  return (
    <div className="pv-page">
      <PreviewHeader />
      <main>
        <PreviewHero content={content} />
        <AroundIntro content={content} />
        <ProductJourney content={content} />
        <EditorialPrinciples content={content} />
        <FieldStories content={content} />
        <AroundIt content={content} />
        <SaveDemo content={content} />
        <EditorialUniverse content={content} />
        <PartnerSection content={content} />
        <PreviewContact content={content} />
        <PreviewStatus content={content} />
      </main>
      <PreviewFooter content={content} />
    </div>
  );
}
