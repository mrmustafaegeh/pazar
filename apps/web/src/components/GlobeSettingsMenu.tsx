'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import {
  CURRENCIES,
  CURRENCY_COOKIE,
  type DisplayCurrency,
  isDisplayCurrency,
  setDisplayCurrencyCookie,
} from '@/lib/currency';

function readCurrencyCookie(): DisplayCurrency {
  if (typeof document === 'undefined') return 'TRY';
  const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]*)`));
  const value = match?.[1];
  if (value && isDisplayCurrency(value)) return value;
  return 'TRY';
}

export function GlobeSettingsMenu({
  variant = 'compact',
  light = false,
}: {
  variant?: 'compact' | 'full';
  light?: boolean;
}) {
  const tLocale = useTranslations('locale');
  const tCurrency = useTranslations('currency');
  const tHeader = useTranslations('header');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<DisplayCurrency>('TRY');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrency(readCurrencyCookie());
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next });
  }

  function switchCurrency(next: DisplayCurrency) {
    setCurrency(next);
    setDisplayCurrencyCookie(next);
    router.refresh();
  }

  const triggerClass = light
    ? 'border border-white/25 bg-white/10 text-white hover:bg-white/15'
    : 'border border-border bg-muted/50 text-neutral-700 hover:bg-muted hover:text-navy';

  const localeLabel = locale.toUpperCase();

  return (
    <div className={`relative ${variant === 'full' ? 'w-full' : ''}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 transition-colors ${triggerClass} ${
          variant === 'full' ? 'w-full justify-between px-3' : ''
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={tHeader('settingsMenu')}
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        {variant === 'full' ? (
          <span className="text-sm font-medium">{tHeader('preferencesSection')}</span>
        ) : (
          <span className="text-xs font-semibold tracking-wide">
            {localeLabel} · {currency}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-white py-2 shadow-lg ${
            variant === 'full' ? 'inset-x-0' : 'end-0 min-w-[14rem]'
          }`}
        >
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {tHeader('languageSection')}
          </p>
          <div className="flex flex-wrap gap-1 px-2 pb-2">
            {routing.locales.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => switchLocale(loc)}
                className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  locale === loc ? 'bg-navy text-white' : 'bg-muted text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {tLocale(loc)}
              </button>
            ))}
          </div>

          <hr className="my-1 border-border" />

          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {tHeader('currencySection')}
          </p>
          {CURRENCIES.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitem"
              onClick={() => switchCurrency(code)}
              className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-start text-sm transition-colors ${
                currency === code ? 'bg-navy/8 font-semibold text-navy' : 'text-neutral-700 hover:bg-muted'
              }`}
            >
              <span>{tCurrency(code)}</span>
              {currency === code && (
                <svg className="h-4 w-4 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
