import type { AdminContext } from "@/lib/auth";

export type AdminModule = "dashboard" | "clients" | "demos" | "landing" | "menu" | "orders" | "kitchen" | "delivery" | "promotions" | "reservations" | "payments" | "settings" | "users";

export type BusinessRole = "business_owner" | "business_admin" | "cashier" | "kitchen" | "delivery" | "viewer";

export type ModulePermissions = Partial<Record<AdminModule, boolean>>;

export const adminModules: Record<AdminModule, { label: string; description: string; href: string }> = {
  dashboard: {
    label: "Inicio",
    description: "Resumen operativo del negocio.",
    href: "/admin"
  },
  clients: {
    label: "Clientes",
    description: "Gestion del negocio completo. Solo super admin.",
    href: "/admin"
  },
  demos: {
    label: "Demos",
    description: "Solicitudes, agenda y seguimiento comercial.",
    href: "/admin/demos"
  },
  landing: {
    label: "Landing",
    description: "Editor comercial de la pagina publica de SIMI.",
    href: "/admin/landing"
  },
  menu: {
    label: "Carta",
    description: "Categorias, productos, mesas y QR.",
    href: "/admin/clients"
  },
  orders: {
    label: "Pedidos",
    description: "Pedidos, comprobantes y pagos.",
    href: "/admin/orders"
  },
  kitchen: {
    label: "Cocina",
    description: "Preparacion, reparto y estados en vivo.",
    href: "/admin/kitchen"
  },
  delivery: {
    label: "Delivery",
    description: "Zonas, costos y tiempos de reparto.",
    href: "/admin/delivery"
  },
  promotions: {
    label: "Promociones",
    description: "Ofertas, cupones y reglas comerciales.",
    href: "/admin/promotions"
  },
  reservations: {
    label: "Reservas",
    description: "Solicitudes de reserva y estado de mesas.",
    href: "/admin/reservations"
  },
  payments: {
    label: "Pagos",
    description: "Yape, Plin, efectivo y otros metodos manuales.",
    href: "/admin/payments"
  },
  settings: {
    label: "Configuracion",
    description: "WhatsApp de notificaciones y datos operativos.",
    href: "/admin/settings"
  },
  users: {
    label: "Usuarios",
    description: "Roles y permisos del equipo.",
    href: "/admin/users"
  }
};

export const businessRoleLabels: Record<BusinessRole, string> = {
  business_owner: "Propietario",
  business_admin: "Administrador",
  cashier: "Caja",
  kitchen: "Cocina",
  delivery: "Reparto",
  viewer: "Solo lectura"
};

export const businessRoleDescriptions: Record<BusinessRole, string> = {
  business_owner: "Control total del negocio y sus usuarios.",
  business_admin: "Gestiona carta, pedidos, cocina, configuracion y usuarios.",
  cashier: "Valida pagos y revisa pedidos.",
  kitchen: "Gestiona preparacion y estados de cocina.",
  delivery: "Actualiza estados de reparto.",
  viewer: "Puede revisar informacion sin operar cambios criticos."
};

export const defaultRolePermissions: Record<BusinessRole, ModulePermissions> = {
  business_owner: {
    dashboard: true,
    menu: true,
    orders: true,
    kitchen: true,
    delivery: true,
    promotions: true,
    reservations: true,
    payments: true,
    settings: true,
    users: true
  },
  business_admin: {
    dashboard: true,
    menu: true,
    orders: true,
    kitchen: true,
    delivery: true,
    promotions: true,
    reservations: true,
    payments: true,
    settings: true,
    users: true
  },
  cashier: {
    dashboard: true,
    orders: true,
    payments: true,
    reservations: true
  },
  kitchen: {
    dashboard: true,
    kitchen: true
  },
  delivery: {
    dashboard: true,
    kitchen: true,
    delivery: true
  },
  viewer: {
    dashboard: true,
    orders: true,
    reservations: true
  }
};

export const businessRoles = Object.keys(businessRoleLabels) as BusinessRole[];

export const configurableModules: AdminModule[] = ["dashboard", "menu", "orders", "kitchen", "delivery", "promotions", "reservations", "payments", "settings", "users"];

export function normalizeBusinessRole(value?: string | null): BusinessRole {
  return businessRoles.includes(value as BusinessRole) ? (value as BusinessRole) : "business_admin";
}

export function resolveModulePermissions(role: BusinessRole, overrides?: ModulePermissions | null): ModulePermissions {
  return {
    ...defaultRolePermissions[role],
    ...(overrides || {}),
    dashboard: true
  };
}

export function canAccessModule(context: Pick<AdminContext, "role" | "businessRole" | "modulePermissions">, module: AdminModule) {
  if (context.role === "super_admin") return true;
  if (module === "clients" || module === "demos" || module === "landing") return false;
  const permissions = resolveModulePermissions(context.businessRole || "business_admin", context.modulePermissions);
  return Boolean(permissions[module]);
}

export function moduleFromPath(pathname: string): AdminModule {
  if (pathname.startsWith("/admin/clients")) return "menu";
  if (pathname.startsWith("/admin/demos")) return "demos";
  if (pathname.startsWith("/admin/landing")) return "landing";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/kitchen")) return "kitchen";
  if (pathname.startsWith("/admin/delivery")) return "delivery";
  if (pathname.startsWith("/admin/promotions")) return "promotions";
  if (pathname.startsWith("/admin/reservations")) return "reservations";
  if (pathname.startsWith("/admin/payments")) return "payments";
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/users")) return "users";
  return "dashboard";
}
