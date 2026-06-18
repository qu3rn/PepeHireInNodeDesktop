import { asc, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { applyQueueItemsTable } from "../db/schema";
import type { AppDb } from "../db/sqlite";
import type { QueueRepository } from "../adapters/repositories";
import type { Offer, PaginatedResult, QueueItem, QueueListQuery } from "../shared/types";
import { normalizePagination } from "../shared/pagination";

function mapQueueItem(row: typeof applyQueueItemsTable.$inferSelect): QueueItem {
  return {
    id: row.id,
    offerId: row.offerId,
    status: row.status as QueueItem["status"],
    priorityScore: row.priorityScore,
    reasons: JSON.parse(row.reasonsJson),
    skipReason: row.skipReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export class QueueSqliteRepository implements QueueRepository {
  constructor(private readonly db: AppDb) {}

  async list(query: QueueListQuery): Promise<PaginatedResult<QueueItem>> {
    const normalized = normalizePagination(query.page, query.pageSize);

    const rows = await this.db.query.applyQueueItemsTable.findMany({
      where: query.status ? eq(applyQueueItemsTable.status, query.status) : undefined,
      orderBy: [desc(applyQueueItemsTable.priorityScore), asc(applyQueueItemsTable.createdAt)],
      limit: normalized.pageSize,
      offset: (normalized.page - 1) * normalized.pageSize
    });

    const all = await this.db.query.applyQueueItemsTable.findMany({
      where: query.status ? eq(applyQueueItemsTable.status, query.status) : undefined
    });

    return {
      items: rows.map(mapQueueItem),
      page: normalized.page,
      pageSize: normalized.pageSize,
      total: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / normalized.pageSize))
    };
  }

  async buildFromOffers(offers: Offer[]): Promise<number> {
    const candidates = offers.filter((offer) => offer.decision === "apply" || offer.decision === "maybe");
    const now = new Date().toISOString();
    let inserted = 0;

    for (const offer of candidates) {
      const exists = await this.db.query.applyQueueItemsTable.findFirst({
        where: eq(applyQueueItemsTable.offerId, offer.id)
      });

      if (exists) {
        continue;
      }

      await this.db.insert(applyQueueItemsTable).values({
        id: randomUUID(),
        offerId: offer.id,
        status: "pending",
        priorityScore: offer.score ?? 0,
        reasonsJson: JSON.stringify(offer.reasons),
        skipReason: null,
        createdAt: now,
        updatedAt: now
      });
      inserted += 1;
    }

    return inserted;
  }

  async getNext(): Promise<QueueItem | null> {
    const row = await this.db.query.applyQueueItemsTable.findFirst({
      where: eq(applyQueueItemsTable.status, "pending"),
      orderBy: [desc(applyQueueItemsTable.priorityScore), asc(applyQueueItemsTable.createdAt)]
    });

    return row ? mapQueueItem(row) : null;
  }

  async markSent(id: string): Promise<void> {
    await this.db
      .update(applyQueueItemsTable)
      .set({ status: "sent", updatedAt: new Date().toISOString() })
      .where(eq(applyQueueItemsTable.id, id));
  }

  async skip(id: string, reason: string): Promise<void> {
    await this.db
      .update(applyQueueItemsTable)
      .set({ status: "skipped", skipReason: reason, updatedAt: new Date().toISOString() })
      .where(eq(applyQueueItemsTable.id, id));
  }
}
