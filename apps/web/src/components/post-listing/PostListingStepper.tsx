'use client';

import { useTranslations } from 'next-intl';
import { POST_LISTING_STEP_KEYS } from '@/lib/post-listing';

export function PostListingStepper({ step }: { step: number }) {
  const t = useTranslations('postListing');

  return (
    <div className="w-full">
      <p className="mb-4 text-center text-sm font-medium text-neutral-500 lg:hidden">
        {t('stepProgress', { current: step + 1, total: POST_LISTING_STEP_KEYS.length })}
      </p>

      <ol className="hidden items-center lg:flex">
        {POST_LISTING_STEP_KEYS.map((key, index) => {
          const isComplete = index < step;
          const isCurrent = index === step;
          const isUpcoming = index > step;
          const label = t(`steps.${key}`);

          return (
            <li key={key} className="flex flex-1 items-center last:flex-none">
              <div className="flex min-w-0 flex-col items-center gap-2">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    isComplete
                      ? 'border-navy bg-navy text-white'
                      : isCurrent
                        ? 'border-navy bg-white text-navy'
                        : 'border-neutral-300 bg-white text-neutral-400'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`max-w-[6.5rem] text-center text-xs leading-tight ${
                    isCurrent ? 'font-bold text-navy' : isUpcoming ? 'text-neutral-400' : 'font-medium text-navy'
                  }`}
                >
                  {label}
                </span>
              </div>

              {index < POST_LISTING_STEP_KEYS.length - 1 && (
                <div
                  className={`mx-2 mb-6 h-0.5 flex-1 rounded-full ${
                    index < step ? 'bg-navy' : 'bg-neutral-200'
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
