'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const PANEL_IMAGE =
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600&q=85&auto=format&fit=crop';

interface AuthShellProps {
  children: ReactNode;
  compact?: boolean;
}

function AuthMobileBar() {
  const t = useTranslations('auth.shell');
  const tCommon = useTranslations('common');

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-4 py-4 md:px-6 lg:hidden">
      <Link
        href="/"
        className="font-heading text-lg font-bold tracking-tight text-navy transition-opacity hover:opacity-80"
      >
        {t('brand')}
      </Link>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-navy"
      >
        <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {tCommon('back')}
      </Link>
    </div>
  );
}

export function AuthShell({ children, compact = false }: AuthShellProps) {
  const t = useTranslations('auth.shell');
  const tCommon = useTranslations('common');
  const reduced = useReducedMotion();

  const trustKeys = ['trust1', 'trust2', 'trust3', 'trust4'] as const;

  return (
    <div className="grid min-h-dvh bg-neutral-50 lg:grid-cols-2">
      {/* Form — first column (start side in RTL) */}
      <div className="flex min-h-dvh flex-col">
        <AuthMobileBar />

        <div
          className={`flex flex-1 items-center justify-center px-4 py-8 md:px-8 ${
            compact ? 'md:py-10' : 'md:py-12 lg:py-16'
          }`}
        >
          <div className={`w-full ${compact ? 'max-w-sm' : 'max-w-md'}`}>{children}</div>
        </div>
      </div>

      {/* Navy brand panel — desktop only */}
      <aside className="relative hidden min-h-dvh overflow-hidden lg:flex lg:flex-col">
        <Image src={PANEL_IMAGE} alt="" fill className="object-cover" sizes="50vw" priority />
        <div className="absolute inset-0 bg-navy/75" aria-hidden />

        <div className="relative z-20 flex shrink-0 items-center justify-between px-8 py-6 xl:px-12">
          <Link
            href="/"
            className="font-heading text-xl font-bold tracking-tight text-white transition-opacity hover:opacity-85"
          >
            {t('brand')}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15"
          >
            <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {tCommon('back')}
          </Link>
        </div>

        <motion.div
          className="relative z-10 flex flex-1 flex-col justify-center px-8 pb-12 xl:px-12"
          initial={reduced ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto w-full max-w-md space-y-8">
            <div>
              <h2 className="font-heading text-3xl font-semibold leading-tight text-white xl:text-4xl">
                {t('headline')}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/80 md:text-base">{t('subheadline')}</p>
            </div>

            <ul className="space-y-3 text-sm text-white/90">
              {trustKeys.map((key) => (
                <li key={key} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </aside>
    </div>
  );
}
