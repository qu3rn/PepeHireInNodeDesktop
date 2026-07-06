import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const offersTable = sqliteTable("offers", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  sourceId: text("source_id"),
  url: text("url").notNull().unique(),
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
