import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DemoRequest } from "@/types/menu";

function isMissingCommercialTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "42P01" || code === "42703" || code === "PGRST204" || message.includes("demo_requests");
}

export async function getAdminDemoRequests() {
  noStore();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("demo_requests").select("*").order("created_at", { ascending: false });

  return {
    requests: error && isMissingCommercialTable(error) ? [] : (data || []) as DemoRequest[],
    missingCommercialTables: Boolean(error && isMissingCommercialTable(error))
  };
}
