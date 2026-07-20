export interface ExtractionWarning { code: "missing_element" | "invalid_url" | "invalid_value"; field: string; message: string }
export interface RawOfferListingItem { sourceId?: string | null; url?: string | null; title?: string | null; company?: string | null; location?: string | null; remoteMode?: string | null; technologies?: string[]; contractType?: string | null; salaryRaw?: string | null; shortDescription?: string | null; publicationDate?: string | null; warnings: ExtractionWarning[] }
export interface RawOfferDetails extends RawOfferListingItem { description?: string | null }
