export const IPC_CHANNELS = {
  offersList: "offers:list",
  offersGet: "offers:get",
  offersCreate: "offers:create",
  offersDelete: "offers:delete",
  queueList: "queue:list",
  queueBuild: "queue:build",
  queueGetNext: "queue:get-next",
  queueSkip: "queue:skip",
  queueMarkSent: "queue:mark-sent",
  collectionClassify: "collection:classify-url",
  collectionSave: "collection:save-url",
  rapidApplyFill: "rapid-apply:fill-item"
} as const;

export const PAGE_SIZES = {
  offers: 25,
  queue: 25,
  applications: 25,
  debug: 10
} as const;
