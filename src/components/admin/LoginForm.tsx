"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginFormProps = {
  initialMessage?: string;
};

export function LoginForm({ initialMessage = "" }: LoginFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setMessage("");
      try {
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");

        if (!email || !password) {
          setMessage("Ingresa tu correo y contrasena.");
          return;
        }

        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setMessage("Correo o contrasena incorrectos.");
          return;
        }

        setMessage("Sesion iniciada correctamente.");
        router.push("/admin");
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage("No se pudo iniciar sesion. Revisa la configuracion de Supabase.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-5 rounded-[32px] border border-[var(--login-line)] bg-[var(--login-panel)] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:p-8">
      <div className="text-center">
        <img src="/simi/brand_app_icons/simi-app-icon.png" alt="SIMI" className="mx-auto h-14 w-14 rounded-[18px] shadow-[0_16px_42px_rgba(15,23,42,0.18)]" />
        <span className="mt-4 inline-flex rounded-full border border-[color-mix(in_srgb,var(--login-gold)_42%,transparent)] bg-[color-mix(in_srgb,var(--login-gold)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--login-gold)]">
          Cliente activo
        </span>
        <h2 className="mt-4 text-3xl font-medium text-[var(--login-text)]">Ingresar al panel</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--login-muted)]">Ingresa con el correo autorizado de tu negocio.</p>
      </div>

      <Input label="Correo" name="email" type="email" autoComplete="email" required />
      <Input label="Contrasena" name="password" type="password" autoComplete="current-password" required />
      {message ? <p className="rounded-[var(--radius-card)] border border-[var(--login-line)] bg-[color-mix(in_srgb,var(--login-blue)_8%,var(--login-panel-solid))] p-3 text-sm text-[var(--login-text)]">{message}</p> : null}
      <Button type="submit" disabled={isPending} className="min-h-12 w-full bg-[linear-gradient(135deg,var(--login-blue),color-mix(in_srgb,var(--login-blue)_72%,var(--login-gold)))] shadow-[0_16px_42px_color-mix(in_srgb,var(--login-blue)_26%,transparent)] hover:opacity-95">
        {isPending ? "Ingresando..." : "Ingresar a mi panel"}
      </Button>
      <div className="grid gap-3 text-center text-sm text-[var(--login-muted)]">
        <button type="button" className="justify-self-center font-medium text-[var(--login-blue)]">Olvide mi contrasena</button>
        <p className="text-xs leading-5">Solo clientes activos y usuarios autorizados pueden acceder.</p>
        <Link href="/#demo" className="font-medium text-[var(--login-blue)]">Aun no tienes SIMI? Solicita una demo</Link>
      </div>
    </form>
  );
}
