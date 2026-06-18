import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import { idSchema, queueListQuerySchema, skipQueueSchema } from "../shared/schemas";
import type { QueueService } from "../services/queue.service";

export function registerQueueIpc(queueService: QueueService): void {
  ipcMain.handle(IPC_CHANNELS.queueList, async (_event, query) => {
    const parsed = queueListQuerySchema.parse(query ?? {});
    return queueService.list(parsed.page, parsed.pageSize);
  });

  ipcMain.handle(IPC_CHANNELS.queueBuild, async () => {
    const inserted = await queueService.build();
    return { inserted };
  });

  ipcMain.handle(IPC_CHANNELS.queueGetNext, async () => {
    return queueService.getNext();
  });

  ipcMain.handle(IPC_CHANNELS.queueSkip, async (_event, input) => {
    const parsed = skipQueueSchema.parse(input);
    await queueService.skip(parsed.id, parsed.reason);
  });

  ipcMain.handle(IPC_CHANNELS.queueMarkSent, async (_event, id) => {
    await queueService.markSent(idSchema.parse(id));
  });
}
