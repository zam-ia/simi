import { LinkButton } from "@/components/shared/Button";

export function MenuUnavailable() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-5 text-center">
      <div className="w-full max-w-[420px] rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-muted)] text-lg font-medium">!</div>
        <h1 className="mt-5 text-2xl font-medium">Menú no disponible</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Este menú no existe o se encuentra temporalmente inactivo.</p>
        <div className="mt-6">
          <LinkButton href="/" variant="secondary">
            Volver al inicio
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
