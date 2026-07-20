import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const offersTable = sqliteTable("offers", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  sourceId: text("source_id"),
  url: text("url").notNull().unique(),
  normalizedUrl: text("normalized_url"),
  title: text("title"),
  company: text("company"),
  location: text("location"),
  remoteMode: text("remote_mode"),
  contractType: text("contract_type"),
  publicationDate: text("publication_date"),
  salaryRaw: text("salary_raw"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency"),
  salaryPeriod: text("salary_period"),
  salaryMonthlyMin: integer("salary_monthly_min"),
  salaryMonthlyMax: integer("salary_monthly_max"),
  technologiesJson: text("technologies_json").notNull().default("[]"),
  description: text("description"),
  score: integer("score"),
  decision: text("decision"),
  reasonsJson: text("reasons_json").notNull().default("[]"),
  status: text("status").notNull().default("new"),
  relevanceScore: integer("relevance_score"),
  fingerprint: text("fingerprint"),
  searchableText: text("searchable_text").notNull().default(""),
  firstSeenAt: text("first_seen_at"),
  lastSeenAt: text("last_seen_at"),
  lastCheckedAt: text("last_checked_at"),
  availability: text("availability").notNull().default("unknown"),
  changedAt: text("changed_at"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const collectedUrlsTable = sqliteTable("collected_urls", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  url: text("url").notNull().unique(),
  classification: text("classification").notNull(),
  classificationReason: text("classification_reason").notNull(),
  relevanceScore: integer("relevance_score"),
  relevanceDecision: text("relevance_decision"),
  matchedKeywordsJson: text("matched_keywords_json").notNull().default("[]"),
  negativeKeywordsJson: text("negative_keywords_json").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const applyQueueItemsTable = sqliteTable("apply_queue_items", {
  id: text("id").primaryKey(),
  offerId: text("offer_id").notNull(),
  status: text("status").notNull(),
  priorityScore: real("priority_score").notNull().default(0),
  reasonsJson: text("reasons_json").notNull().default("[]"),
  skipReason: text("skip_reason"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const collectionRunsTable = sqliteTable("collection_runs", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  status: text("status").notNull(),
  collectedCount: integer("collected_count").notNull().default(0),
  savedCount: integer("saved_count").notNull().default(0),
  skippedCount: integer("skipped_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  errorSummary: text("error_summary"),
  message: text("message")
});

export const applicationAttemptsTable = sqliteTable("application_attempts", {
  id: text("id").primaryKey(),
  offerId: text("offer_id").notNull(),
  source: text("source").notNull(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  status: text("status").notNull(),
  fieldsDetectedJson: text("fields_detected_json").notNull().default("[]"),
  fieldsFilledJson: text("fields_filled_json").notNull().default("[]"),
  fieldsSkippedJson: text("fields_skipped_json").notNull().default("[]"),
  manualActionRequired: integer("manual_action_required", { mode: "boolean" }).notNull().default(false),
  submitted: integer("submitted", { mode: "boolean" }).notNull().default(false),
  errorSummary: text("error_summary"),
  screenshotPath: text("screenshot_path"),
  debugLogPath: text("debug_log_path"),
  logsJson: text("logs_json").notNull().default("[]"),
  updatedAt: text("updated_at").notNull()
});

export const offerChangesTable = sqliteTable("offer_changes", {
  id: text("id").primaryKey(), offerId: text("offer_id").notNull(), field: text("field").notNull(),
  oldValue: text("old_value"), newValue: text("new_value"), detectedAt: text("detected_at").notNull()
});
