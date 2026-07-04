import { SimiLanding } from "@/components/public/SimiLanding";
import { getPublicLandingContent } from "@/lib/landing-content";

export const dynamic = "force-dynamic";

const defaultSocialPreview = "/simi/previews/simi-share-preview.png";

function getSharePreviewImage(imageUrl?: string | null) {
  if (!imageUrl || imageUrl.toLowerCase().endsWith(".svg")) return defaultSocialPreview;
  return imageUrl;
}

export async function generateMetadata() {
  const content = await getPublicLandingContent();
  const title = content.seo.og_title || content.seo.meta_title || "SIMI";
  const description = content.seo.og_description || content.seo.meta_description || "Tu carta cambia. Tu QR no.";
  const image = getSharePreviewImage(content.seo.og_image_url);

  return {
    title: content.seo.meta_title || "SIMI",
    description: content.seo.meta_description || "Carta digital con QR permanente y pedidos online.",
    openGraph: {
      title,
      description,
      siteName: "SIMI",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: "SIMI - Carta digital, pedidos y reservas" }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    },
    keywords: content.seo.keywords || undefined,
    alternates: content.seo.canonical_url ? { canonical: content.seo.canonical_url } : undefined
  };
}

export default async function HomePage() {
  const content = await getPublicLandingContent();
  return <SimiLanding content={content} />;
}
