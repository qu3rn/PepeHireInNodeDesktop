import type { Repositories } from "./repositories";
import type { DbContext } from "../db/sqlite";
import { OffersSqliteRepository } from "../repositories/offers.sqlite-repo";
import { QueueSqliteRepository } from "../repositories/queue.sqlite-repo";
import { CollectedUrlsSqliteRepository } from "../repositories/collected-urls.sqlite-repo";

export function createLocalRepositories(dbContext: DbContext): Repositories {
  return {
    offers: new OffersSqliteRepository(dbContext.db),
    queue: new QueueSqliteRepository(dbContext.db),
    collectedUrls: new CollectedUrlsSqliteRepository(dbContext.db)
  };
}
