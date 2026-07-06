import type { CollectedOffer } from "../../shared/types";
import type { CollectorContext, PortalCollector } from "../collector.types";

interface PracujListing {
  sourceId: string | null;
  url: string;
  title: string | null;
  company: string | null;
  location: string | null;
  salaryRaw: string | null;
  shortDescription: string | null;
  publicationDate: string | null;
}

function normalizeText(value: string | null | undefined): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function toAbsoluteUrl(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  return `https://it.pracuj.pl${href.startsWith("/") ? href : `/${href}`}`;
}

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

      const listings = await ctx.page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("[data-test='default-offer']"));
        return cards
          .map((card) => {
            const anchor = card.querySelector("a[data-test='link-offer']") as HTMLAnchorElement | null;
            const url = anchor?.href;
            if (!url) {
              return null;
            }

            const title = card.querySelector("h2")?.textContent ?? null;
            const company = card.querySelector("[data-test='text-company-name']")?.textContent ?? null;
            const location = card.querySelector("[data-test='offer-badge-description']")?.textContent ?? null;
            const salaryRaw = card.querySelector("[data-test='offer-salary']")?.textContent ?? null;
            const shortDescription = card.querySelector("[data-test='section-benefit']")?.textContent ?? null;
            const publicationDate = card.querySelector("time")?.getAttribute("datetime") ?? null;

            const sourceId = url.match(/\/oferta\/[^,]+,([^?/#]+)/)?.[1] ?? null;

            return {
              sourceId,
              url,
              title,
              company,
              location,
              salaryRaw,
              shortDescription,
              publicationDate
            };
          })
          .filter((x): x is {
            sourceId: string | null;
            url: string;
            title: string | null;
            company: string | null;
            location: string | null;
            salaryRaw: string | null;
            shortDescription: string | null;
            publicationDate: string | null;
          } => x !== null);
      });

      const mapped = listings.map((listing) => this.mapListing(listing));
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

  private mapListing(listing: PracujListing): CollectedOffer {
    return {
      source: "pracuj",
      sourceId: listing.sourceId,
      url: toAbsoluteUrl(listing.url),
      title: normalizeText(listing.title),
      company: normalizeText(listing.company),
      location: normalizeText(listing.location),
      remoteMode: null,
      technologies: [],
      contractType: null,
      salaryRaw: normalizeText(listing.salaryRaw),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      shortDescription: normalizeText(listing.shortDescription),
      publicationDate: normalizeText(listing.publicationDate)
    };
  }
}
