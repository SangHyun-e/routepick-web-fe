export type ApiResult<T = unknown> = { ok: true; data?: T } | { ok: false; message: string };
