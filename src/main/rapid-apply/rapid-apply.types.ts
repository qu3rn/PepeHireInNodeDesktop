import type { Offer } from "../shared/types";
import type { RapidApplyInput, RapidApplyPreview, RapidApplyResult, OfferSource } from "../shared/types";

export interface RapidApplyAdapter {
  source: OfferSource;
  canApply(offer: Offer): boolean;
  prepare(input: RapidApplyInput & { offer: Offer }): Promise<RapidApplyPreview>;
  apply(input: RapidApplyInput & { offer: Offer; preview: RapidApplyPreview }): Promise<RapidApplyResult>;
}
