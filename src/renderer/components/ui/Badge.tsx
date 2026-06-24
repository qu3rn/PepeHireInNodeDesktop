import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-[color:rgba(47,124,255,0.2)] text-[#9ec0ff]",
        secondary: "bg-[var(--bg-surface-2)] text-[var(--text-secondary)]",
        success: "bg-[color:rgba(47,124,255,0.2)] text-[#a5c5ff]",
        warning: "bg-[var(--accent-soft)] text-[var(--accent-contrast)]",
        destructive: "bg-[var(--accent)] text-[#1a1208]",
        outline: "border border-[var(--border-strong)] text-[var(--text-secondary)]"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
