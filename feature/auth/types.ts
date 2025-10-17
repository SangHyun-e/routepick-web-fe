export type LoginPayload = { email: string; password: string };
export type ApiResult<T = unknown> = { ok: true; data?: T } | { ok: false; message: string };
