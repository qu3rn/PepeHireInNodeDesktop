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
  collectorStart: "collector:start",
  collectorGetStatus: "collector:get-status",
  collectorCancel: "collector:cancel",
  collectorListRuns: "collector:list-runs",
  collectorGetProgress: "collector:get-progress",
  rapidApplyFill: "rapid-apply:fill-item",
  rapidApplyInspect: "rapid-apply:inspect",
  rapidApplyPrepare: "rapid-apply:prepare",
  rapidApplySubmit: "rapid-apply:submit",
  rapidApplyCancel: "rapid-apply:cancel",
  rapidApplyGetStatus: "rapid-apply:get-status",
  rapidApplyListAttempts: "rapid-apply:list-attempts",
  debugGetDiagnostics: "debug:get-diagnostics",
  debugPing: "debug:ping",
  debugClearLogs: "debug:clear-logs"
  ,jobIndexSearch:"job-index:search", jobIndexCollect:"job-index:collect", jobIndexReindex:"job-index:reindex",
  jobIndexCleanupPreview:"job-index:cleanup-preview", jobIndexCleanupExecute:"job-index:cleanup-execute",
  jobIndexRecheck:"job-index:recheck", jobIndexUpdateStatus:"job-index:update-status"
} as const;

export const PAGE_SIZES = {
  offers: 25,
  queue: 25,
  applications: 25,
  debug: 10
} as const;
