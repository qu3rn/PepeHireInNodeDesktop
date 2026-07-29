import { ipcMain } from "electron";
import { z } from "zod";
import type { JobIndexService } from "../job-index/job-index.service";
import { IPC_CHANNELS } from "../shared/constants";
const filters = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  sources: z
    .array(
      z.enum(["manual", "pracuj", "justjoinit", "rocketjobs", "nofluffjobs"])
    )
    .optional(),
  statuses: z
    .array(
      z.enum([
        "new",
        "seen",
        "saved",
        "applied",
        "ignored",
        "low_relevance",
        "expired",
        "invalid"
      ])
    )
    .optional(),
  includeKeywords: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(),
  requiredTags: z.array(z.string()).optional(),
  optionalTags: z.array(z.string()).optional(),
  location: z.string().optional(),
  remoteModes: z.array(z.string()).optional(),
  contractTypes: z.array(z.string()).optional(),
  minimumSalary: z.number().nonnegative().optional(),
  firstSeenFrom: z.string().optional(),
  firstSeenTo: z.string().optional(),
  activeOnly: z.boolean().optional(),
  showLowRelevance: z.boolean().optional(),
  sortBy: z
    .enum(["relevance", "firstSeen", "lastSeen", "salary", "title"])
    .optional(),
  sortDirection: z.enum(["asc", "desc"]).optional()
});
const cleanup = z.object({
  markExpiredAfterDays: z.number().int().nonnegative(),
  deleteInvalidAfterDays: z.number().int().nonnegative(),
  preserveSavedApplied: z.boolean().optional(),
  preservePinned: z.boolean().optional(),
  checkBrokenUrls: z.boolean().optional()
});
export function registerJobIndexIpc(service: JobIndexService): void {
  ipcMain.handle(IPC_CHANNELS.jobIndexSearch, (_e, x) =>
    service.search(filters.parse(x ?? {}))
  );
  ipcMain.handle(IPC_CHANNELS.jobIndexCollect, (_e, x) =>
    service.collect(
      filters
        .extend({
          sources: z
            .array(
              z.enum(["pracuj", "justjoinit", "rocketjobs", "nofluffjobs"])
            )
            .min(1),
          phrase: z.string().min(1),
          titleKeywords: z.array(z.string()).optional(),
          pageLimit: z.number().int().positive().optional(),
          resultLimit: z.number().int().positive().optional(),
          searchProfileId: z.string().optional()
        })
        .parse(x)
    )
  );
  ipcMain.handle(IPC_CHANNELS.jobIndexReindex, (_e, x) =>
    service.reindex(
      z.object({ offerIds: z.array(z.string()).optional() }).parse(x ?? {})
    )
  );
  ipcMain.handle(IPC_CHANNELS.jobIndexCleanupPreview, (_e, x) =>
    service.cleanupPreview(cleanup.parse(x))
  );
  ipcMain.handle(IPC_CHANNELS.jobIndexCleanupExecute, (_e, x) =>
    service.cleanupExecute(
      cleanup
        .extend({
          mode: z.enum(["mark", "archive", "delete"]),
          confirmedPermanentDelete: z.boolean().optional()
        })
        .parse(x)
    )
  );
  ipcMain.handle(IPC_CHANNELS.jobIndexRecheck, (_e, x) =>
    service.recheck(
      z
        .object({
          offerIds: z.array(z.string()).optional(),
          limit: z.number().int().positive().max(500).optional()
        })
        .parse(x ?? {})
    )
  );
  ipcMain.handle(IPC_CHANNELS.jobIndexUpdateStatus, (_e, x) => {
    const p = z
      .object({
        offerId: z.string().min(1),
        status: z.enum([
          "new",
          "seen",
          "saved",
          "applied",
          "ignored",
          "low_relevance",
          "expired",
          "invalid"
        ])
      })
      .parse(x);
    return service.updateStatus(p.offerId, p.status);
  });
  ipcMain.handle(IPC_CHANNELS.jobIndexListProfiles, () =>
    service.listProfiles()
  );
  ipcMain.handle(IPC_CHANNELS.jobIndexUpdateRelevance, (_e, x) => {
    const p = z
      .object({ offerId: z.string().min(1), relevant: z.boolean() })
      .parse(x);
    return service.updateRelevance(p.offerId, p.relevant);
  });
}
