import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function ApplyQueuePage() {
  const qc = useQueryClient();
  const queue = useQuery({
    queryKey: ["queue"],
    queryFn: () => apiClient.queue.list({ page: 1, pageSize: 25 })
  });

  const build = useMutation({
    mutationFn: () => apiClient.queue.build(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["queue"] });
    }
  });

  const markSent = useMutation({
    mutationFn: (id: string) => apiClient.queue.markSent(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["queue"] });
    }
  });

  return (
    <section className="card">
      <h2>Apply Queue Skeleton</h2>
      <button onClick={() => build.mutate()} disabled={build.isPending}>
        Build Queue From Offers
      </button>
      <div>
        {queue.data?.items.map((item) => (
          <div key={item.id} style={{ borderBottom: "1px solid #e5e7eb", marginTop: 8, paddingBottom: 8 }}>
            <div>Offer: {item.offerId}</div>
            <div>Status: {item.status}</div>
            <div>Priority: {item.priorityScore}</div>
            {item.status === "pending" && <button onClick={() => markSent.mutate(item.id)}>Mark Sent</button>}
          </div>
        ))}
      </div>
    </section>
  );
}
