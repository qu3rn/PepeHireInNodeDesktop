import type { Page } from "playwright";
import type { RawOfferListingItem } from "../raw-offer.types";
import { PRACUJ_SELECTORS } from "./pracuj.selectors";

export async function extractPracujListings(page: Page): Promise<RawOfferListingItem[]> {
  return page.evaluate((s) => Array.from(document.querySelectorAll(s.card)).map(card => {
    const text = (selector: string) => card.querySelector(selector)?.textContent ?? null;
    const url = (card.querySelector(s.link) as HTMLAnchorElement | null)?.href ?? null;
    const warnings: RawOfferListingItem["warnings"] = [];
    if (!url) warnings.push({ code:"missing_element", field:"url", message:`Missing ${s.link}` });
    if (!text(s.title)) warnings.push({ code:"missing_element", field:"title", message:`Missing ${s.title}` });
    return { sourceId:url?.match(/\/oferta\/[^,]+,([^?/#]+)/)?.[1] ?? null, url, title:text(s.title), company:text(s.company), location:text(s.location), salaryRaw:text(s.salary), shortDescription:text(s.description), publicationDate:card.querySelector(s.publicationDate)?.getAttribute("datetime") ?? null, warnings };
  }), PRACUJ_SELECTORS);
}
