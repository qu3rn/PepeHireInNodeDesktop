import { randomUUID } from "node:crypto";
import type { AppLogger } from "../logging/logger";
import type { ApplicationAttemptRepository, OfferRepository } from "../adapters/repositories";
import type { ApplicationAttempt, AppError, RapidApplyInput, RapidApplyPreview, RapidApplyResult } from "../shared/types";
import { RapidApplySessionStore } from "./rapid-apply.session";
import type { RapidApplyAdapter } from "./rapid-apply.types";

function mapError(error: unknown, fallbackCode: AppError["code"] = "SUBMISSION_RESULT_UNKNOWN"): AppError {
  if (error instanceof Error) {
    return {
      code: fallbackCode,
      message: error.message,
      recoverable: true,
      details: error.stack
    };
  }

  return {
    code: fallbackCode,
    message: "Unknown rapid apply error",
    recoverable: true
  };
}

export class RapidApplyService {
  private readonly sessions = new RapidApplySessionStore();

  constructor(
    private readonly offersRepo: OfferRepository,
    private readonly attemptsRepo: ApplicationAttemptRepository,
    private readonly logger: AppLogger,
    private readonly adapters: RapidApplyAdapter[]
  ) {}

  getActiveSessionCount(): number {
    return this.sessions.activeCount();
  }

  async listAttempts(limit = 30): Promise<ApplicationAttempt[]> {
    return this.attemptsRepo.list(limit);
  }

  async inspect(offerId: string): Promise<RapidApplyPreview> {
    const offer = await this.offersRepo.getById(offerId);
    if (!offer) {
      throw new Error("Offer not found");
    }

    const adapter = this.resolveAdapter(offer);
    if (!adapter) {
      throw new Error("Unsupported portal");
    }

    const attemptId = randomUUID();
    const now = new Date().toISOString();

    this.sessions.start(attemptId, offerId);
    await this.attemptsRepo.create({
      id: attemptId,
      offerId,
      source: offer.source as ApplicationAttempt["source"],
      startedAt: now,
      finishedAt: null,
      status: "inspecting",
      fieldsDetected: [],
      fieldsFilled: [],
      fieldsSkipped: [],
      manualActionRequired: false,
      submitted: false,
      errorSummary: null,
      screenshotPath: null,
      debugLogPath: null,
      updatedAt: now,
      logs: ["Inspect started"]
    });

    this.logger.info("Rapid apply inspect started", {
      module: "rapid-apply.service",
      attemptId,
      offerId,
      source: offer.source
    });

    const preview = await adapter.prepare({ offerId, attemptId, candidate: {}, offer });

    await this.attemptsRepo.updateStatus(attemptId, {
      status: "prepared",
      fieldsDetected: preview.fieldsDetected
    });
    await this.attemptsRepo.appendLog(attemptId, "Inspect completed");

    this.sessions.setStatus(attemptId, "prepared");

    return {
      ...preview,
      attemptId
    };
  }

  async prepare(input: RapidApplyInput): Promise<RapidApplyPreview> {
    const offer = await this.offersRepo.getById(input.offerId);
    if (!offer) {
      throw new Error("Offer not found");
    }

    const adapter = this.resolveAdapter(offer);
    if (!adapter) {
      throw new Error("Unsupported portal");
    }

    const attempt = input.attemptId ? await this.attemptsRepo.getById(input.attemptId) : null;
    const attemptId = attempt?.id ?? randomUUID();

    if (!attempt) {
      const now = new Date().toISOString();
      this.sessions.start(attemptId, input.offerId);
      await this.attemptsRepo.create({
        id: attemptId,
        offerId: input.offerId,
        source: offer.source as ApplicationAttempt["source"],
        startedAt: now,
        finishedAt: null,
        status: "inspecting",
        fieldsDetected: [],
        fieldsFilled: [],
        fieldsSkipped: [],
        manualActionRequired: false,
        submitted: false,
        errorSummary: null,
        screenshotPath: null,
        debugLogPath: null,
        updatedAt: now,
        logs: ["Prepare started"]
      });
    }

    const preview = await adapter.prepare({ ...input, attemptId, offer });
    await this.attemptsRepo.updateStatus(attemptId, {
      status: "prepared",
      fieldsDetected: preview.fieldsDetected,
      fieldsFilled: preview.fieldsMapped,
      fieldsSkipped: preview.fieldsDetected.filter((x) => !preview.fieldsMapped.includes(x.key)).map((x) => x.key),
      manualActionRequired: preview.manualActionRequired
    });
    await this.attemptsRepo.appendLog(attemptId, "Prepare completed");
    this.sessions.setStatus(attemptId, "prepared");

    return {
      ...preview,
      attemptId
    };
  }

