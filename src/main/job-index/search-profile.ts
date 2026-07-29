import type { ProfileRelevanceDecision } from "../shared/types";
import { normalizeIndexText } from "./fingerprint";

export type SearchProfile = {
  id: string;
  name: string;
  includeKeywords: string[];
  requiredAnyKeywords: string[];
  preferredKeywords: string[];
  excludeKeywords: string[];
  excludeTitleKeywords: string[];
  minScore: number;
};

export type ProfileScoringOffer = {
  title?: string | null;
  technologies?: string[];
  description?: string | null;
};

export type ProfileScoreResult = {
  score: number;
  decision: ProfileRelevanceDecision;
  reasons: string[];
};

export const FRONTEND_REACT_PROFILE: SearchProfile = {
  id: "frontend-react",
  name: "Frontend React",
  includeKeywords: [],
  requiredAnyKeywords: [
    "react",
    "frontend",
    "front-end",
    "typescript",
    "javascript"
  ],
  preferredKeywords: [
    "react",
    "frontend",
    "front-end",
    "typescript",
    "javascript",
    "next.js",
    "vite",
    "tailwind",
    "redux"
  ],
  excludeKeywords: [
    "java developer",
    "spring",
    "backend java",
    "devops",
    "data engineer",
    "machine learning",
    "ml engineer",
    "ai engineer",
    "embedded",
    "qa automation"
  ],
  excludeTitleKeywords: [
    "java developer",
    "backend java",
    "devops",
    "data engineer",
    "machine learning",
    "ml engineer",
    "ai engineer",
    "embedded",
    "qa automation",
    "backend node",
    "node.js developer",
    "node developer"
  ],
  minScore: 35
};

export const SEARCH_PROFILES: SearchProfile[] = [FRONTEND_REACT_PROFILE];

function contains(corpus: string, keyword: string): boolean {
  const normalized = normalizeIndexText(keyword);
  if (!normalized) return false;
  const escaped = normalized
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(corpus);
}

function matches(corpus: string, keywords: string[]): string[] {
  return [...new Set(keywords.filter((keyword) => contains(corpus, keyword)))];
}

export function scoreOfferForProfile(
  offer: ProfileScoringOffer,
  profile: SearchProfile
): ProfileScoreResult {
  const title = normalizeIndexText(offer.title);
  const tags = normalizeIndexText((offer.technologies ?? []).join(" "));
  const description = normalizeIndexText(offer.description);
  const reasons: string[] = [];
  let score = 0;

  const add = (label: string, found: string[], weight: number): void => {
    if (!found.length) return;
    const points = found.length * weight;
    score += points;
    reasons.push(
      `${label}: ${found.join(", ")} (${points > 0 ? "+" : ""}${points})`
    );
  };

  const requiredTitle = matches(title, profile.requiredAnyKeywords);
  const requiredTags = matches(tags, profile.requiredAnyKeywords);
  const requiredDescription = matches(description, profile.requiredAnyKeywords);
  add("Required signal in title", requiredTitle, 35);
  add("Required signal in tags", requiredTags, 25);
  add("Required signal in description", requiredDescription, 10);
  add(
    "Preferred signal in title",
    matches(title, profile.preferredKeywords),
    20
  );
  add("Preferred signal in tags", matches(tags, profile.preferredKeywords), 15);
  add(
    "Preferred signal in description",
    matches(description, profile.preferredKeywords),
    5
  );
  add("Included keyword in title", matches(title, profile.includeKeywords), 25);
  add("Included keyword in tags", matches(tags, profile.includeKeywords), 15);
  add(
    "Included keyword in description",
    matches(description, profile.includeKeywords),
    5
  );

  const excludedTitleStrong = matches(title, profile.excludeTitleKeywords);
  const excludedTitle = matches(title, profile.excludeKeywords);
  add("Excluded title signal", excludedTitleStrong, -80);
  add("Excluded keyword in title", excludedTitle, -60);
  add("Excluded keyword in tags", matches(tags, profile.excludeKeywords), -40);
  add(
    "Excluded keyword in description",
    matches(description, profile.excludeKeywords),
    -15
  );

  // Node.js is neutral unless a backend/Node developer phrase is present in the title.
  const backendNodeTitle =
    /\b(?:backend\s+node(?:\.js)?|node(?:\.js)?\s+(?:backend\s+)?developer)\b/i.test(
      title
    );
  if (backendNodeTitle && !excludedTitleStrong.some((x) => /node/i.test(x))) {
    score -= 80;
    excludedTitleStrong.push("backend/node developer");
    reasons.push("Excluded title signal: backend/node developer (-80)");
  }

  const hasRequired =
    requiredTitle.length + requiredTags.length + requiredDescription.length > 0;
  const strongFrontendPositive =
    requiredTitle.filter((x) =>
      ["react", "frontend", "front-end"].includes(normalizeIndexText(x))
    ).length >= 2;
  let decision: ProfileRelevanceDecision;
  if (excludedTitleStrong.length > 0 && !strongFrontendPositive)
    decision = "excluded";
  else if (!hasRequired) {
    decision = "low_relevance";
    reasons.push(
      "No required profile keyword found in title, tags, or description"
    );
  } else if (score < profile.minScore) {
    decision = "low_relevance";
    reasons.push(`Score ${score} is below profile minimum ${profile.minScore}`);
  } else decision = "match";

  reasons.push(
    `Profile decision: ${decision} (score ${score}, minimum ${profile.minScore})`
  );
  return { score, decision, reasons };
}
