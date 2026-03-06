import { z } from 'zod';

export const PASSWORD_POLICY_MESSAGE =
  '비밀번호는 8~20자이며 대문자, 소문자, 숫자, 특수문자를 모두 포함하고 공백을 사용할 수 없습니다.';
export const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*\s).{8,20}$/;
export const AGREEMENT_REQUIRED_MESSAGE =
  '이용약관 및 개인정보처리방침에 동의해야 회원가입이 가능합니다.';

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const emailVerifySendSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
});

export const emailVerifyConfirmSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  code: z
    .string()
    .regex(/^[0-9]{6}$/, '6자리 인증코드를 입력하세요'),
});

export type EmailVerifySendValues = z.infer<typeof emailVerifySendSchema>;
export type EmailVerifyConfirmValues = z.infer<typeof emailVerifyConfirmSchema>;

export const signUpSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE),
  confirmPassword: z.string().min(1, '비밀번호를 다시 입력하세요'),
  nickname: z.string().min(1, '닉네임을 입력하세요').max(40, '닉네임은 40자 이하입니다'),
  termsAgreement: z.boolean().refine((value) => value, {
    message: AGREEMENT_REQUIRED_MESSAGE,
  }),
  privacyAgreement: z.boolean().refine((value) => value, {
    message: AGREEMENT_REQUIRED_MESSAGE,
  }),
}).refine((values) => values.password === values.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
});

export const passwordResetConfirmSchema = z
  .object({
    email: z.string().email('유효한 이메일을 입력하세요'),
    code: z.string().regex(/^[0-9]{6}$/, '6자리 인증코드를 입력하세요'),
    newPassword: z.string().regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE),
    confirmPassword: z.string().min(1, '비밀번호를 다시 입력하세요'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export type PasswordResetRequestValues = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmValues = z.infer<typeof passwordResetConfirmSchema>;
