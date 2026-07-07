import type { Offer, RapidApplyField, RapidApplyInput, RapidApplyPreview, RapidApplyResult } from "../../shared/types";
import type { BrowserService } from "../../collectors/browser.service";
import type { RapidApplyAdapter } from "../rapid-apply.types";

async function inspectFields(browserService: BrowserService, offer: Offer): Promise<RapidApplyField[]> {
  const context = await browserService.createContext();
  const page = await context.newPage();

  try {
    await page.goto(offer.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(500);

    return await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input, textarea, select"));
      return inputs
        .map((input, index) => {
          const html = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          const id = html.getAttribute("id");
          const name = html.getAttribute("name") || "";
          const label = (id ? document.querySelector(`label[for='${id}']`) : null)?.textContent?.trim() || name || `field_${index + 1}`;
          const required = html.hasAttribute("required") || html.getAttribute("aria-required") === "true";
          const tag = html.tagName.toLowerCase();
          let type: RapidApplyField["type"] = "unknown";

          if (tag === "textarea") type = "textarea";
          if (tag === "select") type = "select";
          if (tag === "input") {
            const rawType = (html as HTMLInputElement).type || "text";
            if (rawType === "text") type = "text";
            if (rawType === "email") type = "email";
            if (rawType === "tel") type = "phone";
            if (rawType === "file") type = "file";
            if (rawType === "radio") type = "radio";
            if (rawType === "checkbox") type = "checkbox";
          }

          const options = tag === "select" ? Array.from((html as HTMLSelectElement).options).map((o) => o.textContent || "") : undefined;

          return {
            key: name || id || `field_${index + 1}`,
            label,
            type,
            required,
            options
          };
        })
        .filter((x) => x.type !== "unknown");
    });
  } finally {
    await page.close();
    await context.close();
  }
}

function mapCandidateValue(input: RapidApplyInput, field: RapidApplyField): string | boolean | null {
  const label = field.label.toLowerCase();
  const key = field.key.toLowerCase();

  if (field.type === "email" || label.includes("mail") || key.includes("mail")) return input.candidate.email ?? null;
  if (field.type === "phone" || label.includes("telefon") || key.includes("phone")) return input.candidate.phone ?? null;
  if (field.type === "file") return input.candidate.cvFilePath ?? null;
  if (label.includes("imi") || label.includes("name") || key.includes("name")) return input.candidate.fullName ?? null;
  if (label.includes("salary") || label.includes("wynagrod")) return input.candidate.expectedSalary ?? null;
  if (label.includes("notice") || label.includes("okres wypowied")) return input.candidate.noticePeriod ?? null;
  if (field.type === "checkbox") return input.candidate.consent ?? false;
  if (label.includes("cover") || label.includes("list motyw")) return input.candidate.coverLetter ?? null;
  return null;
}

export class PracujRapidApplyAdapter implements RapidApplyAdapter {
  source = "pracuj" as const;

  constructor(private readonly browserService: BrowserService) {}

  canApply(offer: Offer): boolean {
    return offer.source === "pracuj" && offer.url.includes("pracuj");
  }

  async prepare(input: RapidApplyInput & { offer: Offer }): Promise<RapidApplyPreview> {
    const fieldsDetected = await inspectFields(this.browserService, input.offer);
    const fieldsMapped = fieldsDetected
      .filter((field) => mapCandidateValue(input, field) !== null)
      .map((field) => field.key);
    const missingRequired = fieldsDetected
      .filter((field) => field.required && mapCandidateValue(input, field) === null)
      .map((field) => field.label);

    return {
      attemptId: input.attemptId ?? "",
      offerId: input.offerId,
      source: "pracuj",
      compatible: true,
      fieldsDetected,
      fieldsMapped,
      missingRequired,
      warnings: missingRequired.length > 0 ? ["Some required fields are missing"] : [],
      manualActionRequired: false
    };
  }

  async apply(input: RapidApplyInput & { offer: Offer; preview: RapidApplyPreview }): Promise<RapidApplyResult> {
    const fieldsFilled = input.preview.fieldsDetected
      .filter((field) => mapCandidateValue(input, field) !== null)
      .map((field) => field.key);

    const fieldsSkipped = input.preview.fieldsDetected
      .filter((field) => mapCandidateValue(input, field) === null)
      .map((field) => field.key);

    return {
      attemptId: input.attemptId ?? "",
      status: "manual_action_required",
      submitted: false,
      manualActionRequired: true,
      message: "Form values prepared. Final submit must be completed manually.",
      fieldsFilled,
      fieldsSkipped,
      screenshotPath: null,
      debugLogPath: null
    };
  }
}
