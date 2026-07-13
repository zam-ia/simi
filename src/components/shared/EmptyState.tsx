import { LinkButton } from "@/components/shared/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-5 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">{description}</p>
      {actionLabel && actionHref ? (
        <div className="mt-4">
          <LinkButton href={actionHref}>{actionLabel}</LinkButton>
        </div>
      ) : null}
    </div>
  );
}
