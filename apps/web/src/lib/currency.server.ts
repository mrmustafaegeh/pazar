import { cookies } from 'next/headers';
import { CURRENCY_COOKIE, type DisplayCurrency, isDisplayCurrency } from '@/lib/currency';

export async function getDisplayCurrency(): Promise<DisplayCurrency> {
  const cookieStore = await cookies();
  const value = cookieStore.get(CURRENCY_COOKIE)?.value;
  if (value && isDisplayCurrency(value)) return value;
  return 'TRY';
}
