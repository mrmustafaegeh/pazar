'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AuthFieldIcon, AuthFormField, authInputClass } from '@/components/auth/AuthCard';

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  onBlur,
  delay = 0,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  onBlur?: () => void;
  delay?: number;
}) {
  const t = useTranslations('auth.common');
  const [visible, setVisible] = useState(false);

  return (
    <AuthFormField label={label} error={error} delay={delay}>
      <div className="relative group">
        <AuthFieldIcon position="start">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </AuthFieldIcon>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`${authInputClass(Boolean(error))} ps-11`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-navy"
          aria-label={visible ? t('hidePassword') : t('showPassword')}
        >
          {visible ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029M6.223 6.223A9.97 9.97 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </AuthFormField>
  );
}
