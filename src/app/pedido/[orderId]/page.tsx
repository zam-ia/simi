import { OrderStatusTracker } from "@/components/public-menu/OrderStatusTracker";

export const dynamic = "force-dynamic";

export default function OrderTrackingPage({ params }: { params: { orderId: string } }) {
  return <OrderStatusTracker orderId={params.orderId} />;
}
