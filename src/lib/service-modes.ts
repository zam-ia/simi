import type { Client, ClientServiceModes, OrderType } from "@/types/menu";

type StoredServiceModeConfig = Record<string, unknown> | null | undefined;

type LegacyServiceModeSettings = {
  deliveryEnabled?: boolean | null;
  pickupEnabled?: boolean | null;
  reservationsEnabled?: boolean | null;
};

export const defaultClientServiceModes: ClientServiceModes = {
  delivery: true,
  pickup: true,
  dineIn: true,
  reservations: true
};

function storedBoolean(config: StoredServiceModeConfig, key: string, fallback: boolean) {
  const value = config && typeof config === "object" ? config[key] : undefined;
  return typeof value === "boolean" ? value : fallback;
}

export function getClientServiceModes(
  client: Pick<Client, "order_flow_config"> | null | undefined,
  legacy: LegacyServiceModeSettings = {}
): ClientServiceModes {
  const config = client?.order_flow_config;
  const deliveryFallback = typeof legacy.deliveryEnabled === "boolean" ? legacy.deliveryEnabled : defaultClientServiceModes.delivery;
  const pickupFallback = typeof legacy.pickupEnabled === "boolean" ? legacy.pickupEnabled : defaultClientServiceModes.pickup;
  const reservationsFallback = typeof legacy.reservationsEnabled === "boolean" ? legacy.reservationsEnabled : defaultClientServiceModes.reservations;
  const dineIn = storedBoolean(config, "dine_in_enabled", defaultClientServiceModes.dineIn);

  return {
    delivery: storedBoolean(config, "delivery_enabled", deliveryFallback),
    pickup: storedBoolean(config, "pickup_enabled", pickupFallback),
    dineIn,
    reservations: dineIn && storedBoolean(config, "reservations_enabled", reservationsFallback)
  };
}

export function mergeClientServiceModes(
  current: StoredServiceModeConfig,
  patch: Partial<ClientServiceModes>
): Record<string, unknown> {
  const currentModes = getClientServiceModes({ order_flow_config: current || {} });
  const nextModes = { ...currentModes, ...patch };

  if (!nextModes.dineIn) nextModes.reservations = false;

  return {
    ...(current && typeof current === "object" ? current : {}),
    delivery_enabled: nextModes.delivery,
    pickup_enabled: nextModes.pickup,
    dine_in_enabled: nextModes.dineIn,
    reservations_enabled: nextModes.reservations
  };
}

export function getAvailableOrderTypes(modes: ClientServiceModes): OrderType[] {
  const available: OrderType[] = [];
  if (modes.delivery) available.push("delivery");
  if (modes.pickup) available.push("pickup");
  if (modes.dineIn) available.push("dine_in");
  return available;
}

export function isOrderTypeEnabled(modes: ClientServiceModes, orderType: string): orderType is OrderType {
  return getAvailableOrderTypes(modes).includes(orderType as OrderType);
}
