import type { Offer } from "../shared/types";
import { createOfferFingerprint, normalizeOfferUrl } from "./fingerprint";
export function findDuplicate(candidate: Pick<Offer,"source"|"sourceId"|"url"|"title"|"company"|"location">, offers: Offer[]): Offer | null {
  return offers.find(x => Boolean(candidate.sourceId) && x.source === candidate.source && x.sourceId === candidate.sourceId) ?? offers.find(x=>normalizeOfferUrl(x.url)===normalizeOfferUrl(candidate.url)) ?? offers.find(x=>createOfferFingerprint(x.title,x.company,x.location)===createOfferFingerprint(candidate.title,candidate.company,candidate.location)) ?? null;
}
