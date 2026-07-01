import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PublicMenuExperience } from "@/components/public-menu/PublicMenuExperience";
import { getPublicMenuBySlug } from "@/lib/menu-data";
import { getPublicMenuUrl, stripDemoPrefix } from "@/lib/utils";

export const dynamic = "force-dynamic";

type MenuPageProps = {
  params: { slug: string };
  searchParams?: { mesa?: string };
};

export async function generateMetadata({ params }: MenuPageProps): Promise<Metadata> {
  const cleanSlug = stripDemoPrefix(params.slug);
  const menu = cleanSlug !== params.slug ? (await getPublicMenuBySlug(cleanSlug)) || (await getPublicMenuBySlug(params.slug)) : await getPublicMenuBySlug(params.slug);

  if (!menu) {
    return {
      title: "Menú no disponible"
    };
  }

  const title = `Menú de ${menu.client.name}`;
  const description = `Mira la carta digital de ${menu.client.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: getPublicMenuUrl(menu.client.slug),
      images: menu.client.logo_url ? [menu.client.logo_url] : undefined
    }
  };
}

export default async function PublicMenuPage({ params, searchParams }: MenuPageProps) {
  const cleanSlug = stripDemoPrefix(params.slug);
  if (cleanSlug !== params.slug) {
    const cleanMenu = await getPublicMenuBySlug(cleanSlug);
    if (cleanMenu) {
      const query = searchParams?.mesa ? `?mesa=${encodeURIComponent(searchParams.mesa)}` : "";
      redirect(`/menu/${cleanSlug}${query}`);
    }
  }

  const menu = await getPublicMenuBySlug(params.slug);
  if (!menu) notFound();

  return (
    <PublicMenuExperience
      client={menu.client}
      categories={menu.categories}
      tables={menu.tables || []}
      deliveryZones={menu.deliveryZones || []}
      promotions={menu.promotions || []}
      paymentMethods={menu.paymentMethods || []}
      initialTableNumber={searchParams?.mesa}
    />
  );
}
