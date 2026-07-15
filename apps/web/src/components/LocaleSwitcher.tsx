'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { HeaderDropdown } from '@/components/HeaderDropdown';

export function LocaleSwitcher({
  variant = 'compact',
}: {
  variant?: 'compact' | 'full';
}) {
  const t = useTranslations('locale');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const options = routing.locales.map((loc) => ({
    value: loc,
    label: t(`${loc}Full`),
    short: t(loc),
  }));

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next });
  }

  return (
    <HeaderDropdown
      ariaLabel={t('switch')}
      value={locale}
      options={options}
      onChange={switchLocale}
      variant={variant}
    />
  );
}
