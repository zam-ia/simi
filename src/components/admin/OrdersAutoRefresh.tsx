"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type OrdersAutoRefreshProps = {
  clientId?: string;
};

export function OrdersAutoRefresh({ clientId }: OrdersAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 7000);

    let cleanupRealtime = () => {};

    try {
      const supabase = createSupabaseBrowserClient();
      const orderFilter = clientId ? `client_id=eq.${clientId}` : undefined;
      const channel = supabase
        .channel(`admin-orders-${clientId || "all"}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: orderFilter }, () => router.refresh())
        .on("postgres_changes", { event: "*", schema: "public", table: "order_status_events" }, () => router.refresh())
        .subscribe();

      cleanupRealtime = () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.warn("Realtime no disponible. Se mantiene refresco automatico.", error);
    }

    return () => {
      window.clearInterval(interval);
      cleanupRealtime();
    };
  }, [clientId, router]);

  return null;
}
