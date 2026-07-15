import { z } from 'zod';

const emailField = z
  .string()
  .email('Geçerli bir e-posta adresi girin')
  .transform((value) => value.trim().toLowerCase());

export const RoleSchema = z.enum([
  'USER',
  'MODERATOR',
  'SUPPORT',
  'FINANCE',
  'SUPER_ADMIN',
]);

export const registerSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermeli')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermeli'),
  phone: z
    .string()
    .regex(/^\+90[0-9]{10}$/, 'Telefon numarası +90XXXXXXXXXX formatında olmalı'),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
});

export const verifyPhoneSchema = z.object({
  phone: z.string().regex(/^\+90[0-9]{10}$/),
  code: z.string().length(6, 'Doğrulama kodu 6 haneli olmalı'),
});

export const sendPhoneOtpSchema = z.object({
  phone: z.string().regex(/^\+90[0-9]{10}$/),
});

export const verify2faSchema = z.object({
  code: z.string().length(6, '2FA kodu 6 haneli olmalı'),
});

export const setup2faSchema = z.object({
  code: z.string().length(6, '2FA kodu 6 haneli olmalı'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type SendPhoneOtpInput = z.infer<typeof sendPhoneOtpSchema>;
export type Verify2faInput = z.infer<typeof verify2faSchema>;
export type Setup2faInput = z.infer<typeof setup2faSchema>;

export interface AuthTokensResponse {
  accessToken: string;
  expiresIn: number;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  roles: string[];
  totpEnabled: boolean;
}

export interface LoginResponse {
  user: AuthUserResponse;
  accessToken: string;
  expiresIn: number;
  requires2fa?: boolean;
  tempToken?: string;
}

export interface Setup2faResponse {
  secret: string;
  otpauthUrl: string;
}
