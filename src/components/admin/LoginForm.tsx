"use client";

import { useState, useTransition } from "react";
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
          setMessage("Ingresa tu correo y contraseña.");
          return;
        }

        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setMessage("Correo o contraseña incorrectos.");
          return;
        }

        setMessage("Sesión iniciada correctamente.");
        router.push("/admin");
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage("No se pudo iniciar sesión. Revisa la configuración de Supabase.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-soft">
      <Input label="Correo" name="email" type="email" autoComplete="email" required />
      <Input label="Contraseña" name="password" type="password" autoComplete="current-password" required />
      {message ? <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">{message}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
