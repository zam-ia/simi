import { SimiLanding } from "@/components/public/SimiLanding";
import { getPublicLandingContent } from "@/lib/landing-content";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const content = await getPublicLandingContent();
  return {
    title: content.seo.meta_title || "SIMI",
    description: content.seo.meta_description || "Carta digital con QR permanente y pedidos online.",
    openGraph: {
      title: content.seo.og_title || content.seo.meta_title || "SIMI",
      description: content.seo.og_description || content.seo.meta_description || "Tu carta cambia. Tu QR no.",
      images: content.seo.og_image_url ? [content.seo.og_image_url] : undefined
    },
    keywords: content.seo.keywords || undefined,
    alternates: content.seo.canonical_url ? { canonical: content.seo.canonical_url } : undefined
  };
}

export default async function HomePage() {
  const content = await getPublicLandingContent();
  return <SimiLanding content={content} />;
}
