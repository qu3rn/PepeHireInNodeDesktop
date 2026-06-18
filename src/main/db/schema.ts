import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const offersTable = sqliteTable("offers", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  url: text("url").notNull().unique(),
  title: text("title"),
  company: text("company"),
  location: text("location"),
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
