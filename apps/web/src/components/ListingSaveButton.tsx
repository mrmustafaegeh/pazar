'use client';

import { useTranslations } from 'next-intl';

export function ListingSaveButton() {
  const t = useTranslations('listing');

  return (
    <button
      type="button"
      aria-label={t('saveListing')}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="absolute end-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
