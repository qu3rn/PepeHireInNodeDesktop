import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiClient } from "../lib/apiClient";

export function JobSearchPage() {
  const [source, setSource] = useState("pracuj");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState("React frontend TypeScript");

  const classify = useMutation({
    mutationFn: () => apiClient.collection.classifyUrl({ source, url, text: preview })
  });

  const save = useMutation({
    mutationFn: async () => {
      const result = await apiClient.collection.classifyUrl({ source, url, text: preview });
      return apiClient.collection.saveCollectedUrl({
        source,
        url,
        classification: result.classification as "job_offer" | "listing" | "unknown",
        classificationReason: result.reason,
        relevanceScore: result.relevanceScore,
        relevanceDecision: result.relevanceDecision,
        matchedKeywords: result.matchedKeywords,
        negativeKeywords: result.negativeKeywords
      });
    }
  });

  return (
    <section className="card">
      <h2>Job Search Skeleton</h2>
      <p>Phase 1 supports classification/relevance for manual URL input.</p>
      <label>
        Source
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="pracuj">pracuj</option>
          <option value="justjoin">justjoin</option>
          <option value="rocketjobs">rocketjobs</option>
          <option value="nofluffjobs">nofluffjobs</option>
        </select>
      </label>
      <label>
        URL
        <input value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label>
        Preview text
        <textarea value={preview} onChange={(e) => setPreview(e.target.value)} rows={4} />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => classify.mutate()} disabled={!url || classify.isPending}>
          Classify
        </button>
        <button onClick={() => save.mutate()} disabled={!url || save.isPending}>
          Save Collected URL
        </button>
      </div>
      {classify.data && (
        <pre>{JSON.stringify(classify.data, null, 2)}</pre>
      )}
    </section>
  );
}
