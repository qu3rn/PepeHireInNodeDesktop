import { createHash } from "node:crypto";

export function normalizeIndexText(value: string | null | undefined): string {
  return (value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim().replace(/\s+/g, " ");
}

export function normalizeOfferUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|ref$|referrer$|source$|tracking)/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\?$/, "");
  } catch { return value.trim(); }
}

export function createOfferFingerprint(title?: string | null, company?: string | null, location?: string | null): string {
  const value = [title, company, location].map(normalizeIndexText).join("|");
  return value === "||" ? "" : createHash("sha256").update(value).digest("hex");
}

export function buildSearchableText(input: { title?: string | null; company?: string | null; location?: string | null; contractType?: string | null; description?: string | null; technologies?: string[] }): string {
  return normalizeIndexText([input.title, input.company, input.location, input.contractType, ...(input.technologies ?? []), input.description].filter(Boolean).join(" "));
}
