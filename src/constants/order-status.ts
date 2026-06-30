import type { OrderStatus, OrderType, PaymentStatus } from "@/types/menu";

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Pedido recibido",
  received: "Pedido recibido",
  payment_pending: "Pago pendiente",
  payment_submitted: "Comprobante enviado",
  payment_validated: "Pago validado",
  preparing: "En cocina",
  ready: "Listo para entregar",
  handed_to_courier: "Entregado al repartidor",
  on_the_way: "Pedido en camino",
  arriving: "Por llegar",
  delivered: "Pedido entregado",
  cancelled: "Cancelado"
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending_payment: "Pendiente de pago",
  proof_submitted: "Comprobante enviado",
  validated: "Validado",
  rejected: "Rechazado"
};

export const orderTypeLabels: Record<OrderType, string> = {
  dine_in: "Mesa",
  pickup: "Recojo",
  delivery: "Delivery"
};

export const kitchenStatusOptions: OrderStatus[] = [
  "new",
  "payment_pending",
  "payment_submitted",
  "payment_validated",
  "preparing",
  "ready",
  "delivered",
  "cancelled"
];

export const deliveryStatusOptions: OrderStatus[] = [
  "new",
  "payment_pending",
  "payment_submitted",
  "payment_validated",
  "preparing",
  "ready",
  "handed_to_courier",
  "on_the_way",
  "arriving",
  "delivered",
  "cancelled"
];

export function getStatusOptions(orderType: OrderType) {
  return orderType === "delivery" ? deliveryStatusOptions : kitchenStatusOptions;
}

export function getVisibleTrackingSteps(orderType: OrderType): OrderStatus[] {
  if (orderType === "delivery") {
    return ["new", "preparing", "ready", "handed_to_courier", "on_the_way", "arriving", "delivered"];
  }

  if (orderType === "pickup") {
    return ["new", "preparing", "ready", "delivered"];
  }

  return ["new", "preparing", "ready", "delivered"];
}

export function getTrackingStepIndex(status: OrderStatus, orderType: OrderType) {
  const normalizedStatus = status === "received" || status === "payment_pending" || status === "payment_submitted" || status === "payment_validated" ? "new" : status;
  const steps = getVisibleTrackingSteps(orderType);
  const index = steps.indexOf(normalizedStatus);
  return index >= 0 ? index : 0;
}
