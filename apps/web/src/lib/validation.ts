import { ZodError, type ZodSchema } from 'zod';

type Translator = (key: string, values?: Record<string, string | number>) => string;

const ZOD_KEY_MAP: Record<string, string> = {
  'Geçerli bir e-posta adresi girin': 'validation.email.invalid',
  'Şifre en az 8 karakter olmalı': 'validation.password.minLength',
  'Şifre en az bir büyük harf içermeli': 'validation.password.uppercase',
  'Şifre en az bir rakam içermeli': 'validation.password.digit',
  'Telefon numarası +90XXXXXXXXXX formatında olmalı': 'validation.phone.format',
  'Doğrulama kodu 6 haneli olmalı': 'validation.otp.length',
  '2FA kodu 6 haneli olmalı': 'validation.twoFa.length',
  'KVKK talebi için onay gerekli': 'validation.kvkk.confirmation',
  'Silme talebi için onay gerekli': 'validation.kvkk.confirmation',
};

const FIELD_KEY_MAP: Record<string, string> = {
  email: 'validation.email.invalid',
  phone: 'validation.phone.format',
  title: 'validation.listing.title',
  description: 'validation.listing.description',
  categoryId: 'validation.listing.category',
  subject: 'validation.ticket.subject',
  body: 'validation.ticket.body',
  reason: 'validation.ticket.reason',
  listingId: 'validation.ticket.listingId',
  price: 'validation.listing.price',
  city: 'validation.listing.city',
  district: 'validation.listing.district',
};

function translateByCode(issue: ZodError['issues'][number], t: Translator): string | null {
  switch (issue.code) {
    case 'too_small':
      return t('validation.required');
    case 'too_big':
      return t('validation.tooLong');
    case 'invalid_type':
      return t('validation.required');
    case 'invalid_string':
      if (issue.validation === 'email') return t('validation.email.invalid');
      return t('validation.invalid');
    case 'invalid_enum_value':
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

  const path = issue.path.map(String).join('.');
  const field = String(issue.path[0] ?? '');

  if (field === 'password') {
    if (issue.code === 'too_small') return t('validation.password.required');
    if (issue.code === 'invalid_string') {
      const mapped = typeof issue.message === 'string' ? ZOD_KEY_MAP[issue.message] : undefined;
      if (mapped) return t(mapped);
      return t('validation.password.invalid');
    }
    return t('validation.password.invalid');
  }

  if (path.startsWith('attributes.')) {
    if (issue.code === 'too_small') {
      if (issue.type === 'number') return t('validation.attribute.min');
      return t('validation.attribute.required');
    }
    if (issue.code === 'too_big') return t('validation.attribute.max');
    if (issue.code === 'invalid_type' || issue.code === 'invalid_enum_value') {
      return t('validation.attribute.required');
    }
    return t('validation.attribute.invalid');
  }

  if (FIELD_KEY_MAP[field]) return t(FIELD_KEY_MAP[field]);

  const byCode = translateByCode(issue, t);
  if (byCode) return byCode;

  return t('validation.generic');
}

export function collectFieldErrors(
  error: ZodError,
  t: Translator,
  keyFn: (issue: ZodError['issues'][number]) => string = (issue) =>
    issue.path.map(String).join('.') || '_form',
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = keyFn(issue);
    if (!errors[key]) {
      errors[key] = formatZodError(new ZodError([issue]), t);
    }
  }
  return errors;
}

export function safeParse<T>(schema: ZodSchema<T>, data: unknown, t: Translator) {
  const result = schema.safeParse(data);
  if (result.success) return { success: true as const, data: result.data };
  return { success: false as const, error: formatZodError(result.error, t) };
}

export function formatApiError(message: string, t: Translator): string {
  const apiMap: Record<string, string> = {
    'API bağlantısı kurulamadı': 'errors.apiConnection',
    'API error': 'errors.apiGeneric',
    'Görsel yüklenemedi': 'errors.imageUpload',
    'Geçersiz kimlik bilgileri': 'errors.loginFailed',
    'E-posta veya telefon zaten kayıtlı': 'errors.alreadyRegistered',
    'Kayıt şu anda kapalı': 'errors.registrationClosed',
    'CSRF token invalid or missing': 'errors.csrf',
    'Authentication required': 'errors.sessionExpired',
    'Refresh token cookie missing': 'errors.sessionExpired',
    'İlan vermek için telefon doğrulaması gerekli': 'errors.phoneVerifyRequired',
    'Geçerli OTP bulunamadı': 'errors.otpInvalid',
    'Geçersiz doğrulama kodu': 'errors.otpInvalid',
    'OTP zaten gönderildi, lütfen bekleyin': 'errors.otpRateLimit',
    'Çok fazla deneme, yeni kod isteyin': 'errors.otpTooManyAttempts',
    'Kendinizle mesajlaşamazsınız': 'errors.cannotMessageSelf',
    'Konuşma bulunamadı': 'errors.conversationNotFound',
    'Invalid request': 'errors.apiGeneric',
    'Internal server error': 'errors.apiGeneric',
  };
  return apiMap[message] ? t(apiMap[message]) : message;
}
