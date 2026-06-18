export type SalaryPeriod = "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "unknown";
export type SalaryTaxMode = "net" | "gross" | "net_plus_vat" | "unknown";

export interface SalaryParseResult {
  raw: string;
  min: number | null;
  max: number | null;
  currency: "PLN" | "EUR" | "USD" | "unknown";
  period: SalaryPeriod;
  taxMode: SalaryTaxMode;
  monthlyMin: number | null;
  monthlyMax: number | null;
  warnings: string[];
}

const HOURLY_TO_MONTHLY = 168;
const DAILY_TO_MONTHLY = 21;

function normalizeNumberToken(token: string): number {
  const compact = token.toLowerCase().replace(/\s+/g, "").replace(",", ".");
  if (compact.endsWith("k")) {
    return Number.parseFloat(compact.slice(0, -1)) * 1000;
  }
  return Number.parseFloat(compact);
}

function detectCurrency(input: string): SalaryParseResult["currency"] {
  const text = input.toLowerCase();
  if (/(pln|zł|zl)/.test(text)) {
    return "PLN";
  }
  if (/(eur|€)/.test(text)) {
    return "EUR";
  }
  if (/(usd|\$)/.test(text)) {
    return "USD";
  }
  return "unknown";
}

function detectPeriod(input: string): SalaryPeriod {
  const text = input.toLowerCase();
  if (/(\/\s*h|\bhour\b|godz|na godzin|\/h)/.test(text)) {
    return "hourly";
  }
  if (/(\/\s*d|\bday\b|dzie[ńn]|\/dzień)/.test(text)) {
    return "daily";
  }
  if (/(week|tydzie[ńn])/.test(text)) {
    return "weekly";
  }
  if (/(month|miesi|mies\.|\/m)/.test(text)) {
    return "monthly";
  }
  if (/(year|rok|roczn|\/year)/.test(text)) {
    return "yearly";
  }
  return "unknown";
}

function detectTaxMode(input: string): SalaryTaxMode {
  const text = input.toLowerCase();
  if (/netto\s*\+\s*vat/.test(text)) {
    return "net_plus_vat";
  }
  if (/netto|\bnet\b/.test(text)) {
    return "net";
  }
  if (/brutto|gross/.test(text)) {
    return "gross";
  }
  return "unknown";
}

function toMonthly(period: SalaryPeriod, value: number): number | null {
  switch (period) {
    case "hourly":
      return Math.round(value * HOURLY_TO_MONTHLY);
    case "daily":
      return Math.round(value * DAILY_TO_MONTHLY);
    case "weekly":
      return Math.round((value * 52) / 12);
    case "monthly":
      return Math.round(value);
    case "yearly":
      return Math.round(value / 12);
    default:
      return null;
  }
}

export function parseSalary(raw: string): SalaryParseResult {
  const cleaned = raw.replace(/\u00a0/g, " ");
  const numericTokens = cleaned.match(/\d+[\d\s,.]*k?/gi) ?? [];
  const warnings: string[] = [];

  if (numericTokens.length === 0) {
    return {
      raw,
      min: null,
      max: null,
      currency: detectCurrency(cleaned),
      period: detectPeriod(cleaned),
      taxMode: detectTaxMode(cleaned),
      monthlyMin: null,
      monthlyMax: null,
      warnings: ["No numeric amount detected"]
    };
  }

  const parsed = numericTokens
    .map((token) => normalizeNumberToken(token))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (parsed.length === 0) {
    warnings.push("Unable to parse salary values");
  }

  const min = parsed.length > 0 ? Math.round(parsed[0]) : null;
  const max = parsed.length > 1 ? Math.round(parsed[parsed.length - 1]) : min;

  const period = detectPeriod(cleaned);
  const monthlyMin = min === null ? null : toMonthly(period, min);
  const monthlyMax = max === null ? null : toMonthly(period, max);

  if (period === "unknown") {
    warnings.push("Unknown salary period");
  }

  return {
    raw,
    min,
    max,
    currency: detectCurrency(cleaned),
    period,
    taxMode: detectTaxMode(cleaned),
    monthlyMin,
    monthlyMax,
    warnings
  };
}
