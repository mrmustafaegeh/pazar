'use client';

import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function AuthCard({ children, showBrand = false }: { children: ReactNode; showBrand?: boolean }) {
  const t = useTranslations('common');
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="rounded-2xl bg-white p-6 shadow-lg sm:p-8"
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {showBrand && (
        <p className="mb-6 text-center font-heading text-lg font-bold text-navy">{t('siteName')}</p>
      )}
      {children}
    </motion.div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 text-center">
      <h1 className="font-heading text-2xl font-semibold text-navy">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>}
    </div>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs font-medium text-neutral-500">{label}</span>
      </div>
    </div>
  );
}

export function AuthSpinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function AuthFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-600">{message}</p>;
}

export function authInputClass(hasError?: boolean) {
  return `h-12 w-full rounded-lg border bg-white px-4 text-sm transition-all duration-200 placeholder:text-neutral-400 ${
    hasError
      ? 'border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20'
      : 'border-border focus:border-navy focus:ring-2 focus:ring-[#12294B]/20'
  } focus:outline-none`;
}

export function AuthFieldIcon({ children, position = 'start' }: { children: React.ReactNode; position?: 'start' | 'end' }) {
  return (
    <span
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-navy ${
        position === 'start' ? 'start-3' : 'end-3'
      }`}
    >
      {children}
    </span>
  );
}

export function AuthSubmitButton({
  loading,
  children,
}: {
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-primary flex h-12 w-full items-center justify-center gap-2 text-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-neutral-300 disabled:shadow-none"
    >
      {loading ? <AuthSpinner /> : children}
    </button>
  );
}

export function AuthFormField({
  label,
  error,
  children,
  delay = 0,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="group block space-y-1.5"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <label className="text-sm font-medium text-neutral-600 transition-colors duration-200 group-focus-within:text-navy">
        {label}
      </label>
      {children}
      <AuthFieldError message={error} />
    </motion.div>
  );
}
