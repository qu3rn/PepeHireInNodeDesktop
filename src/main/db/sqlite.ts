import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { App } from "electron";
import { applicationAttemptsTable, applyQueueItemsTable, collectedUrlsTable, collectionRunsTable, offersTable } from "./schema";

const schema = {
  offersTable,
  collectedUrlsTable,
  applyQueueItemsTable,
  collectionRunsTable,
  applicationAttemptsTable
};

export type AppDb = BetterSQLite3Database<typeof schema>;

export interface DbContext {
  sqlite: Database.Database;
  db: AppDb;
}

export function resolveDbPath(app?: App): string {
  if (process.env.PEPE_DB_PATH) {
    return process.env.PEPE_DB_PATH;
  }

  if (process.env.NODE_ENV === "development") {
    return path.resolve(process.cwd(), "data", "app.db");
  }

  if (app) {
    return path.join(app.getPath("userData"), "app.db");
  }

  return path.resolve(process.cwd(), "data", "app.db");
}

export function initSqlite(dbPath: string): DbContext {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      source_id TEXT,
      url TEXT UNIQUE NOT NULL,
      title TEXT,
      company TEXT,
      location TEXT,
      remote_mode TEXT,
      contract_type TEXT,
      publication_date TEXT,
      salary_raw TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      salary_currency TEXT,
      salary_period TEXT,
      salary_monthly_min INTEGER,
      salary_monthly_max INTEGER,
      technologies_json TEXT NOT NULL DEFAULT '[]',
      description TEXT,
      score INTEGER,
      decision TEXT,
      reasons_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collected_urls (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      classification TEXT NOT NULL,
      classification_reason TEXT NOT NULL,
      relevance_score INTEGER,
      relevance_decision TEXT,
      matched_keywords_json TEXT NOT NULL DEFAULT '[]',
      negative_keywords_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS apply_queue_items (
      id TEXT PRIMARY KEY,
      offer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      priority_score REAL NOT NULL DEFAULT 0,
      reasons_json TEXT NOT NULL DEFAULT '[]',
      skip_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collection_runs (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      collected_count INTEGER NOT NULL DEFAULT 0,
      saved_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      error_summary TEXT,
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS application_attempts (
      id TEXT PRIMARY KEY,
      offer_id TEXT NOT NULL,
      source TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      fields_detected_json TEXT NOT NULL DEFAULT '[]',
      fields_filled_json TEXT NOT NULL DEFAULT '[]',
      fields_skipped_json TEXT NOT NULL DEFAULT '[]',
      manual_action_required INTEGER NOT NULL DEFAULT 0,
      submitted INTEGER NOT NULL DEFAULT 0,
      error_summary TEXT,
      screenshot_path TEXT,
      debug_log_path TEXT,
      logs_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    );
  `);

  const addColumnSafely = (statement: string): void => {
    try {
      sqlite.exec(statement);
    } catch {
      // Column already exists in dev DB. This keeps MVP migrations simple.
    }
  };

  addColumnSafely("ALTER TABLE offers ADD COLUMN source_id TEXT;");
  addColumnSafely("ALTER TABLE offers ADD COLUMN remote_mode TEXT;");
  addColumnSafely("ALTER TABLE offers ADD COLUMN contract_type TEXT;");
  addColumnSafely("ALTER TABLE offers ADD COLUMN publication_date TEXT;");

  return {
    sqlite,
    db: drizzle(sqlite, { schema })
  };
}
