import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReservationExperience } from "@/components/public-menu/ReservationExperience";
import { getPublicMenuBySlug } from "@/lib/menu-data";
import { stripDemoPrefix } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ReservationPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ReservationPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const cleanSlug = stripDemoPrefix(resolvedParams.slug);
  const menu = cleanSlug !== resolvedParams.slug ? (await getPublicMenuBySlug(cleanSlug)) || (await getPublicMenuBySlug(resolvedParams.slug)) : await getPublicMenuBySlug(resolvedParams.slug);
  if (!menu) return { title: "Reserva no disponible" };
  return {
    title: `Reservar en ${menu.client.name}`,
    description: `Solicita una reserva en ${menu.client.name}`
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
