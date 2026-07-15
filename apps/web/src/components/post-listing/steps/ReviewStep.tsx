'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ListingPreviewCard } from '@/components/post-listing/ListingPreviewCard';
import { translateAttributeLabel, translateAttributeOption, translateCategory, translatePricingTier } from '@/lib/catalog';
import { formatPriceInput } from '@/lib/post-listing';
import type { CategoryAttributeSchema } from '@turkiye-pazaryeri/types';

type PricingPlan = {
  tier: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
};

export function ReviewStep({
  form,
  categorySlug,
  categoryName,
  images,
  attributeSchema,
  plans,
  paymentsOn,
  selectedTier,
  paymentDone,
  onEditStep,
  onSelectTier,
}: {
  form: {
    title: string;
    description: string;
    price: string;
    city: string;
    district: string;
    negotiable: boolean;
    attributes: Record<string, unknown>;
  };
  categorySlug: string;
  categoryName: string;
  images: File[];
  attributeSchema: CategoryAttributeSchema | null;
  plans: PricingPlan[];
  paymentsOn: boolean;
  selectedTier: string;
  paymentDone: boolean;
  onEditStep: (step: number) => void;
  onSelectTier: (tier: string) => void;
}) {
  const t = useTranslations('postListing');
  const tCommon = useTranslations('common');
  const tAll = useTranslations();

  const previewImage = useMemo(
    () => (images[0] ? URL.createObjectURL(images[0]) : null),
    [images],
  );

  const sections = [
    {
      step: 0,
      title: t('steps.category'),
      value: translateCategory(categorySlug, tAll, categoryName),
    },
    {
      step: 1,
      title: t('steps.details'),
      value: form.title,
    },
    {
      step: 2,
      title: t('steps.images'),
      value: t('filesSelected', { count: images.length }),
    },
    {
      step: 3,
      title: t('steps.priceLocation'),
      value: [
        form.price ? `TRY ${formatPriceInput(form.price)}` : t('dash'),
        [form.city, form.district].filter(Boolean).join(', ') || t('dash'),
        form.negotiable ? t('negotiable') : null,
      ]
        .filter(Boolean)
        .join(' · '),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-semibold text-navy">{t('reviewStepTitle')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('reviewStepHint')}</p>
      </div>

      <div className="flex justify-center rounded-xl border border-border bg-neutral-50 p-6">
        <ListingPreviewCard
          title={form.title}
          price={form.price}
          city={form.city}
          district={form.district}
          categorySlug={categorySlug}
          categoryName={translateCategory(categorySlug, tAll, categoryName)}
          imageUrl={previewImage}
        />
      </div>

      <dl className="divide-y divide-border rounded-xl border border-border bg-white">
        {sections.map((section) => (
          <div key={section.title} className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{section.title}</dt>
              <dd className="mt-1 text-sm text-navy">{section.value}</dd>
            </div>
            <button
              type="button"
              onClick={() => onEditStep(section.step)}
              className="shrink-0 text-sm font-medium text-neutral-500 transition-colors hover:text-navy"
            >
              {t('edit')}
            </button>
          </div>
        ))}

        {form.description && (
          <div className="px-4 py-4 sm:px-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('description')}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{form.description}</dd>
          </div>
        )}

        {attributeSchema?.fields && Object.keys(form.attributes).length > 0 && (
          <div className="px-4 py-4 sm:px-5">
            <dt className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t('categoryAttributes')}
            </dt>
            <dd className="space-y-1">
              {Object.entries(form.attributes).map(([key, value]) => {
                if (value === undefined || value === null || value === '') return null;
                const label = translateAttributeLabel(key, tAll);
                const valueLabel = ['condition', 'listingType', 'jobType'].includes(key)
                  ? translateAttributeOption(String(value), tAll)
                  : String(value);
                return (
                  <p key={key} className="text-sm text-neutral-700">
                    <span className="font-medium text-navy">{label}:</span> {valueLabel}
                  </p>
                );
              })}
            </dd>
          </div>
        )}
      </dl>

      {paymentsOn && plans.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading text-sm font-semibold text-navy">{t('packageSection')}</h3>
          <p className="text-sm text-neutral-500">{t('packageHint')}</p>
          <div className="grid gap-3">
            {plans.map((plan) => (
              <label
                key={plan.tier}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  selectedTier === plan.tier ? 'border-navy bg-navy/5' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="tier"
                    value={plan.tier}
                    checked={selectedTier === plan.tier}
                    onChange={() => onSelectTier(plan.tier)}
                    className="mt-1 accent-navy"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-navy">
                        {translatePricingTier(plan.tier, tAll) !== plan.tier
                          ? translatePricingTier(plan.tier, tAll)
                          : plan.name}
                      </span>
                      <span className="font-medium text-[#E8A33D]">
                        {plan.price === 0 ? tCommon('free') : `${plan.price} ${plan.currency}`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{plan.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {paymentDone && selectedTier !== 'FREE' && (
            <p className="rounded-lg bg-navy/8 p-2 text-sm text-navy">{t('paymentDone')}</p>
          )}
        </div>
      )}

      <p className="text-center text-sm text-neutral-500">{t('moderationNotice')}</p>
    </div>
  );
}
