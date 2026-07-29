import { describe, expect, it } from "vitest";
import {
  FRONTEND_REACT_PROFILE,
  scoreOfferForProfile
} from "../src/main/job-index/search-profile";

const score = (title: string, technologies: string[] = [], description = "") =>
  scoreOfferForProfile(
    { title, technologies, description },
    FRONTEND_REACT_PROFILE
  );

describe("scoreOfferForProfile", () => {
  it("matches a React Frontend offer", () =>
    expect(score("React Frontend Developer").decision).toBe("match"));
  it("matches a Frontend TypeScript React offer", () =>
    expect(score("Frontend Engineer", ["TypeScript", "React"]).decision).toBe(
      "match"
    ));
  it("excludes a Java Spring Backend offer", () =>
    expect(score("Java Developer", ["Spring"], "Backend Java").decision).toBe(
      "excluded"
    ));
  it("excludes an AI/ML Engineer offer", () =>
    expect(score("AI Engineer", ["Machine Learning"]).decision).toBe(
      "excluded"
    ));
  it("does not exclude Node.js used as frontend tooling", () =>
    expect(
      score(
        "React Frontend Engineer",
        ["React", "TypeScript", "Node.js"],
        "Node.js powers local build tooling"
      ).decision
    ).toBe("match"));
  it("makes a Backend Node.js Developer non-matching", () =>
    expect(["low_relevance", "excluded"]).toContain(
      score("Backend Node.js Developer", ["Node.js"]).decision
    ));
  it("excludes Java in the title even when React appears only in description", () =>
    expect(
      score("Java Developer", ["Spring"], "Some React collaboration").decision
    ).toBe("excluded"));
  it("returns an explanation for every result", () =>
    expect(score("Frontend React Developer").reasons.at(-1)).toMatch(
      /Profile decision/
    ));
});
