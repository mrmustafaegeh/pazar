'use client';

import { useTranslations } from 'next-intl';
import { TURKISH_PROVINCES } from '@/lib/turkish-provinces';
import { formatPriceInput, parsePriceInput } from '@/lib/post-listing';

export function PriceLocationStep({
  price,
  city,
  district,
  negotiable,
  fieldErrors,
  onPriceChange,
  onCityChange,
  onDistrictChange,
  onNegotiableChange,
  onBlurField,
}: {
  price: string;
  city: string;
  district: string;
  negotiable: boolean;
  fieldErrors: Record<string, string>;
  onPriceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onNegotiableChange: (value: boolean) => void;
  onBlurField: (key: string) => void;
}) {
  const t = useTranslations('postListing');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-semibold text-navy">{t('priceLocationStepTitle')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('priceLocationStepHint')}</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-navy">{t('price')}</span>
        <div className="flex overflow-hidden rounded-lg border border-border bg-white focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/20">
          <span className="flex items-center border-e border-border bg-neutral-50 px-3 text-sm font-semibold text-navy">
            TRY
          </span>
          <input
            type="text"
            inputMode="numeric"
            className="w-full border-0 bg-transparent px-4 py-3 text-sm text-foreground outline-none"
            value={formatPriceInput(price)}
            placeholder={t('pricePlaceholder')}
            onChange={(e) => onPriceChange(parsePriceInput(e.target.value))}
            onBlur={() => onBlurField('price')}
            aria-invalid={Boolean(fieldErrors.price)}
          />
        </div>
        {fieldErrors.price && <p className="text-sm text-red-600">{fieldErrors.price}</p>}
      </label>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3">
        <input
          type="checkbox"
          checked={negotiable}
          onChange={(e) => onNegotiableChange(e.target.checked)}
          className="accent-navy"
        />
        <span className="text-sm font-medium text-navy">{t('negotiable')}</span>
      </label>

      <div className="space-y-4 border-t border-border pt-5">
        <h3 className="font-heading text-sm font-semibold text-navy">{t('locationSection')}</h3>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-navy">{t('city')}</span>
          <select
            className="input-field text-sm"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            onBlur={() => onBlurField('city')}
          >
            <option value="">{t('selectCity')}</option>
            {TURKISH_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-navy">{t('district')}</span>
          <input
            className="input-field text-sm"
            value={district}
            placeholder={t('districtPlaceholder')}
            onChange={(e) => onDistrictChange(e.target.value)}
          />
        </label>

        <div className="overflow-hidden rounded-xl border border-border bg-neutral-50">
          <div className="flex items-center justify-center px-4 py-10 text-center">
            <div>
              <svg className="mx-auto h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-2 text-sm text-neutral-500">{t('mapHint')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
