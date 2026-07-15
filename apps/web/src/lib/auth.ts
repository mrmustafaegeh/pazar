'use client';

const TOKEN_KEY = 'access_token';
export const AUTH_CHANGED_EVENT = 'auth-changed';

function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  notifyAuthChanged();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  notifyAuthChanged();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function onAuthChanged(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUTH_CHANGED_EVENT, listener);
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, listener);
}
