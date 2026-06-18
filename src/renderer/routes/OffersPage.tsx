import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "../lib/apiClient";

export function OffersPage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const qc = useQueryClient();

  const offers = useQuery({
    queryKey: ["offers"],
    queryFn: () => apiClient.offers.list({ page: 1, pageSize: 25 })
  });

  const addOffer = useMutation({
    mutationFn: () =>
      apiClient.offers.create({
        source: "manual",
        url,
        title,
        technologies: ["React", "TypeScript"]
      }),
    onSuccess: () => {
      setUrl("");
      setTitle("");
      void qc.invalidateQueries({ queryKey: ["offers"] });
    }
  });

  return (
    <section className="grid">
      <article className="card">
        <h2>Add Offer</h2>
        <label>
          URL
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </label>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="React Frontend Engineer" />
        </label>
        <button onClick={() => addOffer.mutate()} disabled={!url || addOffer.isPending}>
          Save + Score
        </button>
      </article>

      <article className="card">
        <h2>Offers</h2>
        {offers.data?.items.map((offer) => (
          <div key={offer.id} style={{ borderBottom: "1px solid #e5e7eb", marginBottom: 8, paddingBottom: 8 }}>
            <strong>{offer.title ?? "(untitled)"}</strong>
            <div>{offer.url}</div>
            <div>
              Score: {offer.score ?? "n/a"} | Decision: {offer.decision ?? "n/a"}
            </div>
          </div>
        ))}
      </article>
    </section>
  );
}
