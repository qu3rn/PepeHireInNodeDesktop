import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import { collectorRunIdSchema, collectorStartSchema } from "../shared/schemas";
import { CollectorService } from "../collectors/collector.service";

export function registerCollectorIpc(collectorService: CollectorService): void {
  ipcMain.handle(IPC_CHANNELS.collectorStart, async (_event, input) => {
    const parsed = collectorStartSchema.parse(input);
    return collectorService.start(parsed);
  });

  ipcMain.handle(IPC_CHANNELS.collectorGetStatus, async (_event, runId) => {
    const parsedRunId = collectorRunIdSchema.parse(runId);
    return collectorService.getStatus(parsedRunId);
  });

  ipcMain.handle(IPC_CHANNELS.collectorCancel, async (_event, runId) => {
    const parsedRunId = collectorRunIdSchema.parse(runId);
    return collectorService.cancel(parsedRunId);
  });

  ipcMain.handle(IPC_CHANNELS.collectorListRuns, async () => {
    return collectorService.listRuns();
  });

  ipcMain.handle(IPC_CHANNELS.collectorGetProgress, async (_event, runId) => {
    const parsedRunId = collectorRunIdSchema.parse(runId);
    return collectorService.getProgress(parsedRunId);
  });
}
