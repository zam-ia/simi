import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationExperience } from "@/components/public-menu/ReservationExperience";
import { getPublicMenuBySlug } from "@/lib/menu-data";

export const dynamic = "force-dynamic";

type ReservationPageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: ReservationPageProps): Promise<Metadata> {
  const menu = await getPublicMenuBySlug(params.slug);
  if (!menu) return { title: "Reserva no disponible" };
  return {
    title: `Reservar en ${menu.client.name}`,
    description: `Solicita una reserva en ${menu.client.name}`
  };
}

export default async function ReservationPage({ params }: ReservationPageProps) {
  const menu = await getPublicMenuBySlug(params.slug);
  if (!menu) notFound();
  return <ReservationExperience client={menu.client} tables={menu.tables || []} />;
}
