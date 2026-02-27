// feature/auth/api.ts
import { bffFetch } from '@/lib/bffFetch';
import {
  EmailVerifyConfirmPayload,
  EmailVerifySendPayload,
  LoginPayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
  SignUpPayload,
  SignUpResponse,
} from '@/feature/auth/types';
import { ApiResult } from '@/types/http';

type ApiFieldError = { field?: string; reason?: string };
type ApiErrorBody = { code?: string; message?: string; errors?: ApiFieldError[] };
type KakaoAuthorizeUrlResponse = { authorizeUrl?: string };
type KakaoLogoutUrlResponse = { logoutUrl?: string };

const EMAIL_VERIFY_ERROR_MESSAGES: Record<string, string> = {
  'AUTH-410': '인증코드가 올바르지 않습니다. 다시 확인해주세요.',
  'AUTH-411': '인증코드가 만료되었습니다. 새 코드를 요청해주세요.',
  'AUTH-429': '인증 시도 횟수를 초과했습니다. 새 코드를 요청해주세요.',
};

const SIGNUP_ERROR_MESSAGES: Record<string, string> = {
  'USER-409': '이미 사용 중인 이메일입니다.',
  'USER-410': '이미 사용 중인 닉네임입니다.',
  'USER-414': '탈퇴 후 7일간 재가입할 수 없습니다.',
};

const PASSWORD_RESET_ERROR_MESSAGES: Record<string, string> = {
  'AUTH-420': '코드가 올바르지 않습니다.',
  'AUTH-421': '코드가 만료되었습니다. 다시 요청해주세요.',
  'AUTH-430': '시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
};

function resolveEmailVerifyMessage(
  res: Response,
  body: ApiErrorBody | null,
  fallback: string,
): string {
  const code = body?.code;
  if (code && EMAIL_VERIFY_ERROR_MESSAGES[code]) {
    return EMAIL_VERIFY_ERROR_MESSAGES[code];
  }
  if (res.status === 404) {
    return '가입된 계정을 찾을 수 없습니다.';
  }
  if (res.status === 409) {
    return body?.message ?? '이미 인증이 완료된 이메일입니다.';
  }
  if (res.status === 400) {
    return body?.message ?? '요청 정보를 확인해주세요.';
  }
  return body?.message ?? fallback;
}

function resolveSignUpMessage(res: Response, body: ApiErrorBody | null): string {
  const code = body?.code;
  if (code && SIGNUP_ERROR_MESSAGES[code]) {
    return SIGNUP_ERROR_MESSAGES[code];
  }
  if (res.status === 400) {
    return body?.message ?? '입력 정보를 확인해주세요.';
  }
  return body?.message ?? '회원가입 중 오류가 발생했습니다.';
}

function resolvePasswordResetMessage(res: Response, body: ApiErrorBody | null): string {
  const code = body?.code;
  if (code && PASSWORD_RESET_ERROR_MESSAGES[code]) {
    return PASSWORD_RESET_ERROR_MESSAGES[code];
  }
  const firstError = body?.errors?.[0]?.reason;
  if (res.status === 400 && firstError) {
    return firstError;
  }
  return body?.message ?? '비밀번호 재설정 중 오류가 발생했습니다.';
}

export async function login(payload: LoginPayload): Promise<ApiResult<void>> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  if (res.ok) return { ok: true, data: undefined };
  if (res.status === 401 || res.status === 400) {
    return { ok: false, status: res.status, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }
  const err = await res.json().catch(() => null);
  return {
    ok: false,
    status: res.status,
    message: err?.message ?? '로그인 중 오류가 발생했습니다.',
  };
}

export async function getKakaoAuthorizeUrl(state?: string): Promise<ApiResult<string>> {
  const search = state ? `?state=${encodeURIComponent(state)}` : '';
  const res = await bffFetch(`/api/proxy/auth/oauth/kakao/authorize-url${search}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (res.ok) {
    const data = (await res.json().catch(() => null)) as KakaoAuthorizeUrlResponse | null;
    if (data?.authorizeUrl) {
      return { ok: true, data: data.authorizeUrl };
    }
    return { ok: false, status: res.status, message: '카카오 인증 URL을 찾을 수 없습니다.' };
  }

  const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return {
    ok: false,
    status: res.status,
    message: err?.message ?? '카카오 로그인 준비 중 오류가 발생했습니다.',
  };
}

export async function loginWithKakao(code: string): Promise<ApiResult<void>> {
  const res = await fetch('/api/auth/kakao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({ code }),
  });

  if (res.ok) return { ok: true, data: undefined };
  const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return {
    ok: false,
    status: res.status,
    message: err?.message ?? '카카오 로그인 중 오류가 발생했습니다.',
  };
}

export async function getKakaoLogoutUrl(): Promise<ApiResult<string>> {
  const res = await bffFetch('/api/proxy/auth/oauth/kakao/logout-url', {
    method: 'GET',
    cache: 'no-store',
  });

  if (res.ok) {
    const data = (await res.json().catch(() => null)) as KakaoLogoutUrlResponse | null;
    if (data?.logoutUrl) {
      return { ok: true, data: data.logoutUrl };
    }
    return { ok: false, status: res.status, message: '카카오 로그아웃 URL을 찾을 수 없습니다.' };
  }

  const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return {
    ok: false,
    status: res.status,
    message: err?.message ?? '카카오 로그아웃 준비 중 오류가 발생했습니다.',
  };
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });
}

export async function signUp(payload: SignUpPayload): Promise<ApiResult<SignUpResponse>> {
  const res = await bffFetch('/api/proxy/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const data = (await res.json().catch(() => null)) as SignUpResponse | null;
    if (!data) {
      return {
        ok: false,
        status: res.status,
        message: '회원가입 응답을 처리하지 못했습니다.',
      };
    }
    return { ok: true, data };
  }

  const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return {
    ok: false,
    status: res.status,
    message: resolveSignUpMessage(res, err),
  };
}

export async function sendEmailVerifyCode(
  payload: EmailVerifySendPayload,
): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/auth/email/verify-code/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  if (res.ok) return { ok: true, data: undefined };
  const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return {
    ok: false,
    status: res.status,
    message: resolveEmailVerifyMessage(res, err, '인증 코드 요청 중 오류가 발생했습니다.'),
  };
}

export async function confirmEmailVerifyCode(
  payload: EmailVerifyConfirmPayload,
): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/auth/email/verify-code/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  if (res.ok) return { ok: true, data: undefined };
  const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return {
    ok: false,
    status: res.status,
    message: resolveEmailVerifyMessage(res, err, '인증 코드 확인 중 오류가 발생했습니다.'),
  };
}

export async function requestPasswordReset(
  payload: PasswordResetRequestPayload,
): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/auth/password/reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  if (res.ok) return { ok: true, data: undefined };
  const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return {
    ok: false,
    status: res.status,
    message: resolvePasswordResetMessage(res, err),
  };
}

export async function confirmPasswordReset(
  payload: PasswordResetConfirmPayload,
): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/auth/password/reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  if (res.ok) return { ok: true, data: undefined };
  const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
  return {
    ok: false,
    status: res.status,
    message: resolvePasswordResetMessage(res, err),
  };
}
