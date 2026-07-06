import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { apiClient } from "../lib/apiClient";
import type { SearchRun } from "../../main/shared/types";
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
  const [source, setSource] = useState<"pracuj" | "justjoinit" | "rocketjobs" | "nofluffjobs">("pracuj");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState("React frontend TypeScript");
  const [phrase, setPhrase] = useState("react frontend");
  const [location, setLocation] = useState("Warszawa");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [pageLimit, setPageLimit] = useState(3);
  const [resultLimit, setResultLimit] = useState(40);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [collectorError, setCollectorError] = useState<string | null>(null);

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

  const startCollector = useMutation({
    mutationFn: async () => {
      setCollectorError(null);
      return apiClient.collector.start({
        source,
        phrase,
        location: location.trim() || undefined,
        remoteOnly,
        pageLimit,
        resultLimit
      });
    },
    onSuccess: (result) => {
      setActiveRunId(result.runId);
    },
    onError: (error) => {
      setCollectorError(error instanceof Error ? error.message : "Failed to start collector");
    }
  });

  const cancelCollector = useMutation({
    mutationFn: async () => {
      if (!activeRunId) {
        return { ok: false };
      }
      return apiClient.collector.cancel(activeRunId);
    }
  });

  const runStatus = useQuery<SearchRun | null>({
    queryKey: ["collector-status", activeRunId],
    queryFn: async () => {
      if (!activeRunId) {
        return null;
      }
      return apiClient.collector.getStatus(activeRunId);
    },
    enabled: Boolean(activeRunId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "running" ? 1500 : false;
    }
  });

  const runProgress = useQuery({
    queryKey: ["collector-progress", activeRunId],
    queryFn: async () => {
      if (!activeRunId) {
        return null;
      }
      return apiClient.collector.getProgress(activeRunId);
    },
    enabled: Boolean(activeRunId),
    refetchInterval: (query) => {
      const status = runStatus.data?.status;
      if (!status || status === "running") {
        return 1000;
      }
      return query.state.data ? false : 1000;
    }
  });

  const recentRuns = useQuery({
    queryKey: ["collector-runs"],
    queryFn: () => apiClient.collector.listRuns(),
    refetchInterval: 3000
  });

  const isCollectorRunning = runStatus.data?.status === "running";
  const runStatusError = runStatus.error instanceof Error ? runStatus.error.message : null;
  const recentRunsError = recentRuns.error instanceof Error ? recentRuns.error.message : null;

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-base font-semibold text-[var(--text)]">Job Search</h2>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Collector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Portal</label>
              <Select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className="mt-1">
                <option value="pracuj">pracuj.pl</option>
                <option value="justjoinit">justjoin.it</option>
                <option value="rocketjobs">rocketjobs.pl</option>
                <option value="nofluffjobs">nofluffjobs.com</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Phrase</label>
              <Input value={phrase} onChange={(e) => setPhrase(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Location</label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" placeholder="Warszawa" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Page limit</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={pageLimit}
                  onChange={(e) => setPageLimit(Number(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">Result limit</label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={resultLimit}
                  onChange={(e) => setResultLimit(Number(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="h-4 w-4 rounded border border-[var(--border)] bg-[var(--bg-surface)]"
              />
              Remote only
            </label>

            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={startCollector.isPending || isCollectorRunning || phrase.trim().length < 2}
                onClick={() => startCollector.mutate()}
              >
                {startCollector.isPending ? "Starting..." : "Start collecting"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!activeRunId || !isCollectorRunning || cancelCollector.isPending}
                onClick={() => cancelCollector.mutate()}
              >
                {cancelCollector.isPending ? "Cancelling..." : "Cancel"}
              </Button>
            </div>

            {collectorError && (
              <p className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-2 text-xs text-[var(--danger)]">
                Start failed: {collectorError}
              </p>
            )}

            {runStatusError && (
              <p className="rounded-md border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-2 text-xs text-[var(--warning)]">
                Status error: {runStatusError}
              </p>
            )}

            {activeRunId && (
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] p-2 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center justify-between">
                  <span>Run</span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">{activeRunId.slice(0, 8)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Status</span>
                  <StatusBadge status={runStatus.data?.status ?? "running"} />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Found</span>
                  <span className="tabular-nums">{runProgress.data?.offersFound ?? runStatus.data?.collectedCount ?? 0}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Saved</span>
                  <span className="tabular-nums">{runProgress.data?.offersSaved ?? runStatus.data?.savedCount ?? 0}</span>
                </div>
                <p className="mt-2 text-[11px] italic text-[var(--text-muted)]">
                  {runProgress.data?.message ?? runStatus.data?.message ?? "Waiting for progress..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classify URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Source</label>
              <Select
                value={source}
                onChange={(e) => setSource(e.target.value as typeof source)}
                className="mt-1"
              >
                <option value="pracuj">pracuj.pl</option>
                <option value="justjoinit">justjoin.it</option>
                <option value="rocketjobs">rocketjobs.pl</option>
                <option value="nofluffjobs">nofluffjobs.com</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Preview text</label>
              <textarea
                value={preview}
                onChange={(e) => setPreview(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
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
                <span className="text-sm font-medium tabular-nums text-[var(--text)]">
                  {classify.data.relevanceScore}
                </span>
              </Row>
              {classify.data.matchedKeywords.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-[var(--text-muted)]">Matched</p>
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
                  <p className="mb-1 text-xs text-[var(--text-muted)]">Negative</p>
                  <div className="flex flex-wrap gap-1">
                    {classify.data.negativeKeywords.map((k) => (
                      <Badge key={k} variant="destructive">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs italic text-[var(--text-muted)]">{classify.data.reason}</p>
            </CardContent>
          </Card>
        )}

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Recent collection runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {(recentRuns.data ?? []).slice(0, 9).map((run) => (
                <div key={run.id} className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wide text-[var(--text-muted)]">{run.source}</span>
                    <StatusBadge status={run.status} />
                  </div>
                  <p className="mt-2 text-[var(--text-secondary)]">Found: {run.collectedCount}</p>
                  <p className="text-[var(--text-secondary)]">Saved: {run.savedCount}</p>
                  <p className="text-[var(--text-secondary)]">Skipped: {run.skippedCount}</p>
                  {run.errorSummary && <p className="mt-1 text-[var(--warning)]">{run.errorSummary}</p>}
                </div>
              ))}
              {(recentRuns.data ?? []).length === 0 && (
                <div className="text-xs text-[var(--text-muted)]">No collection runs yet.</div>
              )}
              {recentRunsError && (
                <div className="text-xs text-[var(--warning)]">Unable to load runs: {recentRunsError}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      {children}
    </div>
  );
}
