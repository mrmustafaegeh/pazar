'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { verify2faSchema } from '@turkiye-pazaryeri/types';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { collectFieldErrors, formatApiError, safeParse } from '@/lib/validation';
import { AuthShell } from '@/components/auth/AuthShell';
import {
  AuthCard,
  AuthFieldError,
  AuthHeading,
  AuthSpinner,
} from '@/components/auth/AuthCard';
import { OtpInput } from '@/components/auth/OtpInput';
import { clearTemp2faToken, readTemp2faToken } from '@/lib/auth-session';

export default function TwoFactorPage() {
  const router = useRouter();
  const t = useTranslations('auth.twoFa');
  const tCommon = useTranslations('common');
  const tAll = useTranslations();
  const [code, setCode] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const isDevPreview =
      process.env.NODE_ENV === 'development' &&
      new URLSearchParams(window.location.search).get('preview') === '1';

    if (isDevPreview) {
      setTempToken('preview');
      return;
    }

    const token = readTemp2faToken();
    if (!token) {
      router.replace('/giris');
      return;
    }
    setTempToken(token);
  }, [router]);

  const verify = useCallback(
    async (submittedCode: string) => {
      if (!tempToken || submittedCode.length !== 6) return;

      setError('');
      setFieldError('');
      setLoading(true);

      const parsed = safeParse(verify2faSchema, { code: submittedCode }, tAll);
      if (!parsed.success) {
        const result = verify2faSchema.safeParse({ code: submittedCode });
        if (!result.success) {
          const errors = collectFieldErrors(result.error, tAll);
          setFieldError(errors.code ?? parsed.error);
        } else {
          setFieldError(parsed.error);
        }
        setLoading(false);
        return;
      }

      try {
        if (tempToken === 'preview') {
          setHasError(true);
          setCode('');
          setError(t('invalidCode'));
          setLoading(false);
          return;
        }

        const res = await api.verify2fa({ tempToken, code: parsed.data.code });
        clearTemp2faToken();
        setToken(res.accessToken);
        router.push('/');
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? formatApiError(err.message, tAll) : t('failed');
        if (message.includes('session') || message.includes('oturum') || message.includes('جلسة')) {
          clearTemp2faToken();
          router.replace('/giris');
          return;
        }
        setHasError(true);
        setCode('');
        setError(t('invalidCode'));
      } finally {
        setLoading(false);
      }
    },
    [tempToken, t, tAll, router],
  );

  if (!tempToken) return null;

  return (
    <AuthShell compact>
      <AuthCard>
        <div className="mb-6 flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </span>
        </div>

        <AuthHeading title={t('title')} subtitle={t('subtitle')} />

        <div className="space-y-5">
          <OtpInput
            value={code}
            onChange={(next) => {
              setCode(next);
              setHasError(false);
              setError('');
            }}
            onComplete={verify}
            error={hasError}
            disabled={loading}
          />

          <AuthFieldError message={error || fieldError} />

          <p className="text-center text-xs text-neutral-500">{t('totpHint')}</p>

          <button
            type="button"
            disabled={loading || code.length !== 6}
            onClick={() => verify(code)}
            className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {loading ? <AuthSpinner /> : t('verify')}
          </button>

          <button
            type="button"
            onClick={() => {
              clearTemp2faToken();
              router.push('/giris');
            }}
            className="w-full text-sm text-neutral-500 transition-colors hover:text-navy"
          >
            {tCommon('back')}
          </button>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
