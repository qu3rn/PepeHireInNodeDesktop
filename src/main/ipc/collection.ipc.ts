import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../shared/constants";
import { classifyUrlSchema } from "../shared/schemas";
import { classifyUrl } from "../services/url-classifier";
import { matchRelevance } from "../services/relevance.service";
import type { CollectedUrlRepository } from "../adapters/repositories";

export function registerCollectionIpc(collectedUrls: CollectedUrlRepository): void {
  ipcMain.handle(IPC_CHANNELS.collectionClassify, async (_event, input) => {
    const parsed = classifyUrlSchema.parse(input);
    const classification = classifyUrl(parsed.source, parsed.url);
    const relevance = matchRelevance({ title: parsed.text, description: parsed.text, technologies: [] });

    return {
      ...classification,
      relevanceScore: relevance.relevanceScore,
      relevanceDecision: relevance.relevanceDecision,
      matchedKeywords: relevance.matchedKeywords,
      negativeKeywords: relevance.negativeKeywords
    };
  });

  ipcMain.handle(IPC_CHANNELS.collectionSave, async (_event, input) => {
    return collectedUrls.create(input);
  });
}
