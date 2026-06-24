import type { Offer } from "../../main/shared/types";
import { Card, CardContent, CardHeader, CardTitle, SalaryDisplay, ScoreBadge, StatusBadge, TechStackChips } from "../components/ui";

export function OfferDetailsPage({ offer }: { offer: Offer | null }) {
  if (!offer) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-gray-400">Select an offer to see details.</CardContent>
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
          <p className="text-xs text-gray-500">URL</p>
          <p className="break-all text-sm text-gray-700">{offer.url}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Company</p>
            <p className="text-sm text-gray-700">{offer.company ?? "–"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Location</p>
            <p className="text-sm text-gray-700">{offer.location ?? "–"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Salary</p>
            <SalaryDisplay
              raw={offer.salaryRaw}
              monthlyMin={offer.salaryMonthlyMin}
              monthlyMax={offer.salaryMonthlyMax}
              currency={offer.salaryCurrency}
            />
          </div>
          <div>
            <p className="text-xs text-gray-500">Technologies</p>
            <TechStackChips technologies={offer.technologies} />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">Description</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{offer.description ?? "–"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
