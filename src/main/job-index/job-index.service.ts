import type { OfferRepository } from "../adapters/repositories";
import type { CollectorService } from "../collectors/collector.service";
import type { Offer, OfferStatus } from "../shared/types";
import { matchRelevance } from "../services/relevance.service";
import type { AppLogger } from "../logging/logger";
import {
  buildSearchableText,
  createOfferFingerprint,
  normalizeIndexText,
  normalizeOfferUrl
} from "./fingerprint";
import type {
  AvailabilityOptions,
  AvailabilitySummary,
  CleanupExecuteOptions,
  CleanupOptions,
  CleanupPreview,
  CleanupSummary,
  JobIndexCriteria,
  JobIndexFilters,
  JobIndexSearchResult,
  ReindexOptions,
  ReindexSummary
} from "./job-index.types";
import type { AvailabilityService } from "./availability.service";
import {
  FRONTEND_REACT_PROFILE,
  SEARCH_PROFILES,
  scoreOfferForProfile,
  type SearchProfile
} from "./search-profile";

const USER_STATUSES: OfferStatus[] = ["saved", "applied", "ignored"];
const ageDays = (iso: string, now = Date.now()) =>
  Math.floor((now - new Date(iso).getTime()) / 86400000);
const incomplete = (o: Offer) =>
  !o.title?.trim() || !o.company?.trim() || !/^https?:\/\//i.test(o.url);

export class JobIndexService {
  constructor(
    private offers: OfferRepository,
    private collector: CollectorService,
    private availability: AvailabilityService,
    private logger: AppLogger
  ) {}

  async search(filters: JobIndexFilters): Promise<JobIndexSearchResult> {
    const page = filters.page ?? 1,
      pageSize = filters.pageSize ?? 25;
    let rows = await this.offers.all();
    const has = (value: string, terms?: string[]) =>
      !terms?.length ||
      terms.some((x) => value.includes(normalizeIndexText(x)));
    rows = rows.filter((o) => {
      const text = o.searchableText || buildSearchableText(o);
      return (
        (!filters.search ||
          text.includes(normalizeIndexText(filters.search))) &&
        (!filters.sources?.length ||
          filters.sources.includes(o.source as never)) &&
        (!filters.statuses?.length || filters.statuses.includes(o.status)) &&
        (!filters.includeKeywords?.length ||
          filters.includeKeywords.every((x) =>
            text.includes(normalizeIndexText(x))
          )) &&
        !filters.excludeKeywords?.some((x) =>
          text.includes(normalizeIndexText(x))
        ) &&
        (!filters.requiredTags?.length ||
          filters.requiredTags.every((x) =>
            o.technologies.some(
              (t) => normalizeIndexText(t) === normalizeIndexText(x)
            )
          )) &&
        has(
          o.location ?? "",
          filters.location ? [filters.location] : undefined
        ) &&
        has(o.remoteMode ?? "", filters.remoteModes) &&
        has(o.contractType ?? "", filters.contractTypes) &&
        (!filters.minimumSalary ||
          (o.salaryMonthlyMax ?? o.salaryMax ?? 0) >= filters.minimumSalary) &&
        (!filters.firstSeenFrom || o.firstSeenAt >= filters.firstSeenFrom) &&
        (!filters.firstSeenTo || o.firstSeenAt <= filters.firstSeenTo) &&
        (!filters.activeOnly || !["expired", "invalid"].includes(o.status)) &&
        (filters.showLowRelevance !== false ||
          (o.relevanceDecision !== "low_relevance" &&
            o.relevanceDecision !== "excluded"))
      );
    });
    const key = filters.sortBy ?? "lastSeen",
      dir = filters.sortDirection === "asc" ? 1 : -1;
    rows.sort(
      (a, b) =>
        dir *
        String(
          key === "relevance"
            ? (a.relevanceScore ?? -1)
            : key === "salary"
              ? (a.salaryMonthlyMax ?? -1)
              : key === "title"
                ? a.title
                : key === "firstSeen"
                  ? a.firstSeenAt
                  : a.lastSeenAt
        ).localeCompare(
          String(
            key === "relevance"
              ? (b.relevanceScore ?? -1)
              : key === "salary"
                ? (b.salaryMonthlyMax ?? -1)
                : key === "title"
                  ? b.title
                  : key === "firstSeen"
                    ? b.firstSeenAt
                    : b.lastSeenAt
          ),
          undefined,
          { numeric: true }
        )
    );
    return {
      items: rows.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: rows.length,
      totalPages: Math.max(1, Math.ceil(rows.length / pageSize))
    };
  }

