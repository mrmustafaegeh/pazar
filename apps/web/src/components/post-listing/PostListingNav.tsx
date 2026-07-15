'use client';

import { useTranslations } from 'next-intl';

export function PostListingNav({
  step,
  loading,
  canGoNext,
  isLastStep,
  onBack,
  onNext,
  onSubmit,
}: {
  step: number;
  loading: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const t = useTranslations('postListing');
  const tCommon = useTranslations('common');

  return (
    <div className="sticky bottom-0 -mx-4 mt-8 border-t border-border bg-white/95 px-4 py-4 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          disabled={step === 0 || loading}
          onClick={onBack}
          className="btn-secondary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {tCommon('back')}
        </button>

        {isLastStep ? (
          <button
            type="button"
            disabled={loading}
            onClick={onSubmit}
            className="btn-primary flex-1 px-5 py-2.5 text-sm sm:flex-none sm:min-w-[10rem] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:hover:bg-neutral-300"
          >
            {loading ? t('submitting') : t('submitModeration')}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || !canGoNext}
            onClick={onNext}
            className="btn-primary flex-1 px-5 py-2.5 text-sm sm:flex-none sm:min-w-[10rem] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:hover:bg-neutral-300"
          >
            {loading ? t('saving') : tCommon('next')}
          </button>
        )}
      </div>
    </div>
  );
}
