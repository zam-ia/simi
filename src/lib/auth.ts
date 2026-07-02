import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moduleFromPath, normalizeBusinessRole, resolveModulePermissions, type AdminModule, type BusinessRole, type ModulePermissions } from "@/lib/permissions";
import type { Client, ClientUser } from "@/types/menu";
import type { User } from "@supabase/supabase-js";

export type AdminRole = "super_admin" | "business_admin";

export type AdminContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
  role: AdminRole;
  businessRole: BusinessRole | null;
  modulePermissions: ModulePermissions;
  membership: ClientUser | null;
  client: Client | null;
};

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

function isMissingAccessTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "42P01" || code === "42703" || code === "PGRST204" || message.includes("client_users") || message.includes("admin_email");
}

function parseModulePermissions(value: unknown): ModulePermissions {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as ModulePermissions;
}

export function isSuperAdminEmail(email?: string | null) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(adminEmail && normalizeEmail(email) === adminEmail);
}

async function getFallbackBusinessClient(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, email: string) {
  const businessEmail = process.env.BUSINESS_ADMIN_EMAIL?.trim().toLowerCase();
  const businessSlug = process.env.BUSINESS_ADMIN_CLIENT_SLUG?.trim();

  if (!businessEmail || !businessSlug || email !== businessEmail) return null;

  const { data } = await supabase.from("clients").select("*").eq("slug", businessSlug).maybeSingle();
  return (data || null) as Client | null;
}

async function getClientByLegacyAdminEmail(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, email: string) {
  const { data, error } = await supabase.from("clients").select("*").eq("admin_email", email).maybeSingle();
  if (error && !isMissingAccessTable(error)) {
    console.error("No se pudo validar admin_email del negocio", error);
  }

  return (data || null) as Client | null;
}

async function getBusinessMembership(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, user: User) {
  const email = normalizeEmail(user.email);

  let { data: membership, error } = await supabase.from("client_users").select("*").eq("user_id", user.id).eq("is_active", true).maybeSingle();

  if ((!membership && !error) || (error && !isMissingAccessTable(error))) {
    const byEmail = await supabase.from("client_users").select("*").eq("email", email).eq("is_active", true).maybeSingle();
    membership = byEmail.data;
    error = byEmail.error;
  }

  if (error) {
    if (!isMissingAccessTable(error)) console.error("No se pudo validar client_users", error);
    return null;
  }

  if (!membership) return null;

  const { data: client } = await supabase.from("clients").select("*").eq("id", membership.client_id).maybeSingle();
  if (!client) return null;

  const businessRole = normalizeBusinessRole(membership.role);
  const modulePermissions = resolveModulePermissions(businessRole, parseModulePermissions(membership.module_permissions));

  return {
    client: client as Client,
    membership: {
      ...membership,
      role: businessRole,
      module_permissions: modulePermissions
    } as ClientUser,
    businessRole,
    modulePermissions
  };
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const email = normalizeEmail(user.email);

  if (isSuperAdminEmail(email)) {
    return {
      supabase,
      user,
      role: "super_admin",
      businessRole: null,
      modulePermissions: {},
      membership: null,
      client: null
    };
  }

  const membershipContext = await getBusinessMembership(supabase, user);
  if (membershipContext) {
    return {
      supabase,
      user,
      role: "business_admin",
      ...membershipContext
    };
  }

  const fallbackClient = (await getFallbackBusinessClient(supabase, email)) || (await getClientByLegacyAdminEmail(supabase, email));
  if (fallbackClient) {
    const businessRole = "business_owner";
    return {
      supabase,
      user,
      role: "business_admin",
      businessRole,
      modulePermissions: resolveModulePermissions(businessRole),
      membership: null,
      client: fallbackClient
    };
  }

  return null;
}

export async function requireAdmin() {
  const context = await getAdminContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export function requireSuperAdmin(context: AdminContext) {
  if (context.role !== "super_admin") {
    redirect("/admin");
  }

  return context;
}

export function requireClientAccess(context: AdminContext, clientId: string) {
  if (context.role === "super_admin") return;

  if (context.client?.id !== clientId) {
    redirect("/admin");
  }
}

export function hasModuleAccess(context: AdminContext, module: AdminModule) {
  if (context.role === "super_admin") return true;
  if (module === "clients") return false;
  return Boolean(context.modulePermissions[module]);
}

export function requireModuleAccess(context: AdminContext, module: AdminModule) {
  if (!hasModuleAccess(context, module)) {
    redirect("/admin?error=forbidden");
  }
}

export function requirePathAccess(context: AdminContext, pathname: string) {
  requireModuleAccess(context, moduleFromPath(pathname));
}

export async function getSessionRedirectTarget() {
  const context = await getAdminContext();
  return context ? "/admin" : "/login";
}
