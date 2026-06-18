import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export function RapidApplyPage() {
  const next = useQuery({
    queryKey: ["queue-next"],
    queryFn: () => apiClient.queue.getNext()
  });

  const fill = useMutation({
    mutationFn: (id: string) => apiClient.rapidApply.fillItem(id)
  });

  return (
    <section className="card">
      <h2>Rapid Apply Skeleton</h2>
      <p>Final submit remains manual. This endpoint is intentionally non-submitting.</p>
      {next.data ? (
        <div>
          <div>Queue item: {next.data.id}</div>
          <div>Offer: {next.data.offerId}</div>
          <button onClick={() => fill.mutate(next.data!.id)} disabled={fill.isPending}>
            Fill Item (Safe Skeleton)
          </button>
          {fill.data && <pre>{JSON.stringify(fill.data, null, 2)}</pre>}
        </div>
      ) : (
        <div>No pending queue item</div>
      )}
    </section>
  );
}
