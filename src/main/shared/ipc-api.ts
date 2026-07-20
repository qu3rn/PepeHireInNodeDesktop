import type {
  ApplicationAttempt,
  DebugDiagnostics,
  CollectorProgress,
  CollectedUrl,
  CreateOfferInput,
  Offer,
  OfferListQuery,
  PaginatedResult,
  SearchCriteria,
  SearchRun,
  QueueItem,
  QueueListQuery
} from "./types";

export interface JobAssistantApi {
  jobIndex: {
    search(filters: import("../job-index/job-index.types").JobIndexFilters): Promise<import("../job-index/job-index.types").JobIndexSearchResult>;
    collect(criteria: import("../job-index/job-index.types").JobIndexCriteria): Promise<{runIds:string[]}>;
    reindex(options?: import("../job-index/job-index.types").ReindexOptions): Promise<import("../job-index/job-index.types").ReindexSummary>;
    cleanupPreview(options: import("../job-index/job-index.types").CleanupOptions): Promise<import("../job-index/job-index.types").CleanupPreview>;
    cleanupExecute(options: import("../job-index/job-index.types").CleanupExecuteOptions): Promise<import("../job-index/job-index.types").CleanupSummary>;
    recheck(options?: import("../job-index/job-index.types").AvailabilityOptions): Promise<import("../job-index/job-index.types").AvailabilitySummary>;
    updateStatus(offerId:string, status:import("./types").OfferStatus): Promise<Offer>;
  };
  offers: {
    list(query: OfferListQuery): Promise<PaginatedResult<Offer>>;
    get(id: string): Promise<Offer | null>;
    create(input: CreateOfferInput): Promise<Offer>;
    delete(id: string): Promise<void>;
  };
  collection: {
    classifyUrl(input: { source: string; url: string; text?: string }): Promise<{
      classification: string;
      reason: string;
      relevanceScore: number;
      relevanceDecision: "apply" | "maybe" | "skip";
      matchedKeywords: string[];
      negativeKeywords: string[];
    }>;
    saveCollectedUrl(input: Omit<CollectedUrl, "id" | "createdAt" | "updatedAt">): Promise<CollectedUrl>;
  };
  collector: {
    start(criteria: SearchCriteria): Promise<{ runId: string }>;
    getStatus(runId: string): Promise<SearchRun>;
    cancel(runId: string): Promise<{ ok: boolean }>;
    listRuns(): Promise<SearchRun[]>;
    getProgress(runId: string): Promise<CollectorProgress | null>;
  };
  queue: {
    list(query: QueueListQuery): Promise<PaginatedResult<QueueItem>>;
    build(): Promise<{ inserted: number }>;
    getNext(): Promise<QueueItem | null>;
    skip(id: string, reason: string): Promise<void>;
    markSent(id: string): Promise<void>;
  };
  rapidApply: {
    fillItem(id: string): Promise<{ ok: boolean; warning: string }>;
    inspect(offerId: string): Promise<import("./types").RapidApplyPreview>;
    prepare(input: import("./types").RapidApplyInput): Promise<import("./types").RapidApplyPreview>;
    submit(input: import("./types").RapidApplyInput): Promise<import("./types").RapidApplyResult>;
    cancel(attemptId: string): Promise<{ ok: boolean }>;
    getStatus(attemptId: string): Promise<ApplicationAttempt | null>;
    listAttempts(): Promise<ApplicationAttempt[]>;
  };
  debug: {
    getDiagnostics(): Promise<DebugDiagnostics>;
    ping(): Promise<{ ok: boolean; at: string }>;
    clearLogs(): Promise<{ ok: boolean }>;
  };
}

export interface PepeHireApi {
  jobIndex: JobAssistantApi["jobIndex"];
  collector: JobAssistantApi["collector"];
  rapidApply: JobAssistantApi["rapidApply"];
  debug: JobAssistantApi["debug"];
}
