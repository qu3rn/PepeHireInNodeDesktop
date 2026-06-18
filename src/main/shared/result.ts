export interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T>(error: string): Result<T> {
  return { ok: false, error };
}
