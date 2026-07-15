'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { HeaderDropdown } from '@/components/HeaderDropdown';
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

export function CurrencySwitcher({
  variant = 'compact',
}: {
  variant?: 'compact' | 'full';
}) {
  const t = useTranslations('currency');
  const router = useRouter();
  const [currency, setCurrency] = useState<DisplayCurrency>('TRY');

  useEffect(() => {
    setCurrency(readCurrencyCookie());
  }, []);

  const options = CURRENCIES.map((code) => ({
    value: code,
    label: t(code),
    short: code,
  }));

  function switchCurrency(next: string) {
    if (!isDisplayCurrency(next)) return;
    setCurrency(next);
    setDisplayCurrencyCookie(next);
    router.refresh();
  }

  return (
    <HeaderDropdown
      ariaLabel={t('switch')}
      value={currency}
      options={options}
      onChange={switchCurrency}
      variant={variant}
    />
  );
}
