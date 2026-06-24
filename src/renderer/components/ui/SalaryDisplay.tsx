import { cn } from "../../lib/cn";

export interface SalaryDisplayProps {
  raw?: string | null;
  monthlyMin?: number | null;
  monthlyMax?: number | null;
  currency?: string | null;
  className?: string;
}

export function SalaryDisplay({
  raw,
  monthlyMin,
  monthlyMax,
  currency,
  className
}: SalaryDisplayProps) {
  const curr = currency ?? "PLN";

  if (!raw && !monthlyMin) {
    return <span className={cn("text-xs text-[var(--text-muted)] italic", className)}>Not specified</span>;
  }

  const monthly =
    monthlyMin && monthlyMax && monthlyMin !== monthlyMax
      ? `${monthlyMin.toLocaleString("pl-PL")} – ${monthlyMax.toLocaleString("pl-PL")} ${curr}/mo`
      : monthlyMin
        ? `${monthlyMin.toLocaleString("pl-PL")} ${curr}/mo`
        : null;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {monthly ? (
        <span className="text-sm font-medium text-[var(--text)]">{monthly}</span>
      ) : null}
      {raw && (
        <span className={cn("text-xs text-[var(--text-muted)]", monthly ? "" : "text-sm font-medium text-[var(--text)]")}>
          {raw}
        </span>
      )}
    </div>
  );
}
