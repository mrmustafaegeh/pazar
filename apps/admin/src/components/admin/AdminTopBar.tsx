'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { clearToken, getToken } from '@/lib/auth';

export function AdminTopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const t = useTranslations('header');
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).get('preview') === '1') {
      setEmail('admin@preview.local');
      return;
    }
    const token = getToken();
    if (!token) return;
    api.me(token).then((user) => setEmail(user.email)).catch(() => setEmail(null));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function logout() {
    clearToken();
    router.push('/giris');
  }

  const initial = email ? email[0]?.toUpperCase() : '?';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4 md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-xs text-neutral-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-muted"
          aria-label={t('notifications')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2 py-1.5 transition-colors hover:bg-muted"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
              {initial}
            </span>
            {email && <span className="hidden max-w-[10rem] truncate text-sm text-foreground md:block">{email}</span>}
            <svg className="hidden h-4 w-4 text-neutral-500 md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div role="menu" className="absolute end-0 z-50 mt-1 min-w-[12rem] rounded-lg border border-border bg-white py-1 shadow-lg">
              <p className="border-b border-border px-3 py-2 text-xs text-neutral-500">{t('signedInAs')}</p>
              <p className="truncate px-3 py-2 text-sm font-medium text-foreground">{email ?? '—'}</p>
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="w-full cursor-pointer px-3 py-2 text-start text-sm text-destructive transition-colors hover:bg-red-50"
              >
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
