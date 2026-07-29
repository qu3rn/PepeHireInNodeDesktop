import { Badge, type BadgeProps } from "./Badge";

type KnownStatus =
  | "pending"
  | "sent"
  | "skipped"
  | "apply"
  | "maybe"
  | "skip"
  | "job_offer"
  | "listing"
  | "unknown"
  | "match"
  | "low_relevance"
  | "excluded";

const STATUS_MAP: Record<
  KnownStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  pending: { label: "Pending", variant: "default" },
  sent: { label: "Sent", variant: "success" },
  skipped: { label: "Skipped", variant: "secondary" },
  apply: { label: "Apply", variant: "success" },
  maybe: { label: "Maybe", variant: "warning" },
  skip: { label: "Skip", variant: "destructive" },
  job_offer: { label: "Job Offer", variant: "success" },
  listing: { label: "Listing", variant: "secondary" },
  unknown: { label: "Unknown", variant: "outline" },
  match: { label: "Match", variant: "success" },
  low_relevance: { label: "Low relevance", variant: "warning" },
  excluded: { label: "Excluded", variant: "destructive" }
};

export function StatusBadge({
  status,
  className
}: {
  status: string;
  className?: string;
}) {
  const cfg = STATUS_MAP[status as KnownStatus] ?? {
    label: status,
    variant: "secondary" as const
  };
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}
