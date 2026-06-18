import type { PaginatedResult } from "./types";

export function normalizePagination(page = 1, pageSize = 25): { page: number; pageSize: number } {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : 25;
  return { page: safePage, pageSize: safePageSize };
}

export function paginate<T>(items: T[], page = 1, pageSize = 25): PaginatedResult<T> {
  const normalized = normalizePagination(page, pageSize);
  const start = (normalized.page - 1) * normalized.pageSize;
  const paged = items.slice(start, start + normalized.pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / normalized.pageSize));

  return {
    items: paged,
    page: normalized.page,
    pageSize: normalized.pageSize,
    total: items.length,
    totalPages
  };
}