  async submit(input: RapidApplyInput): Promise<RapidApplyResult> {
    if (!input.attemptId) {
      throw new Error("Attempt id is required");
    }

    if (!input.confirmationChecked) {
      throw new Error("Explicit confirmation is required before submission");
    }

    const offer = await this.offersRepo.getById(input.offerId);
    if (!offer) {
      throw new Error("Offer not found");
    }

    const adapter = this.resolveAdapter(offer);
    if (!adapter) {
      throw new Error("Unsupported portal");
    }

    const attempt = await this.attemptsRepo.getById(input.attemptId);
    if (!attempt) {
      throw new Error("Attempt not found");
    }

    this.sessions.start(input.attemptId, input.offerId);
    this.sessions.setStatus(input.attemptId, "submitting");
    await this.attemptsRepo.updateStatus(input.attemptId, { status: "submitting" });
    await this.attemptsRepo.appendLog(input.attemptId, "Submit started");

    try {
      const preview = await this.prepare(input);
      const result = await adapter.apply({ ...input, offer, preview });

      await this.attemptsRepo.updateStatus(input.attemptId, {
        status: result.status,
        finishedAt: new Date().toISOString(),
        fieldsFilled: result.fieldsFilled,
        fieldsSkipped: result.fieldsSkipped,
        manualActionRequired: result.manualActionRequired,
        submitted: result.submitted,
        screenshotPath: result.screenshotPath ?? null,
        debugLogPath: result.debugLogPath ?? null,
        errorSummary: result.status === "failed" ? result.message : null
      });
      await this.attemptsRepo.appendLog(input.attemptId, result.message);

      this.sessions.setStatus(input.attemptId, result.status);
      this.sessions.end(input.attemptId);

      this.logger.info("Rapid apply submit completed", {
        module: "rapid-apply.service",
        attemptId: input.attemptId,
        offerId: input.offerId,
        status: result.status,
        submitted: result.submitted
      });

      return result;
    } catch (error) {
      const mapped = mapError(error, "SUBMISSION_RESULT_UNKNOWN");
      await this.attemptsRepo.updateStatus(input.attemptId, {
        status: "failed",
        finishedAt: new Date().toISOString(),
        errorSummary: mapped.message
      });
      await this.attemptsRepo.appendLog(input.attemptId, `Failed: ${mapped.message}`);
      this.sessions.end(input.attemptId);

      this.logger.error("Rapid apply submit failed", {
        module: "rapid-apply.service",
        attemptId: input.attemptId,
        offerId: input.offerId,
        code: mapped.code,
        details: mapped.details
      });

      throw new Error(mapped.message);
    }
  }

  async cancel(attemptId: string): Promise<{ ok: boolean }> {
    const cancelled = this.sessions.cancel(attemptId);
    if (!cancelled) {
      return { ok: false };
    }

    await this.attemptsRepo.updateStatus(attemptId, {
      status: "cancelled",
      finishedAt: new Date().toISOString()
    });
    await this.attemptsRepo.appendLog(attemptId, "Cancelled by user");
    this.sessions.end(attemptId);
    return { ok: true };
  }

  async getStatus(attemptId: string): Promise<ApplicationAttempt | null> {
    return this.attemptsRepo.getById(attemptId);
  }

  private resolveAdapter(offer: { source: string }): RapidApplyAdapter | null {
    return this.adapters.find((adapter) => adapter.source === offer.source);
  }
}
