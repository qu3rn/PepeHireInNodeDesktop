import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, SkipForward, Zap } from "lucide-react";
import { apiClient } from "../lib/apiClient";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  ScoreBadge,
  StatusBadge
} from "../components/ui";

export function RapidApplyPage() {
  const qc = useQueryClient();

  const { data: next, isLoading } = useQuery({
    queryKey: ["queue-next"],
    queryFn: () => apiClient.queue.getNext()
  });

  const fill = useMutation({
    mutationFn: (id: string) => apiClient.rapidApply.fillItem(id)
  });

  const markSent = useMutation({
    mutationFn: (id: string) => apiClient.queue.markSent(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["queue-next"] });
      void qc.invalidateQueries({ queryKey: ["queue"] });
    }
  });

  const skip = useMutation({
    mutationFn: (id: string) => apiClient.queue.skip(id, "Skipped from Rapid Apply"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["queue-next"] });
      void qc.invalidateQueries({ queryKey: ["queue"] });
    }
  });

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-base font-semibold text-[var(--text)]">Rapid Apply</h2>

      <div className="flex items-start gap-2 rounded-lg border border-[color:rgba(240,138,42,0.35)] bg-[var(--accent-soft)] px-4 py-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
        <p className="text-xs text-[var(--accent-contrast)]">
          <strong>Safety rule:</strong> Final job application submit must remain manual. This
          tool fills forms only &#8212; it never clicks Submit or Apply.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-[var(--text-muted)]">Loading&#8230;</div>
      ) : !next ? (
        <Card>
          <EmptyState
            icon={<Zap className="h-8 w-8" />}
            title="Queue is empty"
            description="Build the queue from Apply Queue page first"
          />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Next in Queue</CardTitle>
            <div className="flex items-center gap-2">
              <StatusBadge status={next.status} />
              <ScoreBadge score={next.priorityScore} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Queue Item</p>
                <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">{next.id.slice(0, 12)}\u2026</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Offer</p>
                <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">{next.offerId.slice(0, 12)}\u2026</p>
              </div>
            </div>
            {next.reasons.length > 0 && (
              <div>
                <p className="text-xs text-[var(--text-muted)]">Scoring reasons</p>
                <ul className="mt-1 space-y-0.5">
                  {next.reasons.map((r, i) => (
                    <li key={i} className="text-xs text-[var(--text-secondary)]">\u00b7 {r}</li>
                  ))}
                </ul>
              </div>
            )}
            {fill.data && (
              <div className="rounded border border-[color:rgba(47,124,255,0.35)] bg-[color:rgba(47,124,255,0.14)] px-3 py-2 text-xs text-[#a5c5ff]">
                {fill.data.warning}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              size="sm"
              onClick={() => fill.mutate(next.id)}
              disabled={fill.isPending}
            >
              <Zap className="h-3.5 w-3.5" />
              {fill.isPending ? "Filling\u2026" : "Fill Form"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markSent.mutate(next.id)}
              disabled={markSent.isPending}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Mark Sent &amp; Next
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skip.mutate(next.id)}
              disabled={skip.isPending}
              className="ml-auto text-[var(--text-muted)] hover:text-[var(--accent)]"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