  async collect(criteria: JobIndexCriteria): Promise<{ runIds: string[] }> {
    const runIds: string[] = [];
    const baseProfile =
      SEARCH_PROFILES.find((x) => x.id === criteria.searchProfileId) ??
      FRONTEND_REACT_PROFILE;
    const searchProfile: SearchProfile = {
      ...baseProfile,
      includeKeywords: [
        ...baseProfile.includeKeywords,
        ...(criteria.includeKeywords ?? [])
      ],
      requiredAnyKeywords: [
        ...baseProfile.requiredAnyKeywords,
        ...(criteria.titleKeywords ?? [])
      ],
      excludeKeywords: [
        ...baseProfile.excludeKeywords,
        ...(criteria.excludeKeywords ?? [])
      ]
    };
    for (const source of criteria.sources)
      runIds.push(
        (
          await this.collector.start({
            source,
            phrase: criteria.phrase,
            location: criteria.location,
            remoteOnly: criteria.remoteModes?.includes("remote"),
            pageLimit: criteria.pageLimit,
            resultLimit: criteria.resultLimit,
            searchProfile
          })
        ).runId
      );
    return { runIds };
  }

  listProfiles(): SearchProfile[] {
    return SEARCH_PROFILES;
  }

  async updateStatus(id: string, status: OfferStatus): Promise<Offer> {
    return this.offers.update(id, { status });
  }
  async updateRelevance(id: string, relevant: boolean): Promise<Offer> {
    const offer = await this.offers.getById(id);
    if (!offer) throw new Error(`Offer ${id} not found`);
    const protectedStatus =
      offer.pinned || ["saved", "applied"].includes(offer.status);
    return this.offers.update(id, {
      relevanceDecision: relevant ? "match" : "low_relevance",
      status: protectedStatus ? offer.status : relevant ? "seen" : "ignored",
      reasons: [
        ...offer.reasons,
        `Manual relevance correction: ${relevant ? "relevant" : "irrelevant"}`
      ]
    });
  }

  async reindex(_options: ReindexOptions = {}): Promise<ReindexSummary> {
    const summary: ReindexSummary = {
      recordsChecked: 0,
      recordsUpdated: 0,
      duplicatesMerged: 0,
      invalidRecordsFound: 0,
      errors: 0
    };
    const seen = new Map<string, Offer>();
    for (const offer of await this.offers.all()) {
      summary.recordsChecked++;
      try {
        const normalizedUrl = normalizeOfferUrl(offer.url),
          fingerprint = createOfferFingerprint(
            offer.title,
            offer.company,
            offer.location
          );
        const relevance = matchRelevance({
          title: offer.title ?? undefined,
          description: offer.description ?? undefined,
          technologies: offer.technologies
        });
        const profile =
          SEARCH_PROFILES.find((x) => x.id === offer.searchProfileId) ??
          FRONTEND_REACT_PROFILE;
        const profileScore = scoreOfferForProfile(offer, profile);
        if (incomplete(offer)) summary.invalidRecordsFound++;
        const duplicate =
          seen.get(`${offer.source}|${offer.sourceId || ""}`) ||
          seen.get(normalizedUrl) ||
          (fingerprint ? seen.get(fingerprint) : undefined);
        if (duplicate && duplicate.id !== offer.id) {
          const keep =
            USER_STATUSES.includes(offer.status) &&
            !USER_STATUSES.includes(duplicate.status)
              ? offer
              : duplicate;
          const drop = keep.id === offer.id ? duplicate : offer;
          await this.offers.update(keep.id, {
            status: USER_STATUSES.includes(drop.status)
              ? drop.status
              : keep.status,
            notes: keep.notes ?? drop.notes,
            pinned: keep.pinned || drop.pinned
          });
          await this.offers.delete(drop.id);
          summary.duplicatesMerged++;
          continue;
        }
        const profileStatus = ["new", "seen", "low_relevance"].includes(
          offer.status
        )
          ? profileScore.decision === "match"
            ? offer.status === "low_relevance"
              ? "new"
              : offer.status
            : "low_relevance"
          : offer.status;
        await this.offers.update(offer.id, {
          normalizedUrl,
          fingerprint,
          searchableText: buildSearchableText(offer),
          relevanceScore: profileScore.score,
          relevanceDecision: profileScore.decision,
          searchProfileId: profile.id,
          score: relevance.relevanceScore,
          decision: relevance.relevanceDecision,
          reasons: [...profileScore.reasons, ...relevance.reasons],
          status:
            incomplete(offer) &&
            !USER_STATUSES.includes(offer.status) &&
            !offer.pinned
              ? "invalid"
              : profileStatus
        });
        summary.recordsUpdated++;
        seen.set(`${offer.source}|${offer.sourceId || ""}`, offer);
        seen.set(normalizedUrl, offer);
        if (fingerprint) seen.set(fingerprint, offer);
      } catch {
        summary.errors++;
      }
    }
    this.logger.info("Job Index reindex completed", {
      module: "job-index",
      ...summary
    });
    return summary;
  }

