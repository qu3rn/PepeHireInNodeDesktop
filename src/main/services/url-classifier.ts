export type UrlClassification = "job_offer" | "listing" | "unknown";

export interface UrlClassificationResult {
  classification: UrlClassification;
  reason: string;
}

export function classifyUrl(source: string, rawUrl: string): UrlClassificationResult {
  const normalizedSource = source.toLowerCase();
  const url = rawUrl.toLowerCase();

  if (normalizedSource === "pracuj") {
    if (url.includes(",oferta,")) {
      return { classification: "job_offer", reason: "Pracuj URL contains ,oferta," };
    }
    if (url.includes("/praca")) {
      return { classification: "listing", reason: "Pracuj /praca path treated as listing" };
    }
  }

  if (normalizedSource === "justjoin") {
    if (/\/job-offer\/.+/.test(url)) {
      return { classification: "job_offer", reason: "JustJoinIT /job-offer/{slug}" };
    }
    if (/\/job-offers/.test(url)) {
      return { classification: "listing", reason: "JustJoinIT listing path" };
    }
  }

  if (normalizedSource === "rocketjobs") {
    if (/\/oferta-pracy\/.+/.test(url)) {
      return { classification: "job_offer", reason: "RocketJobs /oferta-pracy/{slug}" };
    }
    if (/\/oferty-pracy/.test(url)) {
      return { classification: "listing", reason: "RocketJobs listing path" };
    }
  }

  if (normalizedSource === "nofluffjobs") {
    if (/\/job\//.test(url) || /\/pl\/job\//.test(url)) {
      return { classification: "job_offer", reason: "NoFluffJobs job path" };
    }
    if (/\/pl\/?$/.test(url) || /\/jobs/.test(url)) {
      return { classification: "listing", reason: "NoFluffJobs listing path" };
    }
  }

  return { classification: "unknown", reason: "No matching source rule" };
}
