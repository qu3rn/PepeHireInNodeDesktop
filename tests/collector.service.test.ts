import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { CollectorService } from "../src/main/collectors/collector.service";
import type { OfferRepository, SearchRunPatch, SearchRunRepository } from "../src/main/adapters/repositories";
import type { CollectorProgress, CreateOfferInput, Offer, OfferListQuery, PaginatedResult, SearchRun, UpdateOfferInput } from "../src/main/shared/types";
import type { PortalCollector } from "../src/main/collectors/collector.types";

class InMemoryOffersRepo implements OfferRepository {
  private offers = new Map<string, Offer>();

  async create(input: CreateOfferInput): Promise<Offer> {
    const created: Offer = {
      id: randomUUID(),
      source: input.source,
      sourceId: input.sourceId ?? null,
      url: input.url,
      title: input.title ?? null,
      company: input.company ?? null,
      location: input.location ?? null,
      remoteMode: input.remoteMode ?? null,
      contractType: input.contractType ?? null,
      publicationDate: input.publicationDate ?? null,
      salaryRaw: input.salaryRaw ?? null,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryCurrency ?? null,
      salaryPeriod: input.salaryPeriod ?? null,
      salaryMonthlyMin: input.salaryMonthlyMin ?? null,
      salaryMonthlyMax: input.salaryMonthlyMax ?? null,
      technologies: input.technologies ?? [],
      description: input.description ?? null,
      score: input.score ?? null,
      decision: input.decision ?? null,
      reasons: input.reasons ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.offers.set(created.id, created);
    return created;
  }

  async getById(id: string): Promise<Offer | null> {
    return this.offers.get(id) ?? null;
  }

  async getByUrl(url: string): Promise<Offer | null> {
    return Array.from(this.offers.values()).find((x) => x.url === url) ?? null;
  }

  async list(_query: OfferListQuery): Promise<PaginatedResult<Offer>> {
    const items = Array.from(this.offers.values());
    return {
      items,
      page: 1,
      pageSize: items.length || 1,
      total: items.length,
      totalPages: 1
    };
  }

  async update(id: string, patch: UpdateOfferInput): Promise<Offer> {
    const offer = this.offers.get(id);
    if (!offer) {
      throw new Error("Offer not found");
    }

    const next: Offer = {
      ...offer,
      ...patch,
      sourceId: patch.sourceId ?? offer.sourceId,
      remoteMode: patch.remoteMode ?? offer.remoteMode,
      contractType: patch.contractType ?? offer.contractType,
      publicationDate: patch.publicationDate ?? offer.publicationDate,
      technologies: patch.technologies ?? offer.technologies,
      reasons: patch.reasons ?? offer.reasons,
      updatedAt: new Date().toISOString()
    };

    this.offers.set(id, next);
    return next;
  }

  async delete(id: string): Promise<void> {
    this.offers.delete(id);
  }

  async bulkDelete(ids: string[]): Promise<{ deletedCount: number }> {
    let count = 0;
    for (const id of ids) {
      if (this.offers.delete(id)) {
        count += 1;
      }
    }
    return { deletedCount: count };
  }

  async all(): Promise<Offer[]> {
    return Array.from(this.offers.values());
  }

  async upsert(input: CreateOfferInput): Promise<{ offer: Offer; created: boolean }> {
    const existing = Array.from(this.offers.values()).find((x) => (input.sourceId ? x.sourceId === input.sourceId : x.url === input.url));
    if (!existing) {
      const offer = await this.create(input);
      return { offer, created: true };
    }

    const updated = await this.update(existing.id, {
      title: input.title ?? existing.title,
      description: input.description ?? existing.description,
      salaryRaw: input.salaryRaw ?? existing.salaryRaw,
      technologies: input.technologies ?? existing.technologies,
      score: input.score ?? existing.score,
      decision: input.decision ?? existing.decision,
      reasons: input.reasons ?? existing.reasons
    });

    return { offer: updated, created: false };
  }
}

class InMemorySearchRunsRepo implements SearchRunRepository {
  private runs = new Map<string, SearchRun>();

