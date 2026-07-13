import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PublicMenuExperience } from "@/components/public-menu/PublicMenuExperience";
import { getPublicMenuBySlug } from "@/lib/menu-data";
import { getPublicMenuUrl, stripDemoPrefix } from "@/lib/utils";

export const dynamic = "force-dynamic";

const defaultSocialPreview = "/simi/brand_app_icons/simi-og-image.png";

type MenuPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ mesa?: string }>;
};

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const cleanSlug = stripDemoPrefix(resolvedParams.slug);
  const menu = cleanSlug !== resolvedParams.slug ? (await getPublicMenuBySlug(cleanSlug)) || (await getPublicMenuBySlug(resolvedParams.slug)) : await getPublicMenuBySlug(resolvedParams.slug);

  if (!menu) {
    return {
      title: "Menu no disponible"
    };
  }

  const title = `Menu de ${menu.client.name}`;
  const description = `Mira la carta digital de ${menu.client.name}`;
  const hasBusinessLogo = Boolean(menu.client.logo_url?.trim());
  const previewImage = menu.client.logo_url?.trim() || defaultSocialPreview;
  const canonicalUrl = getPublicMenuUrl(menu.client.slug);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "SIMI",
      type: "website",
      images: [{
        url: previewImage,
        width: hasBusinessLogo ? 900 : 1200,
        height: hasBusinessLogo ? 900 : 630,
        alt: hasBusinessLogo ? `Logo de ${menu.client.name}` : "SIMI - Carta digital, pedidos y reservas"
      }]
    },
    twitter: {
      card: hasBusinessLogo ? "summary" : "summary_large_image",
      title,
      description,
      images: [previewImage]
    }
  };
}

export default async function PublicMenuPage({ params, searchParams }: MenuPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const cleanSlug = stripDemoPrefix(resolvedParams.slug);
  if (cleanSlug !== resolvedParams.slug) {
    const cleanMenu = await getPublicMenuBySlug(cleanSlug);
    if (cleanMenu) {
      const query = resolvedSearchParams?.mesa ? `?mesa=${encodeURIComponent(resolvedSearchParams.mesa)}` : "";
      redirect(`/menu/${cleanSlug}${query}`);
    }
  }

  const menu = await getPublicMenuBySlug(resolvedParams.slug);
  if (!menu) notFound();

  return (
    <PublicMenuExperience
      client={menu.client}
      categories={menu.categories}
      tables={menu.tables || []}
      deliveryZones={menu.deliveryZones || []}
      promotions={menu.promotions || []}
      paymentMethods={menu.paymentMethods || []}
      serviceModes={menu.serviceModes}
      initialTableNumber={resolvedSearchParams?.mesa}
    />
  );
}
