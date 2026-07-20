import type { Offer } from "../shared/types";
export const isProtectedOffer = (offer: Offer, preserveSavedApplied = true, preservePinned = true): boolean => (preserveSavedApplied && ["saved","applied"].includes(offer.status)) || (preservePinned && offer.pinned);
