import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import { createOfferSchema, idSchema, offerListQuerySchema } from "../shared/schemas";
import type { OfferService } from "../services/offer.service";

export function registerOffersIpc(offerService: OfferService): void {
  ipcMain.handle(IPC_CHANNELS.offersList, async (_event, query) => {
    const parsed = offerListQuerySchema.parse(query ?? {});
    return offerService.list(parsed);
  });

  ipcMain.handle(IPC_CHANNELS.offersGet, async (_event, id) => {
    return offerService.get(idSchema.parse(id));
  });

  ipcMain.handle(IPC_CHANNELS.offersCreate, async (_event, input) => {
    const parsed = createOfferSchema.parse(input);
    return offerService.create(parsed);
  });

  ipcMain.handle(IPC_CHANNELS.offersDelete, async (_event, id) => {
    await offerService.delete(idSchema.parse(id));
  });
}
