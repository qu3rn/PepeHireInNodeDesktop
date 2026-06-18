export type Decision = "apply" | "maybe" | "skip";

export interface Offer {
  id: string;
  source: string;
  url: string;
  title: string | null;
  company: string | null;
  location: string | null;
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
  url: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  salaryRaw?: string | null;
  technologies?: string[];
  description?: string | null;
  score?: number | null;
  decision?: Decision | null;
  reasons?: string[];
}

export interface UpdateOfferInput {
  title?: string | null;
  company?: string | null;
  location?: string | null;
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
