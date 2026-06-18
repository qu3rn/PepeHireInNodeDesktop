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
    url: row.url,
    title: row.title,
    company: row.company,
    location: row.location,
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

  async create(input: CreateOfferInput): Promise<Offer> {
    const now = new Date().toISOString();
    const id = randomUUID();

    await this.db.insert(offersTable).values({
      id,
      source: input.source,
      url: input.url,
      title: input.title ?? null,
      company: input.company ?? null,
      location: input.location ?? null,
      salaryRaw: input.salaryRaw ?? null,
      technologiesJson: JSON.stringify(input.technologies ?? []),
      description: input.description ?? null,
      score: input.score ?? null,
      decision: input.decision ?? null,
      reasonsJson: JSON.stringify(input.reasons ?? []),
      createdAt: now,
      updatedAt: now
    });

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
    await this.db
      .update(offersTable)
      .set({
        ...patch,
        technologiesJson: patch.technologies ? JSON.stringify(patch.technologies) : undefined,
        reasonsJson: patch.reasons ? JSON.stringify(patch.reasons) : undefined,
        updatedAt: new Date().toISOString()
      })
      .where(eq(offersTable.id, id));

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
}
