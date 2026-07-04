import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReservationExperience } from "@/components/public-menu/ReservationExperience";
import { getPublicMenuBySlug } from "@/lib/menu-data";
import { stripDemoPrefix } from "@/lib/utils";

export const dynamic = "force-dynamic";
const defaultSocialPreview = "/simi/previews/simi-share-preview.png";

type ReservationPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ReservationPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const cleanSlug = stripDemoPrefix(resolvedParams.slug);
  const menu = cleanSlug !== resolvedParams.slug ? (await getPublicMenuBySlug(cleanSlug)) || (await getPublicMenuBySlug(resolvedParams.slug)) : await getPublicMenuBySlug(resolvedParams.slug);
  if (!menu) return { title: "Reserva no disponible" };
  const title = `Reservar en ${menu.client.name}`;
  const description = `Solicita una reserva en ${menu.client.name}`;
  const previewImage = menu.client.hero_banner_image_url || menu.client.promo_banner_image_url || menu.client.logo_url || defaultSocialPreview;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "SIMI",
      type: "website",
      images: [{ url: previewImage, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [previewImage]
    }
  };
}

export default async function ReservationPage({ params }: ReservationPageProps) {
  const resolvedParams = await params;
  const cleanSlug = stripDemoPrefix(resolvedParams.slug);
  if (cleanSlug !== resolvedParams.slug) {
    const cleanMenu = await getPublicMenuBySlug(cleanSlug);
    if (cleanMenu) redirect(`/reservar/${cleanSlug}`);
  }

  const menu = await getPublicMenuBySlug(resolvedParams.slug);
  if (!menu) notFound();
  return <ReservationExperience client={menu.client} tables={menu.tables || []} />;
}
