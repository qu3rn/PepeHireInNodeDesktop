export type Decision = "apply" | "maybe" | "skip";
export type OfferSource = "manual" | "pracuj" | "justjoinit" | "rocketjobs" | "nofluffjobs";
export type SearchRunStatus = "running" | "completed" | "cancelled" | "failed";

export interface Offer {
  id: string;
  source: string;
  sourceId: string | null;
  url: string;
  title: string | null;
  company: string | null;
  location: string | null;
  remoteMode: string | null;
  contractType: string | null;
  publicationDate: string | null;
  salaryRaw: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  salaryMonthlyMin: number | null;
  salaryMonthlyMax: number | null;
  technologies: string[];
  description: string | null;
  score: number | null;
  decision: Decision | null;
  reasons: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OfferListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  decision?: Decision;
}

export interface CreateOfferInput {
  source: string;
  sourceId?: string | null;
  url: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  remoteMode?: string | null;
  contractType?: string | null;
  publicationDate?: string | null;
  salaryRaw?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  salaryMonthlyMin?: number | null;
  salaryMonthlyMax?: number | null;
  technologies?: string[];
  description?: string | null;
  score?: number | null;
  decision?: Decision | null;
  reasons?: string[];
}

export interface UpdateOfferInput {
  sourceId?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  remoteMode?: string | null;
  contractType?: string | null;
  publicationDate?: string | null;
  salaryRaw?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  salaryMonthlyMin?: number | null;
  salaryMonthlyMax?: number | null;
  technologies?: string[];
  description?: string | null;
  score?: number | null;
  decision?: Decision | null;
  reasons?: string[];
}

export interface QueueItem {
  id: string;
  offerId: string;
  status: "pending" | "sent" | "skipped";
  priorityScore: number;
  reasons: string[];
  skipReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueueListQuery {
  page?: number;
  pageSize?: number;
  status?: QueueItem["status"];
}

export interface CollectedUrl {
  id: string;
  source: string;
  url: string;
  classification: "job_offer" | "listing" | "unknown";
  classificationReason: string;
  relevanceScore: number | null;
  relevanceDecision: Decision | null;
  matchedKeywords: string[];
  negativeKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchCriteria {
  source: Exclude<OfferSource, "manual">;
  phrase: string;
  location?: string;
  remoteOnly?: boolean;
  pageLimit?: number;
  resultLimit?: number;
}

export interface CollectedOffer {
  source: OfferSource;
  sourceId?: string | null;
  url: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  remoteMode?: string | null;
  technologies?: string[];
  contractType?: string | null;
  salaryRaw?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  shortDescription?: string | null;
  publicationDate?: string | null;
}

export interface SearchRun {
  id: string;
  source: OfferSource;
  startedAt: string;
  finishedAt: string | null;
  status: SearchRunStatus;
  collectedCount: number;
  savedCount: number;
  skippedCount: number;
  failedCount: number;
  errorSummary: string | null;
  message: string | null;
}

export interface CollectorProgress {
  runId: string;
  source: OfferSource;
  currentPortal: string;
  currentPage: number;
  offersFound: number;
  offersSaved: number;
  status: SearchRunStatus;
  message: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BulkDeleteResult {
  deletedCount: number;
}
