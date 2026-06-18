import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import { idSchema } from "../shared/schemas";

export function registerRapidApplyIpc(): void {
  ipcMain.handle(IPC_CHANNELS.rapidApplyFill, async (_event, id) => {
    idSchema.parse(id);
    return {
      ok: true,
      warning: "Rapid Apply Phase 1 skeleton only. Final submit must remain manual."
    };
  });
}
