export default function LoadingMenu() {
  return (
    <main className="mx-auto grid min-h-screen max-w-2xl gap-4 px-5 py-8">
      <div className="h-28 animate-pulse rounded-[var(--radius-panel)] bg-[var(--surface-muted)]" />
      <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-muted)]" />
      <div className="h-24 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-muted)]" />
    </main>
  );
}
