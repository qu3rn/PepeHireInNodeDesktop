import type { Offer } from "../../main/shared/types";
import { Card, CardContent, CardHeader, CardTitle, SalaryDisplay, ScoreBadge, StatusBadge, TechStackChips } from "../components/ui";

export function OfferDetailsPage({ offer }: { offer: Offer | null }) {
  if (!offer) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-[var(--text-muted)]">Select an offer to see details.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{offer.title ?? "Untitled offer"}</CardTitle>
        <div className="flex items-center gap-2">
          {offer.decision && <StatusBadge status={offer.decision} />}
          <ScoreBadge score={offer.score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-[var(--text-muted)]">URL</p>
          <p className="break-all text-sm text-[var(--text-secondary)]">{offer.url}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Company</p>
            <p className="text-sm text-[var(--text-secondary)]">{offer.company ?? "–"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Location</p>
            <p className="text-sm text-[var(--text-secondary)]">{offer.location ?? "–"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Salary</p>
            <SalaryDisplay
              raw={offer.salaryRaw}
              monthlyMin={offer.salaryMonthlyMin}
              monthlyMax={offer.salaryMonthlyMax}
              currency={offer.salaryCurrency}
            />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Technologies</p>
            <TechStackChips technologies={offer.technologies} />
          </div>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">Description</p>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{offer.description ?? "–"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
