import type { CollectedOffer } from "../../shared/types";
import type { RawOfferListingItem } from "../raw-offer.types";
const clean = (x?: string | null) => x?.replace(/\s+/g," ").trim() || null;
export function mapPracujListing(raw: RawOfferListingItem): CollectedOffer | null {
  if (!raw.url) return null;
  return { source:"pracuj", sourceId:clean(raw.sourceId), url:raw.url.startsWith("http") ? raw.url : `https://it.pracuj.pl${raw.url.startsWith("/")?raw.url:`/${raw.url}`}`, title:clean(raw.title), company:clean(raw.company), location:clean(raw.location), remoteMode:clean(raw.remoteMode), technologies:raw.technologies ?? [], contractType:clean(raw.contractType), salaryRaw:clean(raw.salaryRaw), salaryMin:null, salaryMax:null, salaryCurrency:null, shortDescription:clean(raw.shortDescription), publicationDate:clean(raw.publicationDate) };
}
