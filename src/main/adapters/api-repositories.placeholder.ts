import type { Repositories } from "./repositories";

export function createApiRepositoriesPlaceholder(): Repositories {
  throw new Error(
    "API repositories are not implemented in Phase 1. Local SQLite repositories are the active adapter."
  );
}
