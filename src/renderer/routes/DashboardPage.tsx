import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ListChecks, MessageSquareWarning, Send } from "lucide-react";
import { apiClient } from "../lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, ScoreBadge } from "../components/ui";

async function fetchStats() {
  const [offers, apply, maybe, skip, queue, sent] = await Promise.all([
    apiClient.offers.list({ page: 1, pageSize: 1 }),
    apiClient.offers.list({ page: 1, pageSize: 1, decision: "apply" }),
    apiClient.offers.list({ page: 1, pageSize: 1, decision: "maybe" }),
    apiClient.offers.list({ page: 1, pageSize: 1, decision: "skip" }),
    apiClient.queue.list({ page: 1, pageSize: 1, status: "pending" }),
    apiClient.queue.list({ page: 1, pageSize: 1, status: "sent" })
  ]);

  return {
    offers: offers.total,
    queued: queue.total,
    sent: sent.total,
    apply: apply.total,
    maybe: maybe.total,
    skip: skip.total
  };
}

export function DashboardPage() {
  const { data } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });

  const cards = [
    { label: "Offers", value: data?.offers ?? 0, icon: ArrowUpRight },
    { label: "Queued", value: data?.queued ?? 0, icon: ListChecks },
    { label: "Sent", value: data?.sent ?? 0, icon: Send },
    { label: "Maybe", value: data?.maybe ?? 0, icon: MessageSquareWarning }
  ];

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">Phase 1 local-only job assistant overview.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-gray-900">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision Split</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <ScoreBadge score={data ? Math.round((data.apply / Math.max(1, data.offers)) * 100) : 0} />
          <span className="text-xs text-gray-500">Apply: {data?.apply ?? 0}</span>
          <span className="text-xs text-gray-500">Maybe: {data?.maybe ?? 0}</span>
          <span className="text-xs text-gray-500">Skip: {data?.skip ?? 0}</span>
        </CardContent>
      </Card>

      {!data && (
        <Card>
          <EmptyState
            title="Loading dashboard"
            description="Fetching local SQLite counts"
          />
        </Card>
      )}
    </div>
  );
}
