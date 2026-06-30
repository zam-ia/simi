import { LinkButton } from "@/components/shared/Button";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div className="max-w-md">
        <p className="text-sm text-[var(--text-muted)]">404</p>
        <h1 className="mt-2 text-3xl font-medium">Este menú no está disponible.</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">El enlace puede estar desactivado o no existir.</p>
        <div className="mt-6">
          <LinkButton href="/login" variant="secondary">
            Ir al login
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
