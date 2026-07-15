'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { registerSchema } from '@turkiye-pazaryeri/types';
import { api } from '@/lib/api';
import { collectFieldErrors, formatApiError, safeParse } from '@/lib/validation';
import { AuthShell } from '@/components/auth/AuthShell';
import {
  AuthCard,
  AuthFieldIcon,
  AuthFormField,
  AuthHeading,
  AuthSubmitButton,
  authInputClass,
} from '@/components/auth/AuthCard';
import { PasswordField } from '@/components/auth/PasswordField';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('auth.register');
  const tErrors = useTranslations('errors');
  const tAll = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('+90');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    const localErrors: Record<string, string> = {};
    if (password !== confirmPassword) {
      localErrors.confirmPassword = t('passwordMismatch');
    }
    if (!acceptedTerms) {
      localErrors.terms = t('termsRequired');
    }
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      setLoading(false);
      return;
    }

    const parsed = safeParse(registerSchema, { email, password, phone }, tAll);
    if (!parsed.success) {
      const result = registerSchema.safeParse({ email, password, phone });
      if (!result.success) {
        setFieldErrors(collectFieldErrors(result.error, tAll, (issue) => String(issue.path[0] ?? '_form')));
      }
      setError(parsed.error);
      setLoading(false);
      return;
    }

    try {
      await api.register(parsed.data);
      setSuccess(true);
      setTimeout(() => router.push('/giris'), 2000);
    } catch (err) {
      setError(err instanceof Error ? formatApiError(err.message, tAll) : tErrors('registerFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell>
        <AuthCard>
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <AuthHeading title={t('successTitle')} subtitle={t('successBody')} />
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading title={t('title')} />

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <AuthFormField label={t('email')} error={fieldErrors.email} delay={0.06}>
            <div className="relative group">
              <AuthFieldIcon position="start">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </AuthFieldIcon>
              <input
                type="email"
                className={`${authInputClass(Boolean(fieldErrors.email))} ps-11`}
                value={email}
                placeholder={t('emailPlaceholder')}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                aria-invalid={Boolean(fieldErrors.email)}
              />
            </div>
          </AuthFormField>

          <AuthFormField label={t('phone')} error={fieldErrors.phone} delay={0.12}>
            <div className="relative group">
              <AuthFieldIcon position="start">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </AuthFieldIcon>
              <input
                type="tel"
                className={`${authInputClass(Boolean(fieldErrors.phone))} ps-11`}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder={t('phonePlaceholder')}
                aria-invalid={Boolean(fieldErrors.phone)}
              />
            </div>
          </AuthFormField>

          <div>
            <PasswordField
              id="register-password"
              label={t('password')}
              value={password}
              placeholder={t('passwordPlaceholder')}
              error={fieldErrors.password}
              delay={0.18}
              onChange={(value) => {
                setPassword(value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
              }}
            />
            <PasswordStrength password={password} />
          </div>

          <PasswordField
            id="register-confirm-password"
            label={t('confirmPassword')}
            value={confirmPassword}
            placeholder={t('confirmPasswordPlaceholder')}
            error={fieldErrors.confirmPassword}
            delay={0.24}
            onChange={(value) => {
              setConfirmPassword(value);
              if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
          />

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (fieldErrors.terms) setFieldErrors((prev) => ({ ...prev, terms: '' }));
              }}
              className="mt-0.5 accent-navy"
            />
            <span className="text-xs leading-relaxed text-neutral-600">
              {t('termsPrefix')}{' '}
              <Link href="/kvkk" className="font-medium text-navy hover:underline">
                {t('termsLink')}
              </Link>{' '}
              {t('termsAnd')}{' '}
              <Link href="/kvkk" className="font-medium text-navy hover:underline">
                {t('privacyLink')}
              </Link>
            </span>
          </label>
          {fieldErrors.terms && <p className="text-sm text-red-600">{fieldErrors.terms}</p>}

          <AuthSubmitButton loading={loading}>{t('submit')}</AuthSubmitButton>

          <p className="text-center text-sm text-neutral-500">
            {t('hasAccount')}{' '}
            <Link href="/giris" className="font-semibold text-navy transition-colors hover:text-navy/80">
              {t('loginLink')}
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
