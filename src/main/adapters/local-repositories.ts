import type { Repositories } from "./repositories";
import type { DbContext } from "../db/sqlite";
import { OffersSqliteRepository } from "../repositories/offers.sqlite-repo";
import { QueueSqliteRepository } from "../repositories/queue.sqlite-repo";
import { CollectedUrlsSqliteRepository } from "../repositories/collected-urls.sqlite-repo";
import { SearchRunsSqliteRepository } from "../repositories/search-runs.sqlite-repo";
import { ApplicationAttemptsSqliteRepository } from "../repositories/application-attempts.sqlite-repo";

export function createLocalRepositories(dbContext: DbContext): Repositories {
  return {
    offers: new OffersSqliteRepository(dbContext.db),
    queue: new QueueSqliteRepository(dbContext.db),
    collectedUrls: new CollectedUrlsSqliteRepository(dbContext.db),
    searchRuns: new SearchRunsSqliteRepository(dbContext.db),
    applicationAttempts: new ApplicationAttemptsSqliteRepository(dbContext.db)
  };
}
