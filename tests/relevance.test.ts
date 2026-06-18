import { describe, expect, it } from "vitest";
import { matchRelevance } from "../src/main/services/relevance.service";

describe("matchRelevance", () => {
  it("scores React frontend role high", () => {
    const result = matchRelevance({
      title: "React Frontend Engineer",
      description: "TypeScript and Next.js",
      technologies: ["React", "TypeScript"]
    });

    expect(result.relevanceScore).toBeGreaterThanOrEqual(70);
    expect(result.relevanceDecision).toBe("apply");
  });

  it("penalizes negative roles", () => {
    const result = matchRelevance({
      title: "Sprzedawca WordPress",
      description: "Call center",
      technologies: []
    });

    expect(result.relevanceDecision).toBe("skip");
    expect(result.negativeKeywords.length).toBeGreaterThan(0);
  });
});
