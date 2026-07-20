import type { OfferRepository } from "../adapters/repositories";
import type { BrowserService } from "../collectors/browser.service";
import type { Offer } from "../shared/types";
import type { AvailabilityOptions, AvailabilitySummary } from "./job-index.types";

export class AvailabilityService {
  constructor(private browser: BrowserService, private offers: OfferRepository) {}
  async recheck(all: Offer[], options: AvailabilityOptions): Promise<AvailabilitySummary> {
    const summary: AvailabilitySummary = { checked:0, active:0, expired:0, unavailable:0, redirected:0, unknown:0, errors:0 };
    const selected = all.filter(o=>!options.offerIds?.length || options.offerIds.includes(o.id)).slice(0, options.limit ?? 100);
    let context: Awaited<ReturnType<BrowserService["createContext"]>> | null = null;
    try { context = await this.browser.createContext(); for (const offer of selected) { let page; try { page = await context.newPage(); const response = await page.goto(offer.url, { waitUntil:"domcontentloaded", timeout:30000 }); const finalUrl = page.url(); const body = (await page.locator("body").innerText({ timeout:5000 })).toLowerCase(); let state: Offer["availability"] = "active"; if (!response || response.status() >= 500) state="unknown"; else if (response.status() === 404 || /oferta (wygasła|nieaktualna)|offer (expired|unavailable)|nie znaleziono oferty/.test(body)) state="expired"; else if (response.status() >= 400) state="unavailable"; else if (finalUrl !== offer.url && new URL(finalUrl).pathname !== new URL(offer.url).pathname) state="redirected"; await this.offers.update(offer.id, { lastCheckedAt:new Date().toISOString(), availability:state, status: state === "expired" || state === "unavailable" ? (offer.status === "saved" || offer.status === "applied" ? offer.status : "expired") : offer.status }); summary[state]++; summary.checked++; } catch { summary.errors++; summary.unknown++; summary.checked++; await this.offers.update(offer.id, { lastCheckedAt:new Date().toISOString(), availability:"unknown" }).catch(()=>undefined); } finally { await page?.close().catch(()=>undefined); } } } finally { await context?.close().catch(()=>undefined); }
    return summary;
  }
}
