const TEMP_2FA_KEY = 'tp_temp_2fa';

export function storeTemp2faToken(token: string) {
  sessionStorage.setItem(TEMP_2FA_KEY, token);
}

export function readTemp2faToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TEMP_2FA_KEY);
}

export function clearTemp2faToken() {
  sessionStorage.removeItem(TEMP_2FA_KEY);
}
