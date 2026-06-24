import { cn } from "../../lib/cn";

export function ScoreBadge({
  score,
  className
}: {
  score: number | null | undefined;
  className?: string;
}) {
  if (score == null) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-[var(--bg-surface-2)] text-[var(--text-muted)]",
          className
        )}
      >
        n/a
      </span>
    );
  }

  const color =
    score >= 70
      ? "bg-[color:rgba(47,124,255,0.2)] text-[#a5c5ff]"
      : score >= 40
        ? "bg-[var(--accent-soft)] text-[var(--accent-contrast)]"
        : "bg-[color:rgba(240,138,42,0.18)] text-[var(--accent)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium tabular-nums",
        color,
        className
      )}
    >
      {score}
    </span>
  );
}
