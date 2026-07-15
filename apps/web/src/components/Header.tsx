'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { clearToken, getToken, onAuthChanged } from '@/lib/auth';
import { SearchBar } from './SearchBar';
import { CategoriesMenu } from './CategoriesMenu';
import { GlobeSettingsMenu } from './GlobeSettingsMenu';
import { useChat } from './ChatProvider';

const SCROLL_SOLID_THRESHOLD = 60;

/** Solid navy CTA — uses theme token `navy` (#12294B), not accent/success greens */
const POST_LISTING_BTN =
  'inline-flex items-center justify-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy/90';

function UserAvatar() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-neutral-600">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </span>
  );
}

function NavLink({
  href,
  children,
  onClick,
  className = '',
  light = false,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  light?: boolean;
}) {
  const pathname = usePathname();
  const path = href.split('#')[0] || '/';
  const active =
    href.includes('#')
      ? pathname === '/'
      : path === '/'
        ? pathname === '/'
        : pathname.startsWith(path);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
        active
          ? light
            ? 'bg-white/15 text-white'
            : 'bg-primary/8 text-primary'
          : light
            ? 'text-white/85 hover:bg-white/10 hover:text-white'
            : 'text-neutral-600 hover:bg-muted hover:text-primary'
      } ${className}`}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}

function DesktopNav({ light = false }: { light?: boolean }) {
  const t = useTranslations('nav');

  return (
    <nav aria-label={t('mainNav')} className="hidden items-center gap-0.5 md:flex">
      <NavLink href="/" light={light}>
        {t('home')}
      </NavLink>
      <CategoriesMenu light={light} />
      <NavLink href="/destek" light={light}>
        {t('support')}
      </NavLink>
    </nav>
  );
}

function MessageInboxButton({ light = false }: { light?: boolean }) {
  const t = useTranslations('header');
  const { unreadCount } = useChat();

  return (
    <Link
      href="/mesajlar"
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
        light
          ? 'text-white/85 hover:bg-white/10 hover:text-white'
          : 'text-neutral-600 hover:bg-muted hover:text-primary'
      }`}
      aria-label={t('myMessages')}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

