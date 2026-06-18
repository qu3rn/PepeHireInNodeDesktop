import { describe, expect, it } from "vitest";
import { classifyUrl } from "../src/main/services/url-classifier";

describe("classifyUrl", () => {
  it("classifies pracuj offer url", () => {
    const result = classifyUrl("pracuj", "https://www.pracuj.pl/praca/react-dev,oferta,123");
    expect(result.classification).toBe("job_offer");
  });

  it("classifies justjoin listing", () => {
    const result = classifyUrl("justjoin", "https://justjoin.it/job-offers/warszawa/frontend");
    expect(result.classification).toBe("listing");
  });

  it("returns unknown for unmatched", () => {
    const result = classifyUrl("pracuj", "https://example.com");
    expect(result.classification).toBe("unknown");
  });
});
