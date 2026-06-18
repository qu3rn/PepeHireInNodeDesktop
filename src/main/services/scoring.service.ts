import type { Offer } from "../shared/types";

export interface ScoreResult {
  score: number;
  decision: "apply" | "maybe" | "skip";
  reasons: string[];
}

export function scoreOffer(offer: Pick<Offer, "title" | "description" | "technologies" | "salaryMonthlyMin" | "salaryRaw">): ScoreResult {
  const text = `${offer.title ?? ""} ${offer.description ?? ""}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  if (text.includes("react") || offer.technologies.some((x) => x.toLowerCase() === "react")) {
    score += 30;
    reasons.push("React match");
  }

  if (text.includes("front") || text.includes("frontend")) {
    score += 20;
    reasons.push("Frontend role");
  }

  if (text.includes("typescript") || offer.technologies.some((x) => x.toLowerCase() === "typescript")) {
    score += 15;
    reasons.push("TypeScript boost");
  }

  if (text.includes("next.js")) {
    score += 8;
    reasons.push("Next.js boost");
  }

  if (text.includes("node.js")) {
    score += 5;
    reasons.push("Node.js bonus");
  }

  const negativeHits = ["angular", "vue", "php", "wordpress"].filter((kw) => text.includes(kw));
  if (negativeHits.length > 0) {
    score -= negativeHits.length * 8;
    reasons.push(`Competition stack present: ${negativeHits.join(", ")}`);
  }

  const obviousNonIt = ["sprzedawca", "kierowca", "kasjer", "magazynier"].some((kw) => text.includes(kw));
  if (obviousNonIt) {
    score = 0;
    reasons.push("Obvious non-IT role");
  }

  if (offer.salaryMonthlyMin && offer.salaryMonthlyMin >= 12000) {
    score += 12;
    reasons.push("Salary meets threshold");
  } else if (!offer.salaryRaw) {
    reasons.push("Salary missing");
  }

  score = Math.max(0, Math.min(100, score));

  const decision = score >= 70 ? "apply" : score >= 40 ? "maybe" : "skip";
  return { score, decision, reasons };
}
