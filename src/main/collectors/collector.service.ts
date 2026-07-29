import { randomUUID } from "node:crypto";
import type { OfferRepository, SearchRunRepository } from "../adapters/repositories";
import { parseSalary } from "../normalization/salary";
import { scoreOffer } from "../services/scoring.service";
import type { CollectorProgress, SearchCriteria, SearchRun } from "../shared/types";
import { BrowserService } from "./browser.service";
import type { PortalCollector } from "./collector.types";
import { FRONTEND_REACT_PROFILE, scoreOfferForProfile } from "../job-index/search-profile";

interface CollectorRunState {
  runId: string;
  source: SearchCriteria["source"];
  startedAt: string;
  cancelled: boolean;
  status: SearchRun["status"];
  offersFound: number;
  offersSaved: number;
  currentPage: number;
  currentPortal: string;
  message: string;
}

export class CollectorService {
  private readonly activeRuns = new Map<string, CollectorRunState>();
  private readonly progressByRunId = new Map<string, CollectorProgress>();

  constructor(
    private readonly offersRepo: OfferRepository,
    private readonly searchRunsRepo: SearchRunRepository,
    private readonly browserService: BrowserService,
    private readonly portalCollectors: PortalCollector[]
  ) {}

  getActiveRunCount(): number {
    return this.activeRuns.size;
  }

  async start(criteria: SearchCriteria): Promise<{ runId: string }> {
    const runId = randomUUID();
    const startedAt = new Date().toISOString();

    await this.searchRunsRepo.create({
      id: runId,
      source: criteria.source,
      status: "running",
      startedAt
    });

    const state: CollectorRunState = {
      runId,
      source: criteria.source,
      startedAt,
      cancelled: false,
      status: "running",
      offersFound: 0,
      offersSaved: 0,
      currentPage: 1,
      currentPortal: criteria.source,
      message: "Initializing collector"
    };

    this.activeRuns.set(runId, state);
    this.progressByRunId.set(runId, this.toProgress(state));

    void this.runCollector(criteria, state);

    return { runId };
  }

  async getStatus(runId: string): Promise<SearchRun> {
    const run = await this.searchRunsRepo.getById(runId);
    if (!run) {
      throw new Error(`Run ${runId} not found`);
    }

    return run;
  }

  async listRuns(): Promise<SearchRun[]> {
    return this.searchRunsRepo.list(50);
  }

  async cancel(runId: string): Promise<{ ok: boolean }> {
    const state = this.activeRuns.get(runId);
    if (!state) {
      const existing = await this.searchRunsRepo.getById(runId);
      return { ok: Boolean(existing) };
    }

    state.cancelled = true;
    state.message = "Cancelling...";
    this.progressByRunId.set(runId, this.toProgress(state));
    return { ok: true };
  }

  getProgress(runId: string): CollectorProgress | null {
    return this.progressByRunId.get(runId) ?? null;
  }

