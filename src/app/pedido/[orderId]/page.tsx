import { OrderStatusTracker } from "@/components/public-menu/OrderStatusTracker";

export const dynamic = "force-dynamic";

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = await params;
  return <OrderStatusTracker orderId={resolvedParams.orderId} />;
}
