import type { OfferRepository, QueueRepository } from "../adapters/repositories";

export class QueueService {
  constructor(
    private readonly offers: OfferRepository,
    private readonly queue: QueueRepository
  ) {}

  async list(page?: number, pageSize?: number) {
    return this.queue.list({ page, pageSize });
  }

  async build() {
    const offers = await this.offers.all();
    return this.queue.buildFromOffers(offers);
  }

  async getNext() {
    return this.queue.getNext();
  }

  async markSent(id: string) {
    return this.queue.markSent(id);
  }

  async skip(id: string, reason: string) {
    return this.queue.skip(id, reason);
  }
}
