export type LoginPayload = { email: string; password: string };
export type EmailVerifySendPayload = { email: string };
export type EmailVerifyConfirmPayload = { email: string; code: string };
export type SignUpPayload = { email: string; password: string; nickname: string };
export type SignUpResponse = { id: number; email: string; nickname: string };
