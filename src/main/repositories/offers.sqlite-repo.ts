import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { offersTable } from "../db/schema";
import type { AppDb } from "../db/sqlite";
import type { OfferRepository } from "../adapters/repositories";
import type {
  BulkDeleteResult,
  CreateOfferInput,
  Offer,
  OfferListQuery,
  PaginatedResult,
  UpdateOfferInput
} from "../shared/types";
import { normalizePagination } from "../shared/pagination";

function mapOffer(row: typeof offersTable.$inferSelect): Offer {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.sourceId,
    url: row.url,
    title: row.title,
    company: row.company,
    location: row.location,
    remoteMode: row.remoteMode,
    contractType: row.contractType,
    publicationDate: row.publicationDate,
    salaryRaw: row.salaryRaw,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    salaryCurrency: row.salaryCurrency,
    salaryPeriod: row.salaryPeriod,
    salaryMonthlyMin: row.salaryMonthlyMin,
    salaryMonthlyMax: row.salaryMonthlyMax,
    technologies: JSON.parse(row.technologiesJson),
    description: row.description,
    score: row.score,
    decision: (row.decision as Offer["decision"]) ?? null,
    reasons: JSON.parse(row.reasonsJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export class OffersSqliteRepository implements OfferRepository {
  constructor(private readonly db: AppDb) {}

  private normalizeSourceId(input: CreateOfferInput | UpdateOfferInput): string | null | undefined {
    if (!("sourceId" in input)) {
      return undefined;
    }

    if (input.sourceId === null || input.sourceId === undefined) {
      return input.sourceId;
    }

    const trimmed = input.sourceId.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url.trim());
      parsed.hash = "";
      parsed.search = "";
      const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
      return `${parsed.origin.toLowerCase()}${pathname}`;
    } catch {
      return url.trim();
    }
  }

  private async findExistingForUpsert(input: CreateOfferInput): Promise<Offer | null> {
    const normalizedSourceId = this.normalizeSourceId(input);
    if (normalizedSourceId) {
      const bySourceId = await this.db.query.offersTable.findFirst({
        where: and(eq(offersTable.source, input.source), eq(offersTable.sourceId, normalizedSourceId))
      });

      if (bySourceId) {
        return mapOffer(bySourceId);
      }
    }

    const normalizedInputUrl = this.normalizeUrl(input.url);
    const all = await this.db.query.offersTable.findMany();
    const byUrl = all.find((row) => this.normalizeUrl(row.url) === normalizedInputUrl);
    return byUrl ? mapOffer(byUrl) : null;
  }

  private buildCreateValues(id: string, now: string, input: CreateOfferInput): typeof offersTable.$inferInsert {
    return {
      id,
      source: input.source,
      sourceId: this.normalizeSourceId(input) ?? null,
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
      technologiesJson: JSON.stringify(input.technologies ?? []),
      description: input.description ?? null,
      score: input.score ?? null,
      decision: input.decision ?? null,
      reasonsJson: JSON.stringify(input.reasons ?? []),
      createdAt: now,
      updatedAt: now
    };
  }

  private buildUpdateValues(patch: UpdateOfferInput): Partial<typeof offersTable.$inferInsert> {
    return {
      sourceId: this.normalizeSourceId(patch),
      title: patch.title,
      company: patch.company,
      location: patch.location,
      remoteMode: patch.remoteMode,
      contractType: patch.contractType,
      publicationDate: patch.publicationDate,
      salaryRaw: patch.salaryRaw,
      salaryMin: patch.salaryMin,
      salaryMax: patch.salaryMax,
      salaryCurrency: patch.salaryCurrency,
      salaryPeriod: patch.salaryPeriod,
      salaryMonthlyMin: patch.salaryMonthlyMin,
      salaryMonthlyMax: patch.salaryMonthlyMax,
      technologiesJson: patch.technologies ? JSON.stringify(patch.technologies) : undefined,
      description: patch.description,
      score: patch.score,
      decision: patch.decision,
      reasonsJson: patch.reasons ? JSON.stringify(patch.reasons) : undefined,
      updatedAt: new Date().toISOString()
    };
  }

  async create(input: CreateOfferInput): Promise<Offer> {
    const now = new Date().toISOString();
    const id = randomUUID();

    await this.db.insert(offersTable).values(this.buildCreateValues(id, now, input));

    const created = await this.getById(id);
    if (!created) {
      throw new Error("Failed to create offer");
    }
    return created;
  }

  async getById(id: string): Promise<Offer | null> {
    const row = await this.db.query.offersTable.findFirst({
      where: eq(offersTable.id, id)
    });
    return row ? mapOffer(row) : null;
  }

  async getByUrl(url: string): Promise<Offer | null> {
    const row = await this.db.query.offersTable.findFirst({
      where: eq(offersTable.url, url)
    });
    return row ? mapOffer(row) : null;
  }

  async list(query: OfferListQuery): Promise<PaginatedResult<Offer>> {
    const normalized = normalizePagination(query.page, query.pageSize);
    const filters = [];

    if (query.search) {
      const pattern = `%${query.search}%`;
      filters.push(or(like(offersTable.title, pattern), like(offersTable.company, pattern), like(offersTable.url, pattern)));
    }

    if (query.decision) {
      filters.push(eq(offersTable.decision, query.decision));
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const items = await this.db
      .select()
      .from(offersTable)
      .where(whereClause)
      .orderBy(desc(offersTable.createdAt))
      .limit(normalized.pageSize)
      .offset((normalized.page - 1) * normalized.pageSize);

    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(offersTable)
      .where(whereClause);

    const total = totalResult[0]?.count ?? 0;

    return {
      items: items.map(mapOffer),
      page: normalized.page,
      pageSize: normalized.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / normalized.pageSize))
    };
  }

  async update(id: string, patch: UpdateOfferInput): Promise<Offer> {
    await this.db.update(offersTable).set(this.buildUpdateValues(patch)).where(eq(offersTable.id, id));

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Offer ${id} not found`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(offersTable).where(eq(offersTable.id, id));
  }

  async bulkDelete(ids: string[]): Promise<BulkDeleteResult> {
    if (ids.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await this.db.delete(offersTable).where(sql`${offersTable.id} in ${ids}`);
    return { deletedCount: result.changes ?? 0 };
  }

  async all(): Promise<Offer[]> {
    const rows = await this.db.select().from(offersTable);
    return rows.map(mapOffer);
  }

  async upsert(input: CreateOfferInput): Promise<{ offer: Offer; created: boolean }> {
    const existing = await this.findExistingForUpsert(input);
    if (!existing) {
      const created = await this.create(input);
      return { offer: created, created: true };
    }

    const merged: UpdateOfferInput = {
      sourceId: this.normalizeSourceId(input),
      title: input.title ?? existing.title,
      company: input.company ?? existing.company,
      location: input.location ?? existing.location,
      remoteMode: input.remoteMode ?? existing.remoteMode,
      contractType: input.contractType ?? existing.contractType,
      publicationDate: input.publicationDate ?? existing.publicationDate,
      salaryRaw: input.salaryRaw ?? existing.salaryRaw,
      salaryMin: input.salaryMin ?? existing.salaryMin,
      salaryMax: input.salaryMax ?? existing.salaryMax,
      salaryCurrency: input.salaryCurrency ?? existing.salaryCurrency,
      salaryPeriod: input.salaryPeriod ?? existing.salaryPeriod,
      salaryMonthlyMin: input.salaryMonthlyMin ?? existing.salaryMonthlyMin,
      salaryMonthlyMax: input.salaryMonthlyMax ?? existing.salaryMonthlyMax,
      technologies: input.technologies && input.technologies.length > 0 ? input.technologies : existing.technologies,
      description: input.description ?? existing.description,
      score: input.score ?? existing.score,
      decision: input.decision ?? existing.decision,
      reasons: input.reasons && input.reasons.length > 0 ? input.reasons : existing.reasons
    };

    const offer = await this.update(existing.id, merged);
    return { offer, created: false };
  }
}
