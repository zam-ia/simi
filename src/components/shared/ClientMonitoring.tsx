"use client";

import { useEffect, useRef } from "react";

type Breadcrumb = {
  type: string;
  label: string;
  at: string;
};

function sendClientError(payload: { message: string; stack?: string; level?: "warning" | "error" | "critical"; metadata?: Record<string, unknown>; breadcrumbs?: Breadcrumb[] }) {
  const body = JSON.stringify({
    ...payload,
    route: window.location.pathname,
    metadata: {
      ...payload.metadata,
      href: window.location.href
    }
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/monitoring/client-error", blob);
    return;
  }

  fetch("/api/monitoring/client-error", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true
  }).catch(() => {
    // El monitoreo no debe bloquear la experiencia del usuario.
  });
}

export function ClientMonitoring() {
  const breadcrumbsRef = useRef<Breadcrumb[]>([]);

  useEffect(() => {
    function pushBreadcrumb(type: string, label: string) {
      breadcrumbsRef.current = [
        { type, label: label.slice(0, 140), at: new Date().toISOString() },
        ...breadcrumbsRef.current
      ].slice(0, 20);
    }

    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("button,a,input,select,textarea") : null;
      if (!target) return;
      const label = target.getAttribute("aria-label") || target.textContent || target.getAttribute("href") || target.tagName;
      pushBreadcrumb("ui.click", label || target.tagName);
    }

    function handleError(event: ErrorEvent) {
      sendClientError({
        message: event.message || "Error de cliente",
        stack: event.error?.stack,
        level: "error",
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        breadcrumbs: breadcrumbsRef.current
      });
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      sendClientError({
        message: reason instanceof Error ? reason.message : String(reason || "Promesa rechazada sin mensaje"),
        stack: reason instanceof Error ? reason.stack : undefined,
        level: "error",
        metadata: { type: "unhandledrejection" },
        breadcrumbs: breadcrumbsRef.current
      });
    }

    window.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
