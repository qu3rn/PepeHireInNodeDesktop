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
          "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-400",
          className
        )}
      >
        n/a
      </span>
    );
  }

  const color =
    score >= 70
      ? "bg-green-100 text-green-700"
      : score >= 40
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

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
