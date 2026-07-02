"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type VisibleAlert = {
  id?: string;
  module: string;
  priority?: string;
  title: string;
  message: string;
  createdAt?: string;
};

type AdminRealtimeAlertsProps = {
  clientId?: string;
};

function getAudioContextConstructor() {
  return (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

export function AdminRealtimeAlerts({ clientId }: AdminRealtimeAlertsProps) {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [alert, setAlert] = useState<VisibleAlert | null>(null);
  const [notifications, setNotifications] = useState<VisibleAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  function enableSound() {
    try {
      const AudioContextConstructor = getAudioContextConstructor();
      if (!AudioContextConstructor) return;
      const audioContext = audioContextRef.current || new AudioContextConstructor();
      audioContextRef.current = audioContext;
      void audioContext.resume();
      setSoundEnabled(true);
    } catch (error) {
      console.warn("No se pudo activar el sonido de notificaciones.", error);
    }
  }

  function playNotificationSound() {
    if (!soundEnabled) return;

    try {
      const AudioContextConstructor = getAudioContextConstructor();
      if (!AudioContextConstructor) return;
      const audioContext = audioContextRef.current || new AudioContextConstructor();
      audioContextRef.current = audioContext;

      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1046, audioContext.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.38);
    } catch (error) {
      console.warn("No se pudo reproducir la notificacion.", error);
    }
  }

  function showAlert(nextAlert: VisibleAlert) {
    setAlert(nextAlert);
    setNotifications((current) => [nextAlert, ...current.filter((item) => item.id !== nextAlert.id)].slice(0, 6));
    playNotificationSound();
    router.refresh();
    window.setTimeout(() => setAlert(null), 9000);
  }

  function notifyFallback(module: "orders" | "reservations") {
    showAlert(
      module === "orders"
        ? { module, priority: "high", title: "Nuevo pedido", message: "Acaba de entrar un pedido. El panel se actualizo automaticamente." }
        : { module, priority: "high", title: "Nueva reserva", message: "Acaba de entrar una reserva. El panel se actualizo automaticamente." }
    );
  }

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 30000);
    let cleanupRealtime = () => {};

    try {
      const supabase = createSupabaseBrowserClient();
      const filter = clientId ? `client_id=eq.${clientId}` : undefined;
      let notificationQuery = supabase.from("notifications").select("id,module,priority,title,message,created_at").order("created_at", { ascending: false }).limit(6);
      if (clientId) notificationQuery = notificationQuery.eq("client_id", clientId);
      notificationQuery.then(({ data }) => {
        if (data) {
          setNotifications(
            data.map((notification) => ({
              id: notification.id,
              module: notification.module,
              priority: notification.priority,
              title: notification.title,
              message: notification.message || "Hay una actualizacion operativa en SIMI.",
              createdAt: notification.created_at
            }))
          );
        }
      });

      const channel = supabase
        .channel(`admin-global-alerts-${clientId || "all"}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter }, (payload) => {
          const notification = payload.new as { module?: string; priority?: string; title?: string; message?: string | null };
          showAlert({
            id: "id" in payload.new ? String(payload.new.id) : undefined,
            module: notification.module || "system",
            priority: notification.priority || "normal",
            title: notification.title || "Nueva alerta",
            message: notification.message || "Hay una actualizacion operativa en SIMI.",
            createdAt: "created_at" in payload.new ? String(payload.new.created_at) : undefined
          });
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter }, () => notifyFallback("orders"))
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "reservations", filter }, () => notifyFallback("reservations"))
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
  }, [clientId, router, soundEnabled]);

  return (
    <>
      {!soundEnabled ? (
        <div className="fixed bottom-4 right-4 z-[60] max-w-xs rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-soft">
          <p className="text-sm font-medium text-[var(--text)]">Alertas del negocio</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Activa el sonido una vez para escuchar nuevos pedidos y reservas.</p>
          <Button type="button" className="mt-3 w-full" onClick={enableSound}>
            Activar sonido
          </Button>
        </div>
      ) : null}

      <div className="fixed right-4 top-24 z-[65]">
        <button
          type="button"
          className="focus-ring relative grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] shadow-soft"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Ver alertas"
          title="Alertas"
        >
          <BellIcon className="h-5 w-5" />
          {notifications.length ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">{notifications.length}</span> : null}
        </button>
        {isOpen ? (
          <div className="mt-2 w-[min(360px,calc(100vw-32px))] rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-soft">
            <div className="flex items-center justify-between gap-3 px-1 pb-2">
              <p className="text-sm font-medium">Alertas SIMI</p>
              <span className="text-xs text-[var(--text-muted)]">Tiempo real</span>
            </div>
            <div className="grid max-h-[360px] gap-2 overflow-y-auto [scrollbar-width:thin]">
              {notifications.length ? notifications.map((notification, index) => (
                <div key={notification.id || `${notification.title}-${index}`} className="rounded-[16px] bg-[var(--surface-muted)] p-3">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.priority === "critical" ? "bg-red-500" : notification.priority === "high" ? "bg-[#FF9500]" : "bg-[var(--accent)]"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">{notification.message}</p>
                      {notification.createdAt ? <p className="mt-1 text-[11px] text-[var(--text-muted)]">{new Date(notification.createdAt).toLocaleString("es-PE")}</p> : null}
                    </div>
                  </div>
                </div>
              )) : <p className="rounded-[16px] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Aun no hay alertas recientes.</p>}
            </div>
          </div>
        ) : null}
      </div>

      {alert ? (
        <div className="fixed right-4 top-40 z-[60] max-w-sm rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${alert.priority === "critical" ? "bg-red-500" : alert.priority === "high" ? "bg-[#FF9500]" : alert.module === "orders" ? "bg-green-500" : "bg-[var(--accent)]"}`} />
            <div>
              <p className="font-medium text-[var(--text)]">{alert.title}</p>
              <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">{alert.message}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M18 9.8a6 6 0 0 0-12 0c0 6-2 6.2-2 7.7h16c0-1.5-2-1.7-2-7.7Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
