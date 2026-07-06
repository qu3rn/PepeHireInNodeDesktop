import type { JobAssistantApi } from "../../main/shared/ipc-api";

function resolveApiClient(): JobAssistantApi {
	const api = window.jobAssistant;
	if (api) {
		return api;
	}

	throw new Error("Electron preload bridge is unavailable. Restart the desktop app window.");
}

export const apiClient: JobAssistantApi = new Proxy({} as JobAssistantApi, {
	get(_target, prop) {
		const api = resolveApiClient();
		return api[prop as keyof JobAssistantApi];
	}
});