  private async runCollector(criteria: SearchCriteria, state: CollectorRunState): Promise<void> {
    const portalCollector = this.portalCollectors.find((x) => x.source === criteria.source);
    if (!portalCollector) {
      await this.failRun(state, `Portal collector not implemented for ${criteria.source}`);
      return;
    }

    let context = null as Awaited<ReturnType<BrowserService["createContext"]>> | null;
    let page = null as Awaited<ReturnType<Awaited<ReturnType<BrowserService["createContext"]>>["newPage"]>> | null;

    try {
      context = await this.browserService.createContext();
      page = await context.newPage();
      state.message = "Collecting listing pages";
      this.progressByRunId.set(state.runId, this.toProgress(state));

      const collected = await portalCollector.collect({
        criteria,
        context,
        page,
        isCancelled: () => state.cancelled
      });

      state.offersFound = collected.length;
      this.progressByRunId.set(state.runId, this.toProgress(state));

      let savedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (const item of collected) {
        if (state.cancelled) {
          break;
        }

        try {
          const parsedSalary = item.salaryRaw ? parseSalary(item.salaryRaw) : null;
          const score = scoreOffer({
            title: item.title ?? "",
            description: item.shortDescription ?? "",
            technologies: item.technologies ?? [],
            salaryMonthlyMin: parsedSalary?.monthlyMin ?? null,
            salaryRaw: item.salaryRaw ?? null
          });
          const profile = criteria.searchProfile ?? FRONTEND_REACT_PROFILE;
          const profileScore = scoreOfferForProfile({
            title: item.title,
            technologies: item.technologies,
            description: item.shortDescription
          }, profile);

          const result = await this.offersRepo.upsert({
            source: item.source,
            sourceId: item.sourceId ?? null,
            url: item.url,
            title: item.title ?? null,
            company: item.company ?? null,
            location: item.location ?? null,
            remoteMode: item.remoteMode ?? null,
            contractType: item.contractType ?? null,
            publicationDate: item.publicationDate ?? null,
            salaryRaw: item.salaryRaw ?? null,
            salaryMin: parsedSalary?.min ?? item.salaryMin ?? null,
            salaryMax: parsedSalary?.max ?? item.salaryMax ?? null,
            salaryCurrency: parsedSalary?.currency ?? item.salaryCurrency ?? null,
            salaryPeriod: parsedSalary?.period ?? null,
            salaryMonthlyMin: parsedSalary?.monthlyMin ?? null,
            salaryMonthlyMax: parsedSalary?.monthlyMax ?? null,
            technologies: item.technologies ?? [],
            description: item.shortDescription ?? null,
            score: score.score,
            decision: score.decision,
            reasons: [...profileScore.reasons, ...score.reasons],
            relevanceScore: profileScore.score,
            relevanceDecision: profileScore.decision,
            searchProfileId: profile.id,
            status: profileScore.decision === "match" ? "new" : "low_relevance"
          });

          if (result.created) {
            savedCount += 1;
          } else {
            skippedCount += 1;
          }
        } catch {
          failedCount += 1;
        }

        state.offersSaved = savedCount;
        state.message = `Saved ${savedCount} / ${state.offersFound} offers`;
        this.progressByRunId.set(state.runId, this.toProgress(state));
      }

      if (state.cancelled) {
        await this.searchRunsRepo.update(state.runId, {
          finishedAt: new Date().toISOString(),
          status: "cancelled",
          collectedCount: state.offersFound,
          savedCount,
          skippedCount,
          failedCount,
          message: "Cancelled by user"
        });
        state.status = "cancelled";
      } else {
        await this.searchRunsRepo.update(state.runId, {
          finishedAt: new Date().toISOString(),
          status: "completed",
          collectedCount: state.offersFound,
          savedCount,
          skippedCount,
          failedCount,
          message: "Collection finished"
        });
        state.status = "completed";
      }

      state.message = state.status === "completed" ? "Completed" : "Cancelled";
      this.progressByRunId.set(state.runId, this.toProgress(state));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown collector error";
      await this.failRun(state, message);
    } finally {
      try {
        await page?.close();
      } catch {
        // no-op
      }

      try {
        await context?.close();
      } catch {
        // no-op
      }

      this.activeRuns.delete(state.runId);
    }
  }

  private async failRun(state: CollectorRunState, message: string): Promise<void> {
    state.status = "failed";
    state.message = message;
    this.progressByRunId.set(state.runId, this.toProgress(state));

    await this.searchRunsRepo.update(state.runId, {
      finishedAt: new Date().toISOString(),
      status: "failed",
      collectedCount: state.offersFound,
      savedCount: state.offersSaved,
      failedCount: Math.max(1, state.offersFound - state.offersSaved),
      errorSummary: message,
      message
    });
  }

  private toProgress(state: CollectorRunState): CollectorProgress {
    return {
      runId: state.runId,
      source: state.source,
      currentPortal: state.currentPortal,
      currentPage: state.currentPage,
      offersFound: state.offersFound,
      offersSaved: state.offersSaved,
      status: state.status,
      message: state.message
    };
  }
}
