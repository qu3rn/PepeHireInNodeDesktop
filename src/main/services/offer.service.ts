import type { OfferRepository } from "../adapters/repositories";
import { parseSalary } from "../normalization/salary";
import { scoreOffer } from "./scoring.service";
import type { CreateOfferInput, OfferListQuery } from "../shared/types";

export class OfferService {
  constructor(private readonly offers: OfferRepository) {}

  async create(input: CreateOfferInput) {
    const salary = input.salaryRaw ? parseSalary(input.salaryRaw) : null;

    const scoring = scoreOffer({
      title: input.title ?? null,
      description: input.description ?? null,
      technologies: input.technologies ?? [],
      salaryMonthlyMin: salary?.monthlyMin ?? null,
      salaryRaw: input.salaryRaw ?? null
    });

    return this.offers.create({
      ...input,
      score: scoring.score,
      decision: scoring.decision,
      reasons: scoring.reasons
    });
  }

  async list(query: OfferListQuery) {
    return this.offers.list(query);
  }

  async get(id: string) {
    return this.offers.getById(id);
  }

  async delete(id: string) {
    return this.offers.delete(id);
  }
}
