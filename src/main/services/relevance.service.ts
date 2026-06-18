export interface RelevanceResult {
  relevanceScore: number;
  relevanceDecision: "apply" | "maybe" | "skip";
  matchedKeywords: string[];
  matchedTechnologies: string[];
  negativeKeywords: string[];
  reasons: string[];
}

const POSITIVE = [
  "react",
  "react.js",
  "reactjs",
  "frontend",
  "front-end",
  "front end",
  "typescript",
  "javascript",
  "next.js",
  "node.js",
  "programista frontend",
  "programista front-end",
  "programista react"
];

const NEGATIVE = [
  "sprzedawca",
  "kasjer",
  "magazynier",
  "operator",
  "kierowca",
  "call center",
  "php",
  "wordpress",
  "angular",
  "vue",
  "java",
  ".net",
  "c#"
];

const TECH = ["react", "typescript", "javascript", "next.js", "node.js"];

export function matchRelevance(input: { title?: string; description?: string; technologies?: string[] }): RelevanceResult {
  const corpus = `${input.title ?? ""} ${input.description ?? ""} ${(input.technologies ?? []).join(" ")}`.toLowerCase();
  const matchedKeywords = POSITIVE.filter((keyword) => corpus.includes(keyword));
  const negativeKeywords = NEGATIVE.filter((keyword) => corpus.includes(keyword));
  const matchedTechnologies = TECH.filter((tech) => corpus.includes(tech));

  let score = 40;
  score += matchedKeywords.length * 8;
  score += matchedTechnologies.length * 6;
  score -= negativeKeywords.length * 15;

  score = Math.max(0, Math.min(100, score));

  const reasons: string[] = [];
  if (matchedKeywords.length > 0) {
    reasons.push(`Positive keywords: ${matchedKeywords.join(", ")}`);
  }
  if (negativeKeywords.length > 0) {
    reasons.push(`Negative keywords: ${negativeKeywords.join(", ")}`);
  }

  const relevanceDecision = score >= 70 ? "apply" : score >= 40 ? "maybe" : "skip";

  return {
    relevanceScore: score,
    relevanceDecision,
    matchedKeywords,
    matchedTechnologies,
    negativeKeywords,
    reasons
  };
}