function UnreadBadge() {
  const { unreadCount } = useChat();
  if (!unreadCount) return null;
  return (
    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}

function ProfileMenu({ email, userId, light = false }: { email: string; userId: string | null; light?: boolean }) {
  const t = useTranslations('header');
  const tNav = useTranslations('nav');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function logout() {
    clearToken();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 transition-colors duration-200 ${
          light ? 'hover:bg-white/10' : 'hover:bg-muted'
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('openMenu')}
      >
        <UserAvatar />
        <svg
          className={`hidden h-4 w-4 transition-transform duration-200 sm:block ${open ? 'rotate-180' : ''} ${
            light ? 'text-white/70' : 'text-neutral-500'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 z-50 mt-2 min-w-[13rem] animate-fade-in rounded-lg border border-border bg-surface py-1 shadow-lg"
        >
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('account')}</p>
          <Link
            href={userId ? `/satici/${userId}` : '/kvkk'}
            role="menuitem"
            className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            {t('profile')}
          </Link>
          <Link
            href="/ilan-ver"
            role="menuitem"
            className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            {t('myListings')}
          </Link>
          <Link
            href="/mesajlar"
            role="menuitem"
            className="flex items-center justify-between px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <span>{t('myMessages')}</span>
            <UnreadBadge />
          </Link>
          <hr className="my-1.5 border-border" />
          <Link
            href="/kvkk"
            role="menuitem"
            className="block px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            {tNav('kvkk')}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="w-full cursor-pointer px-4 py-2 text-start text-sm text-destructive transition-colors hover:bg-red-50"
          >
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}

function AuthNav({ compact, light = false }: { compact?: boolean; light?: boolean }) {
  const t = useTranslations('nav');
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function loadUser() {
      setChecked(false);
      const token = getToken();
      if (!token) {
        setEmail(null);
        setUserId(null);
        setChecked(true);
        return;
      }
      api
        .me(token)
        .then((user) => {
          if (cancelled) return;
          const u = user as { email: string; id: string };
          setEmail(u.email);
          setUserId(u.id);
        })
        .catch(() => {
          if (cancelled) return;
          clearToken();
          setEmail(null);
          setUserId(null);
        })
        .finally(() => {
          if (!cancelled) setChecked(true);
        });
    }

    loadUser();
    const unsubscribe = onAuthChanged(loadUser);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!checked) return <span className="h-8 w-16 animate-pulse rounded-lg bg-muted" />;

  if (email) {
    return (
      <div className={`flex items-center gap-1 ${compact ? 'w-full flex-col' : ''}`}>
        {!compact && <MessageInboxButton light={light} />}
        <ProfileMenu email={email} userId={userId} light={light} />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex w-full flex-col gap-2">
        <Link
          href="/giris"
          className="w-full rounded-lg border border-border py-3 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-muted"
        >
          {t('login')}
        </Link>
        <Link href="/kayit" className={`w-full text-center ${POST_LISTING_BTN}`}>
          {t('register')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/giris"
        className={`px-2 py-2 text-sm font-medium transition-colors ${
          light ? 'text-white/90 hover:text-white' : 'text-neutral-600 hover:text-primary'
        }`}
      >
        {t('login')}
      </Link>
      <Link
        href="/kayit"
        className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
          light
            ? 'border-white/50 text-white hover:border-white/70 hover:bg-white/10'
            : 'border-navy text-navy hover:bg-navy/5'
        }`}
      >
        {t('register')}
      </Link>
    </div>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('nav');
  const tHeader = useTranslations('header');

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={tHeader('menuTitle')}>
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-neutral-950/30 backdrop-blur-sm"
        onClick={onClose}
        aria-label={tHeader('closeMenu')}
      />
      <div className="absolute end-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-s border-border bg-surface shadow-xl animate-slide-in-end">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="font-heading text-lg font-semibold text-primary">{tHeader('menuTitle')}</span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-neutral-600 transition-colors hover:bg-muted"
            aria-label={tHeader('closeMenu')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b border-border p-4">
          <SearchBar variant="default" />
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">{tHeader('browseSection')}</p>
          <NavLink href="/" onClick={onClose}>
            {t('home')}
          </NavLink>
          <div className="px-3 py-1">
            <CategoriesMenu onNavigate={onClose} />
          </div>
          <NavLink href="/destek" onClick={onClose}>
            {t('support')}
          </NavLink>

          <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">{tHeader('accountSection')}</p>
          <Link href="/ilan-ver" onClick={onClose} className={`mx-3 mb-2 ${POST_LISTING_BTN}`}>
            {t('postListing')}
          </Link>
          <div className="px-3">
            <AuthNav compact />
          </div>

          <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {tHeader('preferencesSection')}
          </p>
          <div className="px-3">
            <GlobeSettingsMenu variant="full" />
          </div>
        </nav>
      </div>
    </div>
  );
}

export function Header() {
  const t = useTranslations('nav');
  const tHeader = useTranslations('header');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroInView, setHeroInView] = useState(false);

  const isHome = pathname === '/';

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_SOLID_THRESHOLD);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) {
      setHeroInView(false);
      return;
    }

    const hero = document.getElementById('hero');
    if (!hero) return;

    function updateHeroVisibility() {
      const rect = hero!.getBoundingClientRect();
      // Show header search once the hero bottom clears the sticky header zone
      setHeroInView(rect.bottom > 80);
    }

    updateHeroVisibility();
    window.addEventListener('scroll', updateHeroVisibility, { passive: true });
    window.addEventListener('resize', updateHeroVisibility);
    return () => {
      window.removeEventListener('scroll', updateHeroVisibility);
      window.removeEventListener('resize', updateHeroVisibility);
    };
  }, [isHome, pathname]);

  const overlayHeader = isHome && !scrolled;
  const showHeaderSearch = !isHome || !heroInView;

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-[box-shadow,background-color,border-color] duration-200 ${
          scrolled
            ? 'border-b border-border bg-white shadow-sm'
            : overlayHeader
              ? 'border-b border-white/20 bg-navy/45 shadow-sm backdrop-blur-md'
              : 'border-b border-transparent bg-white/95 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 lg:h-16 lg:gap-4">
          <div className="flex shrink-0 items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className={`font-heading text-lg font-bold tracking-tight transition-opacity hover:opacity-80 lg:text-xl ${
                overlayHeader ? 'text-white' : 'text-primary'
              }`}
            >
              {tCommon('siteName')}
            </Link>
            <span
              className={`mx-1 hidden h-5 w-px lg:block ${overlayHeader ? 'bg-white/25' : 'bg-border'}`}
              aria-hidden
            />
            <DesktopNav light={overlayHeader} />
          </div>

          <SearchBar variant="header" visible={showHeaderSearch} light={overlayHeader && showHeaderSearch} />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <GlobeSettingsMenu light={overlayHeader} />
            <div className="hidden md:block">
              <AuthNav light={overlayHeader} />
            </div>
            <Link href="/ilan-ver" className={`hidden md:inline-flex ${POST_LISTING_BTN}`}>
              {t('postListing')}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={`cursor-pointer rounded-lg p-2 transition-colors md:hidden ${
                overlayHeader ? 'text-white hover:bg-white/10' : 'text-neutral-600 hover:bg-muted'
              }`}
              aria-label={tHeader('openMenu')}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/10 bg-navy text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <p className="flex items-center gap-2 font-heading text-xl font-extrabold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-bold text-white">
                TP
              </span>
              {t('brand')}
            </p>
            <p className="text-sm leading-relaxed text-gray-300">{t('tagline')}</p>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">{t('browseTitle')}</p>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><Link href="/ara" className="transition-colors hover:text-white">{tNav('search')}</Link></li>
              <li><Link href="/" className="transition-colors hover:text-white">{tNav('home')}</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">{t('sellTitle')}</p>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><Link href="/ilan-ver" className="transition-colors hover:text-white">{tNav('postListing')}</Link></li>
              <li><Link href="/destek" className="transition-colors hover:text-white">{tNav('support')}</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">{t('legalTitle')}</p>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><Link href="/kvkk" className="transition-colors hover:text-white">{tNav('kvkk')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-gray-400">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
