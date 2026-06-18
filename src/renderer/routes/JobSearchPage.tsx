import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { apiClient } from "../lib/apiClient";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  StatusBadge
} from "../components/ui";

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
    <div className="space-y-4 p-6">
      <h2 className="text-base font-semibold text-gray-900">Job Search</h2>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Classify URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Source</label>
              <Select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="mt-1"
              >
                <option value="pracuj">pracuj.pl</option>
                <option value="justjoin">justjoin.it</option>
                <option value="rocketjobs">rocketjobs.pl</option>
                <option value="nofluffjobs">nofluffjobs.com</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Preview text</label>
              <textarea
                value={preview}
                onChange={(e) => setPreview(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => classify.mutate()}
                disabled={!url || classify.isPending}
              >
                <Search className="h-3.5 w-3.5" />
                {classify.isPending ? "Classifying…" : "Classify"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => save.mutate()}
                disabled={!url || save.isPending}
              >
                {save.isPending ? "Saving…" : "Save URL"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {classify.data && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Classification">
                <StatusBadge status={classify.data.classification} />
              </Row>
              <Row label="Relevance">
                <StatusBadge status={classify.data.relevanceDecision} />
              </Row>
              <Row label="Score">
                <span className="text-sm font-medium tabular-nums">
                  {classify.data.relevanceScore}
                </span>
              </Row>
              {classify.data.matchedKeywords.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-gray-500">Matched</p>
                  <div className="flex flex-wrap gap-1">
                    {classify.data.matchedKeywords.map((k) => (
                      <Badge key={k} variant="success">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {classify.data.negativeKeywords.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-gray-500">Negative</p>
                  <div className="flex flex-wrap gap-1">
                    {classify.data.negativeKeywords.map((k) => (
                      <Badge key={k} variant="destructive">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs italic text-gray-400">{classify.data.reason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      {children}
    </div>
  );
}
