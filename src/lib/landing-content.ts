import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const landingSectionKeys = [
  "hero",
  "qr_link",
  "menu_update",
  "orders",
  "agenda",
  "dashboard",
  "experience",
  "how_it_works",
  "business_types",
  "demo_form",
  "final_cta",
  "footer"
] as const;

export type LandingSectionKey = (typeof landingSectionKeys)[number];
export type LandingStatus = "draft" | "published";

export type LandingSection = {
  id?: string;
  section_key: LandingSectionKey;
  title: string;
  subtitle: string | null;
  description: string | null;
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  image_light_url: string | null;
  image_dark_url: string | null;
  alt_text: string | null;
  sort_order: number;
  is_visible: boolean;
  status: LandingStatus;
  metadata: Record<string, unknown>;
  updated_at?: string;
};

export type LandingBusinessType = {
  id?: string;
  name: string;
  description: string | null;
  image_light_url: string | null;
  image_dark_url: string | null;
  alt_text: string | null;
  sort_order: number;
  is_visible: boolean;
  status: LandingStatus;
};

export type LandingSeoSettings = {
  id?: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  keywords: string | null;
  status: LandingStatus;
};

export type LandingContent = {
  sections: LandingSection[];
  sectionMap: Record<LandingSectionKey, LandingSection>;
  businessTypes: LandingBusinessType[];
  seo: LandingSeoSettings;
};

export const defaultLandingSections: LandingSection[] = [
  {
    section_key: "hero",
    title: "Tu carta cambia. Tu QR no.",
    subtitle: "Deja de reenviar tu carta cada vez que cambias precios, platos o promociones.",
    description: "Con SIMI tienes una carta digital con QR permanente y un link para redes donde tus clientes ven el menu actualizado y hacen pedidos.",
    primary_cta_label: "Solicitar demo",
    primary_cta_url: "#demo",
    secondary_cta_label: "Ver ejemplo",
    secondary_cta_url: "/menu/pollo-loco",
    image_light_url: null,
    image_dark_url: null,
    alt_text: "Vista de carta digital SIMI en celular y panel administrativo",
    sort_order: 10,
    is_visible: true,
    status: "published",
    metadata: { badge: "QR permanente + carta viva + pedidos ordenados" }
  },
  {
    section_key: "qr_link",
    title: "QR permanente + link para redes",
    subtitle: "QR + link",
    description: "Pon tu carta en mesas, Instagram, WhatsApp o Google Maps sin volver a cambiar el QR.",
    primary_cta_label: null,
    primary_cta_url: null,
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: "QR permanente junto a carta digital en celular",
    sort_order: 20,
    is_visible: true,
    status: "published",
    metadata: {}
  },
  {
    section_key: "menu_update",
    title: "Actualiza tu menu en segundos",
    subtitle: "Carta actualizable",
    description: "Edita precios, productos, fotos o promociones desde tu panel y el cambio se refleja en tu carta digital.",
    primary_cta_label: null,
    primary_cta_url: null,
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: "Panel editando producto y menu actualizado en celular",
    sort_order: 30,
    is_visible: true,
    status: "published",
    metadata: {}
  },
  {
    section_key: "orders",
    title: "Pedidos mas ordenados",
    subtitle: "Pedidos",
    description: "Recibe pedidos para mesa, recojo o delivery desde el mismo menu, sin depender de chats desordenados.",
    primary_cta_label: null,
    primary_cta_url: null,
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: "Pedido del cliente y centro de pedidos del negocio",
    sort_order: 40,
    is_visible: true,
    status: "published",
    metadata: {}
  },
  {
    section_key: "agenda",
    title: "Agenda y reservas segun tu negocio",
    subtitle: "Agenda",
    description: "Organiza reservas, pedidos programados o entregas desde una vista mas clara.",
    primary_cta_label: null,
    primary_cta_url: null,
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: "Calendario de agenda y reservas",
    sort_order: 50,
    is_visible: true,
    status: "published",
    metadata: {}
  },
  {
    section_key: "dashboard",
    title: "Controla tu negocio desde un solo panel",
    subtitle: "Panel",
    description: "Gestiona carta, pedidos, pagos, agenda y operacion desde una interfaz clara.",
    primary_cta_label: null,
    primary_cta_url: null,
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: "Panel administrativo SIMI",
    sort_order: 60,
    is_visible: true,
    status: "published",
    metadata: {}
  },
  {
    section_key: "experience",
    title: "Asi lo ve tu cliente. Asi lo ves tu.",
    subtitle: "Experiencia real",
    description: "Explora como se veria una carta digital moderna y como se gestiona desde el panel del negocio.",
    primary_cta_label: "Ver ejemplo",
    primary_cta_url: "/menu/pollo-loco",
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: "Vista cliente y vista negocio de SIMI",
    sort_order: 70,
    is_visible: true,
    status: "published",
    metadata: {}
  },
  {
    section_key: "how_it_works",
    title: "Cuatro pasos. Sin complicar al cliente.",
    subtitle: "Como funciona",
    description: "Cada paso tiene una accion clara y una vista simple para el negocio.",
    primary_cta_label: null,
    primary_cta_url: null,
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: null,
    sort_order: 80,
    is_visible: true,
    status: "published",
    metadata: {}
  },
  {
    section_key: "business_types",
    title: "SIMI se adapta al tipo de negocio.",
    subtitle: "Rubros compatibles",
    description: "La misma base se adapta a carta, catalogo, agenda, pedidos o delivery segun el rubro.",
    primary_cta_label: null,
    primary_cta_url: null,
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: null,
    sort_order: 90,
    is_visible: true,
    status: "published",
    metadata: {}
  },
  {
    section_key: "demo_form",
    title: "Quieres ver como quedaria en tu negocio?",
    subtitle: "Demo personalizada",
    description: "Dejanos tus datos y te mostraremos una demo personalizada por WhatsApp, Zoom, Meet o presencial.",
    primary_cta_label: "Solicitar demo personalizada",
    primary_cta_url: "#demo",
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: null,
    sort_order: 100,
    is_visible: true,
    status: "published",
    metadata: {
      successMessage: "Gracias. Revisaremos tu negocio y te contactaremos por WhatsApp para agendar una demo.",
      legalText: "Te contactaremos por WhatsApp para agendar una demo personalizada."
    }
  },
  {
    section_key: "final_cta",
    title: "Que el cliente vea el menu. Que tu equipo vea el control.",
    subtitle: "",
    description: "Empieza con una demo corta y revisa como se veria SIMI aplicado a tu negocio.",
    primary_cta_label: "Quiero ver como se veria en mi negocio",
    primary_cta_url: "#demo",
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: null,
    sort_order: 110,
    is_visible: true,
    status: "published",
    metadata: {}
  },
  {
    section_key: "footer",
    title: "SIMI - Carta digital, pedidos y operacion para negocios gastronomicos.",
    subtitle: "",
    description: "",
    primary_cta_label: "Ingresar al panel",
    primary_cta_url: "/login",
    secondary_cta_label: null,
    secondary_cta_url: null,
    image_light_url: null,
    image_dark_url: null,
    alt_text: null,
    sort_order: 120,
    is_visible: true,
    status: "published",
    metadata: {}
  }
];