  async cleanupPreview(options: CleanupOptions): Promise<CleanupPreview> {
    const rows = await this.offers.all(),
      fp = new Set<string>();
    const candidates: CleanupPreview["candidates"] = [];
    for (const offer of rows) {
      const reasons: CleanupPreview["candidates"][number]["reasons"] = [];
      if (ageDays(offer.lastSeenAt) >= options.markExpiredAfterDays)
        reasons.push("stale");
      if (incomplete(offer)) reasons.push("missing_required", "invalid");
      if (offer.fingerprint && fp.has(offer.fingerprint))
        reasons.push("duplicate");
      fp.add(offer.fingerprint);
      if (!/^https?:\/\//i.test(offer.url)) reasons.push("broken_url");
      if (reasons.length) {
        const protectedRecord =
          (options.preserveSavedApplied !== false &&
            ["saved", "applied"].includes(offer.status)) ||
          (options.preservePinned !== false && offer.pinned);
        candidates.push({
          offer,
          reasons: [...new Set(reasons)],
          suggestedAction: reasons.includes("invalid")
            ? "invalidate"
            : "expire",
          protected: protectedRecord
        });
      }
    }
    return {
      checked: rows.length,
      candidates,
      expired: candidates.filter((x) => x.reasons.includes("stale")).length,
      invalid: candidates.filter((x) => x.reasons.includes("invalid")).length,
      duplicates: candidates.filter((x) => x.reasons.includes("duplicate"))
        .length,
      protected: candidates.filter((x) => x.protected).length
    };
  }

  async cleanupExecute(
    options: CleanupExecuteOptions
  ): Promise<CleanupSummary> {
    if (options.mode === "delete" && !options.confirmedPermanentDelete)
      throw new Error("Permanent deletion requires explicit confirmation");
    const preview = await this.cleanupPreview(options);
    const out: CleanupSummary = {
      checked: preview.checked,
      markedExpired: 0,
      markedInvalid: 0,
      archived: 0,
      deleted: 0,
      protected: 0,
      errors: 0
    };
    for (const item of preview.candidates) {
      if (item.protected) {
        out.protected++;
        continue;
      }
      try {
        if (options.mode === "delete") {
          await this.offers.delete(item.offer.id);
          out.deleted++;
        } else {
          const status = item.reasons.includes("invalid")
            ? "invalid"
            : "expired";
          await this.offers.update(item.offer.id, { status });
          status === "invalid" ? out.markedInvalid++ : out.markedExpired++;
          if (options.mode === "archive") out.archived++;
        }
      } catch {
        out.errors++;
      }
    }
    this.logger.info("Job Index cleanup completed", {
      module: "job-index",
      mode: options.mode,
      ...out
    });
    return out;
  }

  async recheck(options: AvailabilityOptions): Promise<AvailabilitySummary> {
    return this.availability.recheck(await this.offers.all(), options);
  }
}
