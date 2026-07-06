import type { JobAssistantApi, PepeHireApi } from "../main/shared/ipc-api";

declare global {
  interface Window {
    jobAssistant: JobAssistantApi;
    pepeHire: PepeHireApi;
  }
}

export {};
