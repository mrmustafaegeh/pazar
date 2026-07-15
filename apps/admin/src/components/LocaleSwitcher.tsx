'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const t = useTranslations('locale');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next });
  }

  return (
    <div
      className={`flex items-center gap-0.5 rounded-xl border p-0.5 ${
        variant === 'light'
          ? 'border-border bg-surface'
          : 'border-white/10 bg-white/10'
      }`}
      role="group"
      aria-label={t('switch')}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
            locale === loc
              ? 'bg-primary text-white shadow-sm'
              : variant === 'light'
                ? 'text-foreground/70 hover:bg-muted hover:text-foreground'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          aria-pressed={locale === loc}
        >
          {t(loc)}
        </button>
      ))}
    </div>
  );
}
