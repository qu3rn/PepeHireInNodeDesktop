import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { apiClient } from "../lib/apiClient";
import {
  Button,
  Card,
  Dialog,
  EmptyState,
  Input,
  Pagination,
  SalaryDisplay,
  ScoreBadge,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TechStackChips
} from "../components/ui";
import type { Offer } from "../../main/shared/types";
import { OfferDetailsPage } from "./OfferDetailsPage";

export function OffersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["offers", page, search],
    queryFn: () =>
      apiClient.offers.list({ page, pageSize: 25, search: search || undefined })
  });

  const addOffer = useMutation({
    mutationFn: () =>
      apiClient.offers.create({
        source: "manual",
        url,
        title: title || undefined,
        technologies: ["React", "TypeScript"]
      }),
    onSuccess: () => {
      setUrl("");
      setTitle("");
      setShowAdd(false);
      void qc.invalidateQueries({ queryKey: ["offers"] });
    }
  });

  const deleteOffer = useMutation({
    mutationFn: (id: string) => apiClient.offers.delete(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["offers"] })
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Offers</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search title, company…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-52"
          />
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Offer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
          ) : !data?.items.length ? (
            <EmptyState
              icon={<Briefcase className="h-8 w-8" />}
              title="No offers yet"
              description="Add an offer URL to get started"
              action={
                <Button size="sm" onClick={() => setShowAdd(true)}>
                  Add Offer
                </Button>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title / URL</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Tech</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((offer) => (
                    <OfferRow
                      key={offer.id}
                      offer={offer}
                      onDelete={() => deleteOffer.mutate(offer.id)}
                      onSelect={() => setSelectedOffer(offer)}
                      selected={selectedOffer?.id === offer.id}
                    />
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-gray-100 px-3 py-2">
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

        <OfferDetailsPage offer={selectedOffer} />
      </div>

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Add Offer">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">URL *</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="React Frontend Engineer"
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => addOffer.mutate()}
              disabled={!url || addOffer.isPending}
            >
              {addOffer.isPending ? "Saving…" : "Save & Score"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function OfferRow({
  offer,
  onDelete,
  onSelect,
  selected
}: {
  offer: Offer;
  onDelete: () => void;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <TableRow className={selected ? "bg-blue-50/60" : undefined} onClick={onSelect}>
      <TableCell className="max-w-xs">
        <p className="truncate font-medium text-gray-900">{offer.title ?? "(untitled)"}</p>
        <p className="truncate text-xs text-gray-400">{offer.url}</p>
      </TableCell>
      <TableCell>
        {offer.company ?? <span className="text-gray-400">–</span>}
      </TableCell>
      <TableCell>
        <SalaryDisplay
          raw={offer.salaryRaw}
          monthlyMin={offer.salaryMonthlyMin}
          monthlyMax={offer.salaryMonthlyMax}
          currency={offer.salaryCurrency}
        />
      </TableCell>
      <TableCell>
        <TechStackChips technologies={offer.technologies} max={3} />
      </TableCell>
      <TableCell>
        <ScoreBadge score={offer.score} />
      </TableCell>
      <TableCell>
        {offer.decision && <StatusBadge status={offer.decision} />}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-gray-300 hover:text-red-600"
          aria-label="Delete offer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
