import { desc, eq } from "drizzle-orm";
import { collectionRunsTable } from "../db/schema";
import type { AppDb } from "../db/sqlite";
import type { SearchRunPatch, SearchRunRepository } from "../adapters/repositories";
import type { SearchRun } from "../shared/types";

function mapSearchRun(row: typeof collectionRunsTable.$inferSelect): SearchRun {
  return {
    id: row.id,
    source: row.source as SearchRun["source"],
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    status: row.status as SearchRun["status"],
    collectedCount: row.collectedCount,
    savedCount: row.savedCount,
    skippedCount: row.skippedCount,
    failedCount: row.failedCount,
    errorSummary: row.errorSummary,
    message: row.message
  };
}

export class SearchRunsSqliteRepository implements SearchRunRepository {
  constructor(private readonly db: AppDb) {}

  async create(input: Omit<SearchRun, "finishedAt" | "collectedCount" | "savedCount" | "skippedCount" | "failedCount" | "errorSummary" | "message"> & Partial<Pick<SearchRun, "finishedAt" | "collectedCount" | "savedCount" | "skippedCount" | "failedCount" | "errorSummary" | "message">>): Promise<SearchRun> {
    await this.db.insert(collectionRunsTable).values({
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
    });

    const created = await this.getById(input.id);
    if (!created) {
      throw new Error("Failed to create search run");
    }

    return created;
  }

  async getById(id: string): Promise<SearchRun | null> {
    const row = await this.db.query.collectionRunsTable.findFirst({ where: eq(collectionRunsTable.id, id) });
    return row ? mapSearchRun(row) : null;
  }

  async list(limit = 20): Promise<SearchRun[]> {
    const rows = await this.db.query.collectionRunsTable.findMany({
      orderBy: [desc(collectionRunsTable.startedAt)],
      limit
    });

    return rows.map(mapSearchRun);
  }

  async update(id: string, patch: SearchRunPatch): Promise<SearchRun> {
    await this.db
      .update(collectionRunsTable)
      .set({
        finishedAt: patch.finishedAt,
        status: patch.status,
        collectedCount: patch.collectedCount,
        savedCount: patch.savedCount,
        skippedCount: patch.skippedCount,
        failedCount: patch.failedCount,
        errorSummary: patch.errorSummary,
        message: patch.message
      })
      .where(eq(collectionRunsTable.id, id));

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Search run ${id} not found`);
    }

    return updated;
  }
}
