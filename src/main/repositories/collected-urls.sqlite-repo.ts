import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { collectedUrlsTable } from "../db/schema";
import type { AppDb } from "../db/sqlite";
import type { CollectedUrlRepository } from "../adapters/repositories";
import type { CollectedUrl, PaginatedResult } from "../shared/types";
import { normalizePagination } from "../shared/pagination";

function mapCollectedUrl(row: typeof collectedUrlsTable.$inferSelect): CollectedUrl {
  return {
    id: row.id,
    source: row.source,
    url: row.url,
    classification: row.classification as CollectedUrl["classification"],
    classificationReason: row.classificationReason,
    relevanceScore: row.relevanceScore,
    relevanceDecision: (row.relevanceDecision as CollectedUrl["relevanceDecision"]) ?? null,
    matchedKeywords: JSON.parse(row.matchedKeywordsJson),
    negativeKeywords: JSON.parse(row.negativeKeywordsJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export class CollectedUrlsSqliteRepository implements CollectedUrlRepository {
  constructor(private readonly db: AppDb) {}

  async create(input: Omit<CollectedUrl, "id" | "createdAt" | "updatedAt">): Promise<CollectedUrl> {
    const now = new Date().toISOString();
    const id = randomUUID();

    await this.db.insert(collectedUrlsTable).values({
      id,
      source: input.source,
      url: input.url,
      classification: input.classification,
      classificationReason: input.classificationReason,
      relevanceScore: input.relevanceScore,
      relevanceDecision: input.relevanceDecision,
      matchedKeywordsJson: JSON.stringify(input.matchedKeywords),
      negativeKeywordsJson: JSON.stringify(input.negativeKeywords),
      createdAt: now,
      updatedAt: now
    });

    const created = await this.db.query.collectedUrlsTable.findFirst({
      where: eq(collectedUrlsTable.id, id)
    });

    if (!created) {
      throw new Error("Failed to create collected URL");
    }

    return mapCollectedUrl(created);
  }

  async list(page = 1, pageSize = 25): Promise<PaginatedResult<CollectedUrl>> {
    const normalized = normalizePagination(page, pageSize);

    const rows = await this.db.query.collectedUrlsTable.findMany({
      orderBy: [desc(collectedUrlsTable.createdAt)],
      limit: normalized.pageSize,
      offset: (normalized.page - 1) * normalized.pageSize
    });

    const all = await this.db.query.collectedUrlsTable.findMany();

    return {
      items: rows.map(mapCollectedUrl),
      page: normalized.page,
      pageSize: normalized.pageSize,
      total: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / normalized.pageSize))
    };
  }
}
