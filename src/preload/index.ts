import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../main/shared/constants";
import type { JobAssistantApi } from "../main/shared/ipc-api";

const api: JobAssistantApi = {
  jobIndex: {
    search:(filters)=>ipcRenderer.invoke(IPC_CHANNELS.jobIndexSearch,filters), collect:(criteria)=>ipcRenderer.invoke(IPC_CHANNELS.jobIndexCollect,criteria),
    reindex:(options)=>ipcRenderer.invoke(IPC_CHANNELS.jobIndexReindex,options), cleanupPreview:(options)=>ipcRenderer.invoke(IPC_CHANNELS.jobIndexCleanupPreview,options),
    cleanupExecute:(options)=>ipcRenderer.invoke(IPC_CHANNELS.jobIndexCleanupExecute,options), recheck:(options)=>ipcRenderer.invoke(IPC_CHANNELS.jobIndexRecheck,options),
    updateStatus:(offerId,status)=>ipcRenderer.invoke(IPC_CHANNELS.jobIndexUpdateStatus,{offerId,status})
  },
  offers: {
    list: (query) => ipcRenderer.invoke(IPC_CHANNELS.offersList, query),
    get: (id) => ipcRenderer.invoke(IPC_CHANNELS.offersGet, id),
    create: (input) => ipcRenderer.invoke(IPC_CHANNELS.offersCreate, input),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.offersDelete, id)
  },
  collection: {
    classifyUrl: (input) => ipcRenderer.invoke(IPC_CHANNELS.collectionClassify, input),
    saveCollectedUrl: (input) => ipcRenderer.invoke(IPC_CHANNELS.collectionSave, input)
  },
  collector: {
    start: (criteria) => ipcRenderer.invoke(IPC_CHANNELS.collectorStart, criteria),
    getStatus: (runId) => ipcRenderer.invoke(IPC_CHANNELS.collectorGetStatus, runId),
    cancel: (runId) => ipcRenderer.invoke(IPC_CHANNELS.collectorCancel, runId),
    listRuns: () => ipcRenderer.invoke(IPC_CHANNELS.collectorListRuns),
    getProgress: (runId) => ipcRenderer.invoke(IPC_CHANNELS.collectorGetProgress, runId)
  },
  queue: {
    list: (query) => ipcRenderer.invoke(IPC_CHANNELS.queueList, query),
    build: () => ipcRenderer.invoke(IPC_CHANNELS.queueBuild),
    getNext: () => ipcRenderer.invoke(IPC_CHANNELS.queueGetNext),
    skip: (id, reason) => ipcRenderer.invoke(IPC_CHANNELS.queueSkip, { id, reason }),
    markSent: (id) => ipcRenderer.invoke(IPC_CHANNELS.queueMarkSent, id)
  },
  rapidApply: {
    fillItem: (id) => ipcRenderer.invoke(IPC_CHANNELS.rapidApplyFill, id),
    inspect: (offerId) => ipcRenderer.invoke(IPC_CHANNELS.rapidApplyInspect, offerId),
    prepare: (input) => ipcRenderer.invoke(IPC_CHANNELS.rapidApplyPrepare, input),
    submit: (input) => ipcRenderer.invoke(IPC_CHANNELS.rapidApplySubmit, input),
    cancel: (attemptId) => ipcRenderer.invoke(IPC_CHANNELS.rapidApplyCancel, attemptId),
    getStatus: (attemptId) => ipcRenderer.invoke(IPC_CHANNELS.rapidApplyGetStatus, attemptId),
    listAttempts: () => ipcRenderer.invoke(IPC_CHANNELS.rapidApplyListAttempts)
  },
  debug: {
    getDiagnostics: () => ipcRenderer.invoke(IPC_CHANNELS.debugGetDiagnostics),
    ping: () => ipcRenderer.invoke(IPC_CHANNELS.debugPing),
    clearLogs: () => ipcRenderer.invoke(IPC_CHANNELS.debugClearLogs)
  }
};

contextBridge.exposeInMainWorld("jobAssistant", api);
contextBridge.exposeInMainWorld("pepeHire", {
  jobIndex: api.jobIndex,
  collector: api.collector,
  rapidApply: api.rapidApply,
  debug: api.debug
});
