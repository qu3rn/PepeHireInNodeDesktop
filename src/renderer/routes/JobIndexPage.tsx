import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Archive,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck
} from "lucide-react";
import { apiClient } from "../lib/apiClient";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Pagination,
  SalaryDisplay,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TechStackChips
} from "../components/ui";
import type { OfferStatus } from "../../main/shared/types";

const split = (v: string) =>
  v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
export function JobIndexPage() {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [include, setInclude] = useState(""),
    [exclude, setExclude] = useState(""),
    [tags, setTags] = useState(""),
    [location, setLocation] = useState(""),
    [status, setStatus] = useState(""),
    [source, setSource] = useState("");
  const [minSalary, setMinSalary] = useState(""),
    [days, setDays] = useState("30"),
    [message, setMessage] = useState("");
  const qc = useQueryClient();
  const [phrase, setPhrase] = useState("React Frontend"),
    [portals, setPortals] = useState<
      Array<"pracuj" | "justjoinit" | "rocketjobs" | "nofluffjobs">
    >(["pracuj"]);
  const query = useQuery({
    queryKey: [
      "job-index",
      page,
      search,
      include,
      exclude,
      tags,
      location,
      status,
      source,
      minSalary
    ],
    queryFn: () =>
      apiClient.jobIndex.search({
        page,
        pageSize: 25,
        search: search || undefined,
        includeKeywords: split(include),
        excludeKeywords: split(exclude),
        requiredTags: split(tags),
        location: location || undefined,
        statuses: status ? [status as OfferStatus] : undefined,
        sources: source ? [source as never] : undefined,
        minimumSalary: minSalary ? Number(minSalary) : undefined,
        sortBy: "lastSeen",
        sortDirection: "desc"
      })
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["job-index"] });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OfferStatus }) =>
      apiClient.jobIndex.updateStatus(id, status),
    onSuccess: refresh
  });
  const reindex = useMutation({
    mutationFn: () => apiClient.jobIndex.reindex({}),
    onSuccess: (x) => {
      setMessage(
        `Reindexed ${x.recordsChecked}; updated ${x.recordsUpdated}; merged ${x.duplicatesMerged}; invalid ${x.invalidRecordsFound}; errors ${x.errors}`
      );
      refresh();
    }
  });
  const cleanup = useMutation({
    mutationFn: async () => {
      const opts = {
        markExpiredAfterDays: Number(days) || 30,
        deleteInvalidAfterDays: 90,
        preserveSavedApplied: true,
        preservePinned: true
      };
      const p = await apiClient.jobIndex.cleanupPreview(opts);
      setMessage(
        `Cleanup preview: ${p.candidates.length} candidates (${p.protected} protected). Nothing was deleted.`
      );
      return p;
    }
  });
  const recheck = useMutation({
    mutationFn: () => apiClient.jobIndex.recheck({ limit: 100 }),
    onSuccess: (x) => {
      setMessage(
        `Checked ${x.checked}: ${x.active} active, ${x.expired} expired, ${x.unknown} unknown, ${x.errors} errors`
      );
      refresh();
    }
  });
  const collect = useMutation({
    mutationFn: () =>
      apiClient.jobIndex.collect({
        sources: portals,
        phrase,
        location: location || undefined,
        requiredTags: split(tags),
        includeKeywords: split(include),
        excludeKeywords: split(exclude),
        minimumSalary: minSalary ? Number(minSalary) : undefined,
        pageLimit: 3,
        resultLimit: 100
      }),
    onSuccess: (x) =>
      setMessage(
        `Collection started for ${x.runIds.length} portal(s). Results appear as runs finish.`
      ),
    onError: (e) =>
      setMessage(e instanceof Error ? e.message : "Collection could not start")
  });
  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Job Index</h2>
          <p className="text-xs text-[var(--text-muted)]">
            One local archive across portals; repeat discoveries update the
            existing record.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => recheck.mutate()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Recheck
          </Button>
          <Button size="sm" variant="outline" onClick={() => reindex.mutate()}>
            Reindex
          </Button>
          <Button size="sm" onClick={() => cleanup.mutate()}>
            <ShieldCheck className="h-3.5 w-3.5" />
            Cleanup preview
          </Button>
        </div>
      </div>
      <Card className="p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input className="w-56" placeholder="Collector search phrase" value={phrase} onChange={(e) => setPhrase(e.target.value)} />
          {(["pracuj", "justjoinit", "rocketjobs", "nofluffjobs"] as const).map((portal) => (
            <label key={portal} className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={portals.includes(portal)} onChange={(e) => setPortals(e.target.checked ? [...portals, portal] : portals.filter((x) => x !== portal))} />
              {portal}
            </label>
          ))}
          <Button size="sm" disabled={!phrase || !portals.length || collect.isPending} onClick={() => collect.mutate()}>
            <Search className="h-3.5 w-3.5" /> Collect selected portals
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          <Input
            placeholder="Search title, company, description"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Input
            placeholder="Include (comma-separated)"
            value={include}
            onChange={(e) => setInclude(e.target.value)}
          />
          <Input
            placeholder="Exclude"
            value={exclude}
            onChange={(e) => setExclude(e.target.value)}
          />
          <Input
            placeholder="Required tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Minimum monthly salary"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
          />
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">All portals</option>
            <option value="pracuj">Pracuj</option>
            <option value="justjoinit">JustJoinIT</option>
            <option value="rocketjobs">RocketJobs</option>
            <option value="nofluffjobs">No Fluff Jobs</option>
            <option value="manual">Manual</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {[
              "new",
              "seen",
              "saved",
              "applied",
              "ignored",
              "expired",
              "invalid"
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-20"
            />
            <span className="text-xs text-[var(--text-muted)]">stale days</span>
          </div>
        </div>
      </Card>
      {message && (
        <div className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-xs">
          {message}
        </div>
      )}
      <Card>
        {!query.data?.items.length ? (
          <EmptyState
            icon={<Archive className="h-8 w-8" />}
            title="No indexed offers"
            description="Collected and manually added offers will appear here."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title / company</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Technologies</TableHead>
                  <TableHead>Relevance</TableHead>
                  <TableHead>First / last seen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((o) => (
                  <TableRow
                    key={o.id}
                    className={
                      o.status === "new"
                        ? "bg-[color:rgba(47,124,255,0.10)]"
                        : o.changedAt
                          ? "bg-[color:rgba(240,138,42,0.08)]"
                          : undefined
                    }
                  >
                    <TableCell>
                      <div className="font-medium">
                        {o.title || "(untitled)"}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {o.company || "–"}
                        {o.changedAt ? " · changed" : ""}
                      </div>
                    </TableCell>
                    <TableCell>{o.source}</TableCell>
                    <TableCell>{o.location || "–"}</TableCell>
                    <TableCell>
                      <SalaryDisplay
                        raw={o.salaryRaw}
                        monthlyMin={o.salaryMonthlyMin}
                        monthlyMax={o.salaryMonthlyMax}
                        currency={o.salaryCurrency}
                      />
                    </TableCell>
                    <TableCell>
                      <TechStackChips technologies={o.technologies} max={4} />
                    </TableCell>
                    <TableCell>{o.relevanceScore ?? o.score ?? "–"}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(o.firstSeenAt).toLocaleDateString()}
                      <br />
                      <span className="text-[var(--text-muted)]">
                        {new Date(o.lastSeenAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            "seen",
                            "saved",
                            "applied",
                            "ignored"
                          ] as OfferStatus[]
                        ).map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              statusMutation.mutate({ id: o.id, status: s })
                            }
                          >
                            {s}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(o.url, "_blank", "noopener,noreferrer")
                          }
                          aria-label="Open original"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t border-[var(--border)] p-2">
              <Pagination
                page={query.data.page}
                totalPages={query.data.totalPages}
                total={query.data.total}
                pageSize={query.data.pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
