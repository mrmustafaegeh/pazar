import { ZodError, type ZodSchema } from 'zod';

type Translator = (key: string, values?: Record<string, string | number>) => string;

const ZOD_KEY_MAP: Record<string, string> = {
  'Geçerli bir e-posta adresi girin': 'validation.email.invalid',
  '2FA kodu 6 haneli olmalı': 'validation.twoFa.length',
};

const FIELD_KEY_MAP: Record<string, string> = {
  email: 'validation.email.invalid',
  password: 'validation.password.required',
  code: 'validation.twoFa.length',
};

function translateByCode(issue: ZodError['issues'][number], t: Translator): string | null {
  switch (issue.code) {
    case 'too_small':
      return t('validation.required');
    case 'invalid_type':
      return t('validation.required');
    case 'invalid_string':
      if (issue.validation === 'email') return t('validation.email.invalid');
      return t('validation.invalid');
    default:
      return null;
  }
}

export function formatZodError(error: ZodError, t: Translator): string {
  const issue = error.issues[0];
  if (!issue) return t('validation.generic');

  if (typeof issue.message === 'string' && ZOD_KEY_MAP[issue.message]) {
    return t(ZOD_KEY_MAP[issue.message]);
  }

  const field = String(issue.path[0] ?? '');

  if (field === 'password' && issue.code === 'too_small') {
    return t('validation.password.required');
  }

  if (field === 'code') {
    return t('validation.twoFa.length');
  }

  if (FIELD_KEY_MAP[field]) return t(FIELD_KEY_MAP[field]);

  const byCode = translateByCode(issue, t);
  if (byCode) return byCode;

  return t('validation.generic');
}

export function collectFieldErrors(error: ZodError, t: Translator): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_form';
    if (!errors[key]) {
      errors[key] = formatZodError(new ZodError([issue]), t);
    }
  }
  return errors;
}

export function safeParse<T>(schema: ZodSchema<T>, data: unknown, t: Translator) {
  const result = schema.safeParse(data);
  if (result.success) return { success: true as const, data: result.data };
  return {
    success: false as const,
    error: formatZodError(result.error, t),
    fieldErrors: collectFieldErrors(result.error, t),
  };
}

export function formatApiError(message: string, t: Translator): string {
  const apiMap: Record<string, string> = {
    'API bağlantısı kurulamadı': 'errors.apiConnection',
    'API hatası': 'errors.apiGeneric',
    'Geçersiz kimlik bilgileri': 'errors.loginFailed',
    'Geçersiz 2FA kodu': 'errors.invalidTwoFaCode',
    'Invalid or expired 2FA session': 'errors.twoFaSessionExpired',
    '2FA etkin değil': 'errors.twoFaNotEnabled',
    '2FA kodu 6 haneli olmalı': 'validation.twoFa.length',
    'tempToken required': 'errors.twoFaSessionExpired',
    'Internal server error': 'errors.apiGeneric',
  };

  return apiMap[message] ? t(apiMap[message]) : message;
}
