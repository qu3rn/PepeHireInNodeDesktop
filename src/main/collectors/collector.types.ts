import type { BrowserContext, Page } from "playwright";
import type { CollectedOffer, SearchCriteria } from "../shared/types";

export interface CollectorContext {
  criteria: SearchCriteria;
  context: BrowserContext;
  page: Page;
  isCancelled(): boolean;
}

export interface PortalCollector {
  readonly source: SearchCriteria["source"];
  collect(ctx: CollectorContext): Promise<CollectedOffer[]>;
}
