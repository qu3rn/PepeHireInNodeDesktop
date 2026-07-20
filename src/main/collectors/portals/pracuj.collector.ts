import type { CollectedOffer } from "../../shared/types";
import type { CollectorContext, PortalCollector } from "../collector.types";
import { extractPracujListings } from "./pracuj.extractor";
import { mapPracujListing } from "./pracuj.mapper";

export class PracujCollector implements PortalCollector {
  readonly source = "pracuj" as const;

  async collect(ctx: CollectorContext): Promise<CollectedOffer[]> {
    const results: CollectedOffer[] = [];
    const pageLimit = Math.min(ctx.criteria.pageLimit ?? 3, 10);
    const resultLimit = Math.min(ctx.criteria.resultLimit ?? 60, 120);

    for (let pageIndex = 1; pageIndex <= pageLimit; pageIndex += 1) {
      if (ctx.isCancelled() || results.length >= resultLimit) {
        break;
      }

      const searchUrl = this.buildSearchUrl(ctx.criteria.phrase, ctx.criteria.location, pageIndex, Boolean(ctx.criteria.remoteOnly));
      await ctx.page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
      await ctx.page.waitForTimeout(600);

      const listings = await extractPracujListings(ctx.page);
      const mapped = listings.map(mapPracujListing).filter((x): x is CollectedOffer => x !== null);
      for (const item of mapped) {
        if (results.length >= resultLimit) {
          break;
        }

        if (!results.some((existing) => existing.url === item.url)) {
          results.push(item);
        }
      }

      if (listings.length === 0) {
        break;
      }
    }

    return results;
  }

  private buildSearchUrl(phrase: string, location: string | undefined, page: number, remoteOnly: boolean): string {
    const params = new URLSearchParams();
    params.set("pn", String(page));

    if (phrase.trim().length > 0) {
      params.set("q", phrase.trim());
    }

    if (location && location.trim().length > 0) {
      params.set("l", location.trim());
    }

    if (remoteOnly) {
      params.set("rd", "30");
      params.set("ws", "remote");
    }

    return `https://it.pracuj.pl/praca?${params.toString()}`;
  }

}
