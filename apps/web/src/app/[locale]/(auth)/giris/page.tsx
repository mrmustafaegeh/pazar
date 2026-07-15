'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { loginSchema } from '@turkiye-pazaryeri/types';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { collectFieldErrors, formatApiError, safeParse } from '@/lib/validation';
import { AuthShell } from '@/components/auth/AuthShell';
import {
  AuthCard,
  AuthDivider,
  AuthFieldIcon,
  AuthFormField,
  AuthHeading,
  AuthSubmitButton,
  authInputClass,
} from '@/components/auth/AuthCard';
import { PasswordField } from '@/components/auth/PasswordField';
import { storeTemp2faToken } from '@/lib/auth-session';

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('auth.login');
  const tErrors = useTranslations('errors');
  const tAll = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    const parsed = safeParse(loginSchema, { email, password }, tAll);
    if (!parsed.success) {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        setFieldErrors(collectFieldErrors(result.error, tAll, (issue) => String(issue.path[0] ?? '_form')));
      }
      setError(parsed.error);
      setLoading(false);
      return;
    }

    try {
      const res = await api.login(parsed.data);

      if (res.requires2fa && res.tempToken) {
        storeTemp2faToken(res.tempToken);
        router.push('/giris/2fa');
        return;
      }

      if (!res.accessToken) throw new Error(tErrors('loginFailed'));
      setToken(res.accessToken);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? formatApiError(err.message, tAll) : tErrors('loginFailed'));
    } finally {
      setLoading(false);
    }
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

          <PasswordField
            id="login-password"
            label={t('password')}
            value={password}
            placeholder={t('passwordPlaceholder')}
            error={fieldErrors.password}
            delay={0.12}
            onChange={(value) => {
              setPassword(value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
            }}
          />

          <div className="text-end">
            <Link href="/destek" className="text-sm text-neutral-500 transition-colors hover:text-navy">
              {t('forgotPassword')}
            </Link>
          </div>

          <AuthSubmitButton loading={loading}>{t('submit')}</AuthSubmitButton>

          <AuthDivider label={t('or')} />

          <Link href="/destek" className="btn-secondary flex h-12 w-full items-center justify-center text-sm">
            {t('phoneLogin')}
          </Link>

          <p className="text-center text-sm text-neutral-500">
            {t('noAccount')}{' '}
            <Link href="/kayit" className="font-semibold text-navy transition-colors hover:text-navy/80">
              {t('registerLink')}
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
