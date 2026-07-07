import type { Offer, RapidApplyInput, RapidApplyPreview, RapidApplyResult } from "../../shared/types";
import type { RapidApplyAdapter } from "../rapid-apply.types";

export class JustJoinItRapidApplyAdapter implements RapidApplyAdapter {
  source = "justjoinit" as const;

  canApply(offer: Offer): boolean {
    return offer.source === "justjoinit" && offer.url.includes("justjoin");
  }

  async prepare(input: RapidApplyInput & { offer: Offer }): Promise<RapidApplyPreview> {
    return {
      attemptId: input.attemptId ?? "",
      offerId: input.offerId,
      source: "justjoinit",
      compatible: true,
      fieldsDetected: [],
      fieldsMapped: [],
      missingRequired: [],
      warnings: ["JustJoinIt adapter is in safe mode; use manual session for final actions."],
      manualActionRequired: true
    };
  }

  async apply(input: RapidApplyInput & { offer: Offer; preview: RapidApplyPreview }): Promise<RapidApplyResult> {
    return {
      attemptId: input.attemptId ?? "",
      status: "manual_action_required",
      submitted: false,
      manualActionRequired: true,
      message: "Manual action required for JustJoinIt flow.",
      fieldsFilled: [],
      fieldsSkipped: input.preview.fieldsDetected.map((x) => x.key),
      screenshotPath: null,
      debugLogPath: null
    };
  }
}