  async create(input: Omit<SearchRun, "finishedAt" | "collectedCount" | "savedCount" | "skippedCount" | "failedCount" | "errorSummary" | "message"> & Partial<Pick<SearchRun, "finishedAt" | "collectedCount" | "savedCount" | "skippedCount" | "failedCount" | "errorSummary" | "message">>): Promise<SearchRun> {
    const run: SearchRun = {
      id: input.id,
      source: input.source,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt ?? null,
      status: input.status,
      collectedCount: input.collectedCount ?? 0,
      savedCount: input.savedCount ?? 0,
      skippedCount: input.skippedCount ?? 0,
      failedCount: input.failedCount ?? 0,
      errorSummary: input.errorSummary ?? null,
      message: input.message ?? null
    };

    this.runs.set(run.id, run);
    return run;
  }

  async getById(id: string): Promise<SearchRun | null> {
    return this.runs.get(id) ?? null;
  }

  async list(limit = 20): Promise<SearchRun[]> {
    return Array.from(this.runs.values()).slice(0, limit);
  }

  async update(id: string, patch: SearchRunPatch): Promise<SearchRun> {
    const current = this.runs.get(id);
    if (!current) {
      throw new Error("Run not found");
    }

    const next = { ...current, ...patch };
    this.runs.set(id, next);
    return next;
  }
}

const fakeBrowserService = {
  async createContext() {
    return {
      async newPage() {
        return {
          async close() {
            return undefined;
          }
        };
      },
      async close() {
        return undefined;
      }
    };
  }
};

describe("CollectorService", () => {
  it("saves collected offers and tracks run status", async () => {
    const offers = new InMemoryOffersRepo();
    const runs = new InMemorySearchRunsRepo();

    const portalCollector: PortalCollector = {
      source: "pracuj",
      async collect() {
        return [
          {
            source: "pracuj",
            sourceId: "s-1",
            url: "https://it.pracuj.pl/oferta/frontend,1",
            title: "Frontend Engineer",
            company: "Acme",
            location: "Warszawa",
            salaryRaw: "15 000 - 20 000 PLN / mies.",
            technologies: ["React", "TypeScript"],
            shortDescription: "React TypeScript role"
          },
          {
            source: "pracuj",
            sourceId: "s-2",
            url: "https://it.pracuj.pl/oferta/frontend,2",
            title: "Frontend Engineer 2",
            salaryRaw: "No salary"
          }
        ];
      }
    };

    const service = new CollectorService(offers, runs, fakeBrowserService as never, [portalCollector]);
    const { runId } = await service.start({ source: "pracuj", phrase: "frontend", pageLimit: 1, resultLimit: 10 });

    for (let i = 0; i < 15; i += 1) {
      const status = await service.getStatus(runId);
      if (status.status !== "running") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const finalRun = await service.getStatus(runId);
    expect(finalRun.status).toBe("completed");
    expect(finalRun.collectedCount).toBe(2);
    expect(finalRun.savedCount).toBe(2);

    const all = await offers.all();
    expect(all.length).toBe(2);
    expect(all[0]?.score).toBeTypeOf("number");

    const progress = service.getProgress(runId) as CollectorProgress;
    expect(progress.status).toBe("completed");
  });

  it("marks existing offers as skipped when upsert updates", async () => {
    const offers = new InMemoryOffersRepo();
    const runs = new InMemorySearchRunsRepo();

    await offers.upsert({
      source: "pracuj",
      sourceId: "same-offer",
      url: "https://it.pracuj.pl/oferta/frontend,same-offer",
      title: "Initial title"
    });

    const portalCollector: PortalCollector = {
      source: "pracuj",
      async collect() {
        return [
          {
            source: "pracuj",
            sourceId: "same-offer",
            url: "https://it.pracuj.pl/oferta/frontend,same-offer",
            title: "Updated title",
            salaryRaw: "20 000 PLN / mies."
          }
        ];
      }
    };

    const service = new CollectorService(offers, runs, fakeBrowserService as never, [portalCollector]);
    const { runId } = await service.start({ source: "pracuj", phrase: "frontend" });

    for (let i = 0; i < 15; i += 1) {
      const status = await service.getStatus(runId);
      if (status.status !== "running") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const run = await service.getStatus(runId);
    expect(run.status).toBe("completed");
    expect(run.savedCount).toBe(0);
    expect(run.skippedCount).toBe(1);

    const all = await offers.all();
    expect(all[0]?.title).toBe("Updated title");
  });
});
