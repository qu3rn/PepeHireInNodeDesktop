import type { JobAssistantApi } from "../main/shared/ipc-api";

declare global {
  interface Window {
    jobAssistant: JobAssistantApi;
  }
}

export {};
