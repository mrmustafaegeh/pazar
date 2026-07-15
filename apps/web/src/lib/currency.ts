export const CURRENCIES = ['TRY', 'USD', 'EUR'] as const;
export type DisplayCurrency = (typeof CURRENCIES)[number];

export const CURRENCY_COOKIE = 'tp_currency';
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Static display rates — listing amounts are stored in their native currency (usually TRY). */
const RATES_TO_TRY: Record<string, number> = {
  TRY: 1,
  USD: 32,
  EUR: 35,
};

export function isDisplayCurrency(value: string): value is DisplayCurrency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function convertToDisplayCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: DisplayCurrency,
): number {
  const fromRate = RATES_TO_TRY[fromCurrency] ?? 1;
  const toRate = RATES_TO_TRY[toCurrency] ?? 1;
  const amountInTry = amount * fromRate;
  return Math.round(amountInTry / toRate);
}

export function setDisplayCurrencyCookie(currency: DisplayCurrency) {
  document.cookie = `${CURRENCY_COOKIE}=${currency};path=/;max-age=${CURRENCY_COOKIE_MAX_AGE};SameSite=Lax`;
}