export const defaultLandingBusinessTypes: LandingBusinessType[] = [
  { name: "Restaurantes", description: "Menu + pedido en mesa + reservas", image_light_url: null, image_dark_url: null, alt_text: "Restaurante usando SIMI", sort_order: 10, is_visible: true, status: "published" },
  { name: "Pastelerias", description: "Catalogo + agenda de entregas", image_light_url: null, image_dark_url: null, alt_text: "Pasteleria usando SIMI", sort_order: 20, is_visible: true, status: "published" },
  { name: "Cafeterias", description: "Recojo + delivery + venta rapida", image_light_url: null, image_dark_url: null, alt_text: "Cafeteria usando SIMI", sort_order: 30, is_visible: true, status: "published" },
  { name: "Pollerias", description: "Combos + cocina + delivery", image_light_url: null, image_dark_url: null, alt_text: "Polleria usando SIMI", sort_order: 40, is_visible: true, status: "published" }
];

export const defaultLandingSeo: LandingSeoSettings = {
  meta_title: "SIMI | Carta digital con QR permanente y pedidos online",
  meta_description: "SIMI ayuda a negocios gastronomicos a tener carta digital, QR permanente, link para redes, pedidos, agenda y panel administrativo.",
  og_title: "SIMI",
  og_description: "Tu carta cambia. Tu QR no.",
  og_image_url: "/simi/brand_app_icons/SIMI_icono.svg",
  canonical_url: "https://simi-peru.vercel.app",
  keywords: "carta digital, QR restaurante, pedidos online, SIMI",
  status: "published"
};

type BuildLandingContentOptions = {
  fillMissingSections?: boolean;
  fillMissingBusinessTypes?: boolean;
};

export function buildLandingContent(
  sections: LandingSection[] = defaultLandingSections,
  businessTypes: LandingBusinessType[] = defaultLandingBusinessTypes,
  seo: LandingSeoSettings = defaultLandingSeo,
  options: BuildLandingContentOptions = {}
): LandingContent {
  const fillMissingSections = options.fillMissingSections ?? true;
  const fillMissingBusinessTypes = options.fillMissingBusinessTypes ?? true;
  const merged = defaultLandingSections.map((fallback) => {
    const section = sections.find((item) => item.section_key === fallback.section_key);
    if (section) return { ...fallback, ...section, metadata: { ...fallback.metadata, ...(section.metadata || {}) } };
    return fillMissingSections ? fallback : { ...fallback, is_visible: false };
  }).sort((a, b) => a.sort_order - b.sort_order);

  const sectionMap = merged.reduce((map, section) => {
    map[section.section_key] = section;
    return map;
  }, {} as Record<LandingSectionKey, LandingSection>);

  return {
    sections: merged,
    sectionMap,
    businessTypes: businessTypes.length ? businessTypes.sort((a, b) => a.sort_order - b.sort_order) : fillMissingBusinessTypes ? defaultLandingBusinessTypes : [],
    seo: { ...defaultLandingSeo, ...seo }
  };
}

function isMissingLandingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "42P01" || code === "42703" || code === "PGRST204" || message.includes("landing_");
}

export async function getPublicLandingContent() {
  noStore();
  const supabase = await createSupabaseServerClient();
  const [sectionsResult, businessTypesResult, seoResult] = await Promise.all([
    supabase.from("landing_sections").select("*").eq("status", "published").order("sort_order", { ascending: true }),
    supabase.from("landing_business_types").select("*").eq("status", "published").eq("is_visible", true).order("sort_order", { ascending: true }),
    supabase.from("landing_seo_settings").select("*").eq("status", "published").maybeSingle()
  ]);

  if (sectionsResult.error && isMissingLandingTableError(sectionsResult.error)) {
    return buildLandingContent();
  }

  return buildLandingContent(
    ((sectionsResult.data || []) as LandingSection[]).filter((section) => section.is_visible),
    (businessTypesResult.data || []) as LandingBusinessType[],
    (seoResult.data as LandingSeoSettings | null) || defaultLandingSeo,
    { fillMissingSections: false, fillMissingBusinessTypes: false }
  );
}

export async function getAdminLandingContent() {
  noStore();
  const supabase = createSupabaseAdminClient();
  const [draftSections, publishedSections, draftBusinessTypes, publishedBusinessTypes, draftSeo, publishedSeo] = await Promise.all([
    supabase.from("landing_sections").select("*").eq("status", "draft").order("sort_order", { ascending: true }),
    supabase.from("landing_sections").select("*").eq("status", "published").order("sort_order", { ascending: true }),
    supabase.from("landing_business_types").select("*").eq("status", "draft").order("sort_order", { ascending: true }),
    supabase.from("landing_business_types").select("*").eq("status", "published").order("sort_order", { ascending: true }),
    supabase.from("landing_seo_settings").select("*").eq("status", "draft").maybeSingle(),
    supabase.from("landing_seo_settings").select("*").eq("status", "published").maybeSingle()
  ]);

  if (draftSections.error && isMissingLandingTableError(draftSections.error)) {
    return {
      content: buildLandingContent(defaultLandingSections.map((section) => ({ ...section, status: "draft" })), defaultLandingBusinessTypes.map((item) => ({ ...item, status: "draft" })), { ...defaultLandingSeo, status: "draft" }),
      published: buildLandingContent(),
      missingLandingTables: true,
      hasUnpublishedChanges: false
    };
  }

  const content = buildLandingContent(
    ((draftSections.data || []) as LandingSection[]).length ? (draftSections.data as LandingSection[]) : defaultLandingSections.map((section) => ({ ...section, status: "draft" as const })),
    ((draftBusinessTypes.data || []) as LandingBusinessType[]).length ? (draftBusinessTypes.data as LandingBusinessType[]) : defaultLandingBusinessTypes.map((item) => ({ ...item, status: "draft" as const })),
    (draftSeo.data as LandingSeoSettings | null) || { ...defaultLandingSeo, status: "draft" }
  );

  const published = buildLandingContent(
    ((publishedSections.data || []) as LandingSection[]).length ? (publishedSections.data as LandingSection[]) : defaultLandingSections,
    ((publishedBusinessTypes.data || []) as LandingBusinessType[]).length ? (publishedBusinessTypes.data as LandingBusinessType[]) : defaultLandingBusinessTypes,
    (publishedSeo.data as LandingSeoSettings | null) || defaultLandingSeo
  );
  const hasUnpublishedChanges = JSON.stringify(normalizeComparableLanding(content)) !== JSON.stringify(normalizeComparableLanding(published));

  return {
    content,
    published,
    missingLandingTables: false,
    hasUnpublishedChanges
  };
}

function normalizeComparableLanding(content: LandingContent) {
  return {
    sections: content.sections.map((section) => ({
      section_key: section.section_key,
      title: section.title,
      subtitle: section.subtitle,
      description: section.description,
      primary_cta_label: section.primary_cta_label,
      primary_cta_url: section.primary_cta_url,
      secondary_cta_label: section.secondary_cta_label,
      secondary_cta_url: section.secondary_cta_url,
      image_light_url: section.image_light_url,
      image_dark_url: section.image_dark_url,
      alt_text: section.alt_text,
      sort_order: section.sort_order,
      is_visible: section.is_visible,
      metadata: section.metadata
    })),
    businessTypes: content.businessTypes.map((item) => ({
      name: item.name,
      description: item.description,
      image_light_url: item.image_light_url,
      image_dark_url: item.image_dark_url,
      alt_text: item.alt_text,
      sort_order: item.sort_order,
      is_visible: item.is_visible
    })),
    seo: {
      meta_title: content.seo.meta_title,
      meta_description: content.seo.meta_description,
      og_title: content.seo.og_title,
      og_description: content.seo.og_description,
      og_image_url: content.seo.og_image_url,
      canonical_url: content.seo.canonical_url,
      keywords: content.seo.keywords
    }
  };
}
