import path from "node:path";
import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import type { DebugDiagnostics } from "../shared/types";
import type { CollectorService } from "../collectors/collector.service";
import type { RapidApplyService } from "../rapid-apply/rapid-apply.service";
import type { AppLogger } from "../logging/logger";
import type { Repositories } from "../adapters/repositories";

interface DebugDeps {
  appVersion: string;
  isPackaged: boolean;
  dbPath: string;
  dataDir: string;
  logger: AppLogger;
  collectorService: CollectorService;
  rapidApplyService: RapidApplyService;
  repositories: Repositories;
}

export function registerDebugIpc(deps: DebugDeps): void {
  ipcMain.handle(IPC_CHANNELS.debugPing, async () => ({ ok: true, at: new Date().toISOString() }));

  ipcMain.handle(IPC_CHANNELS.debugClearLogs, async () => {
    deps.logger.clearLogs();
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.debugGetDiagnostics, async (): Promise<DebugDiagnostics> => {
    const attempts = await deps.rapidApplyService.listAttempts(10);

    return {
      appVersion: deps.appVersion,
      electronVersion: process.versions.electron ?? "unknown",
      nodeVersion: process.versions.node,
      chromiumVersion: process.versions.chrome ?? "unknown",
      isPackaged: deps.isPackaged,
      dbPath: deps.dbPath,
      dataDir: deps.dataDir,
      logPath: deps.logger.getLogPath(),
      registeredIpcChannels: Object.values(IPC_CHANNELS),
      activeCollectorRuns: deps.collectorService.getActiveRunCount(),
      activeRapidApplySessions: deps.rapidApplyService.getActiveSessionCount(),
      recentApplicationAttempts: attempts,
      recentErrors: deps.logger.getRecentErrors(),
      browserStatus: deps.collectorService.getActiveRunCount() > 0 || deps.rapidApplyService.getActiveSessionCount() > 0 ? "busy" : "idle"
    };
  });
}
