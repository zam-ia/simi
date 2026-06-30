"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AlertType = "order" | "reservation";

type VisibleAlert = {
  type: AlertType;
  title: string;
  message: string;
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

  function notify(type: AlertType) {
    const nextAlert =
      type === "order"
        ? { type, title: "Nuevo pedido", message: "Acaba de entrar un pedido. El panel se actualizo automaticamente." }
        : { type, title: "Nueva reserva", message: "Acaba de entrar una reserva. El panel se actualizo automaticamente." };

    setAlert(nextAlert);
    playNotificationSound();
    router.refresh();
    window.setTimeout(() => setAlert(null), 9000);
  }

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 30000);
    let cleanupRealtime = () => {};

    try {
      const supabase = createSupabaseBrowserClient();
      const filter = clientId ? `client_id=eq.${clientId}` : undefined;
      const channel = supabase
        .channel(`admin-global-alerts-${clientId || "all"}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter }, () => notify("order"))
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "reservations", filter }, () => notify("reservation"))
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

      {alert ? (
        <div className="fixed right-4 top-20 z-[60] max-w-sm rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${alert.type === "order" ? "bg-green-500" : "bg-[var(--accent)]"}`} />
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
