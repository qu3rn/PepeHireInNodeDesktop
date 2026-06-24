import { cn } from "../../lib/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && <div className="mb-3 text-[var(--text-muted)]">{icon}</div>}
      <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
      {description && <p className="mt-1 text-xs text-[var(--text-muted)] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
