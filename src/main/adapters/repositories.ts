import type {
  BulkDeleteResult,
  CollectedUrl,
  CreateOfferInput,
  Offer,
  OfferListQuery,
  PaginatedResult,
  QueueItem,
  QueueListQuery,
  UpdateOfferInput
} from "../shared/types";

export interface OfferRepository {
  create(input: CreateOfferInput): Promise<Offer>;
  getById(id: string): Promise<Offer | null>;
  getByUrl(url: string): Promise<Offer | null>;
  list(query: OfferListQuery): Promise<PaginatedResult<Offer>>;
  update(id: string, patch: UpdateOfferInput): Promise<Offer>;
  delete(id: string): Promise<void>;
  bulkDelete(ids: string[]): Promise<BulkDeleteResult>;
  all(): Promise<Offer[]>;
}

export interface QueueRepository {
  list(query: QueueListQuery): Promise<PaginatedResult<QueueItem>>;
  buildFromOffers(offers: Offer[]): Promise<number>;
  getNext(): Promise<QueueItem | null>;
  markSent(id: string): Promise<void>;
  skip(id: string, reason: string): Promise<void>;
}

export interface CollectedUrlRepository {
  create(input: Omit<CollectedUrl, "id" | "createdAt" | "updatedAt">): Promise<CollectedUrl>;
  list(page?: number, pageSize?: number): Promise<PaginatedResult<CollectedUrl>>;
}

export interface Repositories {
  offers: OfferRepository;
  queue: QueueRepository;
  collectedUrls: CollectedUrlRepository;
}
