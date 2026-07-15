'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const CATEGORY_SLUGS = ['vasita', 'emlak', 'elektronik', 'is', 'hizmet', 'mobilya'] as const;

export function CategoriesMenu({
  onNavigate,
  light = false,
  label,
}: {
  onNavigate?: () => void;
  light?: boolean;
  label?: string;
}) {
  const tNav = useTranslations('nav');
  const tCatalog = useTranslations('catalog.categories');
  const tHeader = useTranslations('header');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = pathname.startsWith('/kategori');
  const buttonLabel = label ?? tNav('browseCategories');

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  function openMenu() {
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
          active
            ? light
              ? 'bg-white/15 text-white'
              : 'bg-navy/8 text-navy'
            : light
              ? 'text-white/85 hover:bg-white/10 hover:text-white'
              : 'text-neutral-600 hover:bg-muted hover:text-navy'
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span>{buttonLabel}</span>
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
          className="absolute start-0 z-50 mt-1.5 w-[min(100vw-2rem,16rem)] animate-fade-in overflow-hidden rounded-xl border border-border bg-white py-1.5 shadow-lg"
        >
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {tHeader('categoriesBrowse')}
          </p>
          {CATEGORY_SLUGS.map((slug) => (
            <Link
              key={slug}
              href={`/kategori/${slug}`}
              role="menuitem"
              onClick={close}
              className={`block px-3 py-2 text-sm transition-colors hover:bg-muted ${
                pathname.startsWith(`/kategori/${slug}`)
                  ? 'font-semibold text-navy'
                  : 'text-neutral-700'
              }`}
            >
              {tCatalog(slug)}
            </Link>
          ))}
          <hr className="my-1.5 border-border" />
          <Link
            href="/#categories"
            role="menuitem"
            onClick={close}
            className="block px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-muted"
          >
            {tHeader('allCategories')}
          </Link>
        </div>
      )}
    </div>
  );
}
