'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { loginSchema, verify2faSchema } from '@turkiye-pazaryeri/types';
import { api } from '@/lib/api';
import { isAdminRole, setToken } from '@/lib/auth';
import { formatApiError, safeParse } from '@/lib/validation';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export default function LoginPage() {
  const t = useTranslations('auth');
  const tValidation = useTranslations();
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function clearErrors() {
    setError('');
    setFieldErrors({});
  }

  function showApiError(err: unknown, fallback: string) {
    const message = err instanceof Error ? err.message : fallback;
    const translated = formatApiError(message, tValidation);

    if (message.includes('Invalid or expired 2FA session') || message === 'tempToken required') {
      setTempToken(null);
      setCode('');
    }

    setError(translated || fallback);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();

    const parsed = safeParse(loginSchema, { email, password }, tValidation);
    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      return;
    }

    try {
      const res = await api.login(parsed.data);

      if (res.requires2fa && res.tempToken) {
        setTempToken(res.tempToken);
        setCode('');
        return;
      }

      if (!isAdminRole(res.user.roles)) {
        setError(t('notAdmin'));
        return;
      }

      setToken(res.accessToken);
      router.push('/');
    } catch (err) {
      showApiError(err, t('loginFailed'));
    }
  }

  async function handle2fa(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();
    if (!tempToken) return;

    const parsed = safeParse(verify2faSchema, { code }, tValidation);
    if (!parsed.success) {
      setFieldErrors(parsed.fieldErrors);
      setError(parsed.error);
      return;
    }

    try {
      const res = await api.verify2fa({ tempToken, code: parsed.data.code });
      if (!isAdminRole(res.user.roles)) {
        setError(t('notAdmin'));
        return;
      }
      setToken(res.accessToken);
      router.push('/');
    } catch (err) {
      showApiError(err, t('twoFaFailed'));
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[var(--color-sidebar)] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-heading text-lg font-bold text-white">
              TP
            </span>
            <div>
              <p className="font-heading text-xl font-bold text-white">Admin Panel</p>
              <p className="text-sm text-white/50">Türkiye Pazaryeri</p>
            </div>
          </div>
          <h2 className="mt-16 max-w-md font-heading text-4xl font-bold leading-tight text-white">
            Platform yönetimi ve moderasyon merkezi
          </h2>
          <p className="mt-4 max-w-sm text-white/60">
            İlan moderasyonu, kullanıcı yönetimi ve destek talepleri tek panelden.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          {['Moderasyon', 'Analitik'].map((label) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Modül</p>
              <p className="mt-1 font-heading text-lg font-bold text-white">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-end">
            <LocaleSwitcher variant="light" />
          </div>
          <div className="admin-card">
            <h1 className="font-heading text-2xl font-bold">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground/55">{t('subtitle')}</p>

            {error && (
              <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-red-50 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {!tempToken ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
                <label className="block">
                  <span className="text-sm font-semibold">{t('email')}</span>
                  <input
                    type="email"
                    className="input-field mt-1.5"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!fieldErrors.email}
                  />
                  <FieldError message={fieldErrors.email} />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">{t('password')}</span>
                  <input
                    type="password"
                    className="input-field mt-1.5"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <FieldError message={fieldErrors.password} />
                </label>
                <button type="submit" className="btn-primary w-full py-3">
                  {t('login')}
                </button>
              </form>
            ) : (
              <form onSubmit={handle2fa} className="mt-6 space-y-4" noValidate>
                <p className="text-sm text-foreground/70">{t('twoFaPrompt')}</p>
                {process.env.NODE_ENV === 'development' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <p>{t('twoFaDevHint')}</p>
                    <code className="mt-1 block break-all font-mono">{t('twoFaDevCommand')}</code>
                  </div>
                )}
                <label className="block">
                  <span className="text-sm font-semibold">{t('code')}</span>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="input-field mt-1.5 tracking-widest"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    aria-invalid={!!fieldErrors.code}
                  />
                  <FieldError message={fieldErrors.code} />
                </label>
                <button type="submit" className="btn-primary w-full py-3">
                  {t('verify')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempToken(null);
                    setCode('');
                    clearErrors();
                  }}
                  className="w-full cursor-pointer text-sm text-foreground/55 hover:text-foreground"
                >
                  {tCommon('back')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
