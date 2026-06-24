import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ListOrdered, RefreshCw, Send, SkipForward } from "lucide-react";
import { cn } from "../lib/cn";
import { apiClient } from "../lib/apiClient";
import {
  Button,
  Card,
  EmptyState,
  Pagination,
  ScoreBadge,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui";

export function ApplyQueuePage() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["queue", page],
    queryFn: () => apiClient.queue.list({ page, pageSize: 25 })
  });

  const build = useMutation({
    mutationFn: () => apiClient.queue.build(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["queue"] })
  });

  const markSent = useMutation({
    mutationFn: (id: string) => apiClient.queue.markSent(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["queue"] })
  });

  const skip = useMutation({
    mutationFn: (id: string) => apiClient.queue.skip(id, "Manual skip"),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["queue"] })
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text)]">Apply Queue</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => build.mutate()}
          disabled={build.isPending}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", build.isPending && "animate-spin")} />
          {build.isPending ? "Building\u2026" : "Build Queue"}
        </Button>
      </div>

      {build.data && (
        <p className="text-xs text-[var(--text-secondary)]">
          Added {build.data.inserted} item{build.data.inserted !== 1 ? "s" : ""} to queue.
        </p>
      )}

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">Loading\u2026</div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={<ListOrdered className="h-8 w-8" />}
            title="Queue is empty"
            description='Build the queue from scored "apply" and "maybe" offers'
            action={
              <Button size="sm" onClick={() => build.mutate()} disabled={build.isPending}>
                Build Queue
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Offer ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Reasons</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-[var(--text-muted)]">
                      {item.offerId.slice(0, 8)}\u2026
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <ScoreBadge score={item.priorityScore} />
                    </TableCell>
                    <TableCell className="text-xs text-[var(--text-secondary)]">
                      <span className="line-clamp-1">
                        {item.reasons.slice(0, 2).join(" \u00b7 ") || "\u2013"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.status === "pending" && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markSent.mutate(item.id)}
                            disabled={markSent.isPending}
                            className="text-[var(--primary)] hover:text-[#8db7ff]"
                            aria-label="Mark sent"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => skip.mutate(item.id)}
                            disabled={skip.isPending}
                            className="text-[var(--text-muted)] hover:text-[var(--accent)]"
                            aria-label="Skip"
                          >
                            <SkipForward className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t border-[var(--border)] px-3 py-2">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
