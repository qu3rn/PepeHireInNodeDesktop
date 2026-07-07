import { desc, eq } from "drizzle-orm";
import { applicationAttemptsTable } from "../db/schema";
import type { AppDb } from "../db/sqlite";
import type { ApplicationAttemptPatch, ApplicationAttemptRepository } from "../adapters/repositories";
import type { ApplicationAttempt } from "../shared/types";

function mapAttempt(row: typeof applicationAttemptsTable.$inferSelect): ApplicationAttempt {
  return {
    id: row.id,
    offerId: row.offerId,
    source: row.source as ApplicationAttempt["source"],
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    status: row.status as ApplicationAttempt["status"],
    fieldsDetected: JSON.parse(row.fieldsDetectedJson),
    fieldsFilled: JSON.parse(row.fieldsFilledJson),
    fieldsSkipped: JSON.parse(row.fieldsSkippedJson),
    manualActionRequired: row.manualActionRequired,
    submitted: row.submitted,
    errorSummary: row.errorSummary,
    screenshotPath: row.screenshotPath,
    debugLogPath: row.debugLogPath,
    logs: JSON.parse(row.logsJson),
    updatedAt: row.updatedAt
  };
}

export class ApplicationAttemptsSqliteRepository implements ApplicationAttemptRepository {
  constructor(private readonly db: AppDb) {}

  async list(limit = 30): Promise<ApplicationAttempt[]> {
    const rows = await this.db.query.applicationAttemptsTable.findMany({
      orderBy: [desc(applicationAttemptsTable.startedAt)],
      limit
    });
    return rows.map(mapAttempt);
  }

  async getById(id: string): Promise<ApplicationAttempt | null> {
    const row = await this.db.query.applicationAttemptsTable.findFirst({
      where: eq(applicationAttemptsTable.id, id)
    });
    return row ? mapAttempt(row) : null;
  }

  async getByOfferId(offerId: string): Promise<ApplicationAttempt[]> {
    const rows = await this.db.query.applicationAttemptsTable.findMany({
      where: eq(applicationAttemptsTable.offerId, offerId),
      orderBy: [desc(applicationAttemptsTable.startedAt)]
    });
    return rows.map(mapAttempt);
  }

  async create(input: Omit<ApplicationAttempt, "logs"> & { logs?: string[] }): Promise<ApplicationAttempt> {
    await this.db.insert(applicationAttemptsTable).values({
      id: input.id,
      offerId: input.offerId,
      source: input.source,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt,
      status: input.status,
      fieldsDetectedJson: JSON.stringify(input.fieldsDetected),
      fieldsFilledJson: JSON.stringify(input.fieldsFilled),
      fieldsSkippedJson: JSON.stringify(input.fieldsSkipped),
      manualActionRequired: input.manualActionRequired,
      submitted: input.submitted,
      errorSummary: input.errorSummary,
      screenshotPath: input.screenshotPath,
      debugLogPath: input.debugLogPath,
      logsJson: JSON.stringify(input.logs ?? []),
      updatedAt: input.updatedAt
    });

    const created = await this.getById(input.id);
    if (!created) {
      throw new Error("Failed to create application attempt");
    }

    return created;
  }

  async updateStatus(id: string, patch: ApplicationAttemptPatch): Promise<ApplicationAttempt> {
    await this.db
      .update(applicationAttemptsTable)
      .set({
        finishedAt: patch.finishedAt,
        status: patch.status,
        fieldsDetectedJson: patch.fieldsDetected ? JSON.stringify(patch.fieldsDetected) : undefined,
        fieldsFilledJson: patch.fieldsFilled ? JSON.stringify(patch.fieldsFilled) : undefined,
        fieldsSkippedJson: patch.fieldsSkipped ? JSON.stringify(patch.fieldsSkipped) : undefined,
        manualActionRequired: patch.manualActionRequired,
        submitted: patch.submitted,
        errorSummary: patch.errorSummary,
        screenshotPath: patch.screenshotPath,
        debugLogPath: patch.debugLogPath,
        updatedAt: new Date().toISOString()
      })
      .where(eq(applicationAttemptsTable.id, id));

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Application attempt ${id} not found`);
    }

    return updated;
  }

  async appendLog(id: string, message: string): Promise<ApplicationAttempt> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Application attempt ${id} not found`);
    }

    const logs = [...current.logs, message];
    await this.db
      .update(applicationAttemptsTable)
      .set({
        logsJson: JSON.stringify(logs),
        updatedAt: new Date().toISOString()
      })
      .where(eq(applicationAttemptsTable.id, id));

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Application attempt ${id} not found`);
    }

    return updated;
  }
}
