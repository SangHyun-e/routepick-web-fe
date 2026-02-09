import { z } from 'zod';

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
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .max(72, '비밀번호는 72자 이하로 입력하세요')
    .regex(/^\S+$/, '비밀번호는 공백을 포함할 수 없습니다'),
  nickname: z.string().min(1, '닉네임을 입력하세요').max(40, '닉네임은 40자 이하입니다'),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
