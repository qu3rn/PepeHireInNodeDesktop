export type Decision = "apply" | "maybe" | "skip";
export type OfferStatus =
  | "new"
  | "seen"
  | "saved"
  | "applied"
  | "ignored"
  | "low_relevance"
  | "expired"
  | "invalid";
export type ProfileRelevanceDecision = "match" | "low_relevance" | "excluded";
export type AvailabilityState =
  | "active"
  | "expired"
  | "unavailable"
  | "redirected"
  | "unknown";
export type OfferSource =
  | "manual"
  | "pracuj"
  | "justjoinit"
  | "rocketjobs"
  | "nofluffjobs";
export type SearchRunStatus = "running" | "completed" | "cancelled" | "failed";
export type RapidApplyStatus =
  | "created"
  | "inspecting"
  | "prepared"
  | "submitting"
  | "manual_action_required"
  | "submitted"
  | "failed"
  | "cancelled";

export interface Offer {
  id: string;
  source: string;
  sourceId: string | null;
  url: string;
  normalizedUrl: string;
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
  status: OfferStatus;
  relevanceScore: number | null;
  relevanceDecision: ProfileRelevanceDecision | null;
  searchProfileId: string | null;
  fingerprint: string;
  searchableText: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastCheckedAt: string | null;
  availability: AvailabilityState;
  changedAt: string | null;
  pinned: boolean;
  notes: string | null;
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
  normalizedUrl?: string;
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
  status?: OfferStatus;
  relevanceScore?: number | null;
  relevanceDecision?: ProfileRelevanceDecision | null;
  searchProfileId?: string | null;
  fingerprint?: string;
  searchableText?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastCheckedAt?: string | null;
  availability?: AvailabilityState;
  changedAt?: string | null;
  pinned?: boolean;
  notes?: string | null;
}

export interface UpdateOfferInput {
  url?: string;
  normalizedUrl?: string;
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
  status?: OfferStatus;
  relevanceScore?: number | null;
  relevanceDecision?: ProfileRelevanceDecision | null;
  searchProfileId?: string | null;
  fingerprint?: string;
  searchableText?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastCheckedAt?: string | null;
  availability?: AvailabilityState;
  changedAt?: string | null;
  pinned?: boolean;
  notes?: string | null;
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
  searchProfile?: import("../job-index/search-profile").SearchProfile;
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

export interface CandidateProfile {
  fullName?: string;
  email?: string;
  phone?: string;
  cvFilePath?: string;
  coverLetter?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  consent?: boolean;
}

export interface RapidApplyField {
  key: string;
  label: string;
  type:
    | "text"
    | "email"
    | "phone"
    | "file"
    | "textarea"
    | "select"
    | "radio"
    | "checkbox"
    | "unknown";
  required: boolean;
  options?: string[];
}

export interface RapidApplyInput {
  offerId: string;
  attemptId?: string;
  candidate: CandidateProfile;
  confirmationChecked?: boolean;
}

export interface RapidApplyPreview {
  attemptId: string;
  offerId: string;
  source: OfferSource;
  compatible: boolean;
  fieldsDetected: RapidApplyField[];
  fieldsMapped: string[];
  missingRequired: string[];
  warnings: string[];
  manualActionRequired: boolean;
}

export interface RapidApplyResult {
  attemptId: string;
  status: RapidApplyStatus;
  submitted: boolean;
  manualActionRequired: boolean;
  message: string;
  fieldsFilled: string[];
  fieldsSkipped: string[];
  screenshotPath?: string | null;
  debugLogPath?: string | null;
}

export interface ApplicationAttempt {
  id: string;
  offerId: string;
  source: OfferSource;
  startedAt: string;
  finishedAt: string | null;
  status: RapidApplyStatus;
  fieldsDetected: RapidApplyField[];
  fieldsFilled: string[];
  fieldsSkipped: string[];
  manualActionRequired: boolean;
  submitted: boolean;
  errorSummary: string | null;
  screenshotPath: string | null;
  debugLogPath: string | null;
  logs: string[];
  updatedAt: string;
}

export interface AppError {
  code:
    | "UNSUPPORTED_PORTAL"
    | "MISSING_CV"
    | "REQUIRED_FIELD_UNAVAILABLE"
    | "SELECTOR_CHANGED"
    | "BROWSER_LAUNCH_FAILURE"
    | "NAVIGATION_TIMEOUT"
    | "BLOCKED_PAGE"
    | "CAPTCHA_MANUAL_ACTION_REQUIRED"
    | "SUBMISSION_RESULT_UNKNOWN"
    | "REPOSITORY_FAILURE"
    | "INVALID_CANDIDATE_PROFILE";
  message: string;
  recoverable: boolean;
  details?: string;
}

export interface DebugDiagnostics {
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  chromiumVersion: string;
  isPackaged: boolean;
  dbPath: string;
  dataDir: string;
  logPath: string;
  registeredIpcChannels: string[];
  activeCollectorRuns: number;
  activeRapidApplySessions: number;
  recentApplicationAttempts: ApplicationAttempt[];
  recentErrors: string[];
  browserStatus: "idle" | "busy";
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
