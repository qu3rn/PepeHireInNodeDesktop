import { describe, expect, it } from "vitest";
import { scoreOffer } from "../src/main/services/scoring.service";

describe("scoreOffer", () => {
  it("returns apply for strong React+TS with salary", () => {
    const result = scoreOffer({
      title: "Senior React Frontend Engineer",
      description: "React TypeScript Next.js Node.js",
      technologies: ["React", "TypeScript"],
      salaryMonthlyMin: 16000,
      salaryRaw: "16 000 PLN"
    });

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.decision).toBe("apply");
  });

  it("returns skip for obvious non-IT role", () => {
    const result = scoreOffer({
      title: "Kierowca magazynier",
      description: "Praca fizyczna",
      technologies: [],
      salaryMonthlyMin: null,
      salaryRaw: null
    });

    expect(result.decision).toBe("skip");
    expect(result.score).toBe(0);
  });
});
