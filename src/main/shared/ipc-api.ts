import type {
  CollectedUrl,
  CreateOfferInput,
  Offer,
  OfferListQuery,
  PaginatedResult,
  QueueItem,
  QueueListQuery
} from "./types";

export interface JobAssistantApi {
  offers: {
    list(query: OfferListQuery): Promise<PaginatedResult<Offer>>;
    get(id: string): Promise<Offer | null>;
    create(input: CreateOfferInput): Promise<Offer>;
    delete(id: string): Promise<void>;
  };
  collection: {
    classifyUrl(input: { source: string; url: string; text?: string }): Promise<{
      classification: string;
      reason: string;
      relevanceScore: number;
      relevanceDecision: "apply" | "maybe" | "skip";
      matchedKeywords: string[];
      negativeKeywords: string[];
    }>;
    saveCollectedUrl(input: Omit<CollectedUrl, "id" | "createdAt" | "updatedAt">): Promise<CollectedUrl>;
  };
  queue: {
    list(query: QueueListQuery): Promise<PaginatedResult<QueueItem>>;
    build(): Promise<{ inserted: number }>;
    getNext(): Promise<QueueItem | null>;
    skip(id: string, reason: string): Promise<void>;
    markSent(id: string): Promise<void>;
  };
  rapidApply: {
    fillItem(id: string): Promise<{ ok: boolean; warning: string }>;
  };
}
