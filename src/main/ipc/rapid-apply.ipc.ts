import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import { idSchema, rapidApplyPrepareSchema, rapidApplySubmitSchema } from "../shared/schemas";
import type { RapidApplyService } from "../rapid-apply/rapid-apply.service";

export function registerRapidApplyIpc(rapidApplyService: RapidApplyService): void {
  ipcMain.handle(IPC_CHANNELS.rapidApplyFill, async (_event, id) => {
    idSchema.parse(id);
    return {
      ok: true,
      warning: "Rapid Apply Phase 1 skeleton only. Final submit must remain manual."
    };
  });

  ipcMain.handle(IPC_CHANNELS.rapidApplyInspect, async (_event, offerId) => {
    return rapidApplyService.inspect(idSchema.parse(offerId));
  });

  ipcMain.handle(IPC_CHANNELS.rapidApplyPrepare, async (_event, input) => {
    return rapidApplyService.prepare(rapidApplyPrepareSchema.parse(input));
  });

  ipcMain.handle(IPC_CHANNELS.rapidApplySubmit, async (_event, input) => {
    return rapidApplyService.submit(rapidApplySubmitSchema.parse(input));
  });

  ipcMain.handle(IPC_CHANNELS.rapidApplyCancel, async (_event, attemptId) => {
    return rapidApplyService.cancel(idSchema.parse(attemptId));
  });

  ipcMain.handle(IPC_CHANNELS.rapidApplyGetStatus, async (_event, attemptId) => {
    return rapidApplyService.getStatus(idSchema.parse(attemptId));
  });

  ipcMain.handle(IPC_CHANNELS.rapidApplyListAttempts, async () => {
    return rapidApplyService.listAttempts(30);
  });
}
