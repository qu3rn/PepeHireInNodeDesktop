import type { AvailabilityState, Offer, OfferSource, OfferStatus, PaginatedResult } from "../shared/types";

export interface JobIndexFilters {
  page?: number; pageSize?: number; search?: string; sources?: OfferSource[]; statuses?: OfferStatus[];
  includeKeywords?: string[]; excludeKeywords?: string[]; requiredTags?: string[]; optionalTags?: string[];
  location?: string; remoteModes?: string[]; contractTypes?: string[]; minimumSalary?: number;
  firstSeenFrom?: string; firstSeenTo?: string; activeOnly?: boolean;
  sortBy?: "relevance" | "firstSeen" | "lastSeen" | "salary" | "title"; sortDirection?: "asc" | "desc";
  showLowRelevance?: boolean;
}
export interface JobIndexCriteria extends Omit<JobIndexFilters, "page" | "pageSize" | "statuses" | "sortBy" | "sortDirection"> {
  sources: Exclude<OfferSource, "manual">[]; phrase: string; titleKeywords?: string[]; pageLimit?: number; resultLimit?: number; searchProfileId?: string;
}
export interface ReindexOptions { offerIds?: string[] }
export interface ReindexSummary { recordsChecked: number; recordsUpdated: number; duplicatesMerged: number; invalidRecordsFound: number; errors: number }
export interface CleanupOptions { markExpiredAfterDays: number; deleteInvalidAfterDays: number; preserveSavedApplied?: boolean; preservePinned?: boolean; checkBrokenUrls?: boolean }
export type CleanupReason = "stale" | "invalid" | "duplicate" | "broken_url" | "missing_required" | "orphaned";
export interface CleanupCandidate { offer: Offer; reasons: CleanupReason[]; suggestedAction: "expire" | "invalidate" | "archive" | "delete"; protected: boolean }
export interface CleanupPreview { checked: number; candidates: CleanupCandidate[]; expired: number; invalid: number; duplicates: number; protected: number }
export interface CleanupExecuteOptions extends CleanupOptions { mode: "mark" | "archive" | "delete"; confirmedPermanentDelete?: boolean }
export interface CleanupSummary { checked: number; markedExpired: number; markedInvalid: number; archived: number; deleted: number; protected: number; errors: number }
export interface AvailabilityOptions { offerIds?: string[]; limit?: number }
export interface AvailabilitySummary { checked: number; active: number; expired: number; unavailable: number; redirected: number; unknown: number; errors: number }
export interface OfferChange { id: string; offerId: string; field: string; oldValue: string | null; newValue: string | null; detectedAt: string }
export interface JobIndexProgress { operation: "collect" | "reindex" | "cleanup" | "recheck"; current: number; total: number; message: string }
export type JobIndexSearchResult = PaginatedResult<Offer>;
export interface AvailabilityResult { state: AvailabilityState; finalUrl?: string }
