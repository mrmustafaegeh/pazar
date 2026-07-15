'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface SearchBarProps {
  defaultQuery?: string;
  variant?: 'default' | 'hero' | 'header';
  showPopular?: boolean;
  visible?: boolean;
  light?: boolean;
}

const POPULAR_KEYS = ['iphone', 'apartment', 'car'] as const;

export function SearchBar({
  defaultQuery = '',
  variant = 'default',
  showPopular = false,
  visible = true,
  light = false,
}: SearchBarProps) {
  const t = useTranslations('search');
  const tHome = useTranslations('home');
  const router = useRouter();

  function search(query: string) {
    const q = query.trim();
    router.push(q ? `/ara?q=${encodeURIComponent(q)}` : '/ara');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    search(String(form.get('q') ?? ''));
  }

  const isHero = variant === 'hero';
  const isHeader = variant === 'header';

  if (isHeader) {
    return (
      <div
        className={`hidden min-w-0 flex-1 transition-opacity duration-300 lg:block ${
          visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <form
          onSubmit={handleSubmit}
          className={`group/header-search mx-auto flex w-full max-w-sm items-center gap-2 rounded-lg border px-3 py-2 transition-[max-width,box-shadow,border-color,background-color] duration-300 ease-out focus-within:max-w-xl focus-within:shadow-sm ${
            light
              ? 'border-white/30 bg-white/10 focus-within:border-white/50 focus-within:bg-white/20'
              : 'border-border bg-muted/40 focus-within:border-navy/25 focus-within:bg-white'
          }`}
        >
          <svg
            className={`h-4 w-4 shrink-0 ${light ? 'text-white/70' : 'text-neutral-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            name="q"
            type="search"
            defaultValue={defaultQuery}
            placeholder={t('placeholder')}
            className={`min-w-0 flex-1 border-0 bg-transparent py-0.5 text-sm focus:outline-none focus:ring-0 ${
              light ? 'text-white placeholder:text-white/60' : 'text-foreground placeholder:text-neutral-500'
            }`}
            aria-label={t('placeholder')}
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity duration-200 group-focus-within/header-search:opacity-100 hover:bg-navy/90"
          >
            {t('title')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={isHero ? 'w-full' : ''}>
      <form
        onSubmit={handleSubmit}
        className={`flex flex-col gap-2 sm:flex-row sm:gap-2 ${
          isHero
            ? 'overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_8px_32px_rgba(18,41,75,0.18)] ring-1 ring-white/50'
            : 'card-glass p-2'
        }`}
      >
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy/45"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            name="q"
            type="search"
            defaultValue={defaultQuery}
            placeholder={t('placeholder')}
            className={`input-field w-full border-0 ps-12 shadow-none focus:ring-0 ${
              isHero ? 'bg-transparent py-3.5 text-base text-foreground sm:py-4' : ''
            }`}
            aria-label={t('placeholder')}
          />
        </div>
        <button
          type="submit"
          className={`shrink-0 font-heading font-semibold text-white ${
            isHero
              ? 'rounded-xl bg-navy px-6 py-3.5 text-sm hover:bg-navy/90 sm:px-8 sm:py-4 sm:text-base'
              : 'btn-primary px-5 py-3 text-sm'
          }`}
        >
          {t('title')}
        </button>
      </form>

      {showPopular && (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
          <span className="text-sm font-medium text-white/80">{tHome('popularLabel')}</span>
          {POPULAR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => search(tHome(`popular.${key}`))}
              className="cursor-pointer rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm font-medium text-white/95 backdrop-blur-sm transition-colors hover:border-white/45 hover:bg-white/15"
            >
              {tHome(`popular.${key}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
