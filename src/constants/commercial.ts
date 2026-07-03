import type { BusinessType, DemoMeetingChannel, DemoRequestStatus } from "@/types/menu";

export const businessTypeLabels: Record<BusinessType, string> = {
  fast_food: "Comida rapida",
  restaurant: "Restaurante",
  polleria: "Polleria",
  coffee_shop: "Cafeteria",
  bakery: "Panaderia",
  pastry_shop: "Pasteleria",
  ice_cream_shop: "Heladeria",
  catering: "Catering",
  other_gastronomic: "Otro gastronomico"
};

export const businessTypeOptions = Object.entries(businessTypeLabels) as Array<[BusinessType, string]>;

export const demoStatusLabels: Record<DemoRequestStatus, string> = {
  NUEVA: "Nueva",
  CONTACTADO: "Contactado",
  DEMO_AGENDADA: "Demo agendada",
  DEMO_REALIZADA: "Demo realizada",
  SEGUIMIENTO: "Seguimiento",
  CONVERTIDO: "Convertido",
  NO_INTERESADO: "No interesado",
  DESCARTADO: "Descartado"
};

export const demoStatusOptions = Object.entries(demoStatusLabels) as Array<[DemoRequestStatus, string]>;

export const demoMeetingChannels: DemoMeetingChannel[] = ["Zoom", "Meet", "Presencial", "WhatsApp"];

export function getBusinessModuleLabels(type?: BusinessType | null) {
  if (type === "pastry_shop" || type === "bakery" || type === "catering") {
    return {
      catalog: type === "catering" ? "Servicios" : "Catalogo",
      kitchen: "Produccion",
      reservations: "Agenda",
      quickSale: "Venta rapida"
    };
  }

  if (type === "coffee_shop") {
    return {
      catalog: "Carta",
      kitchen: "Preparacion",
      reservations: "Agenda",
      quickSale: "Venta rapida"
    };
  }

  return {
    catalog: "Carta",
    kitchen: "Cocina",
    reservations: "Reservas",
    quickSale: "Pedido manual"
  };
}
