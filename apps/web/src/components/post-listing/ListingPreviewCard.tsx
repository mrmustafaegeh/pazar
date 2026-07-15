'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CATEGORY_IMAGES } from '@/lib/post-listing';
import { formatPriceInput } from '@/lib/post-listing';

export function ListingPreviewCard({
  title,
  price,
  city,
  district,
  categorySlug,
  categoryName,
  imageUrl,
}: {
  title: string;
  price: string;
  city: string;
  district: string;
  categorySlug: string;
  categoryName: string;
  imageUrl: string | null;
}) {
  const t = useTranslations('common');
  const image = imageUrl ?? CATEGORY_IMAGES[categorySlug] ?? CATEGORY_IMAGES.elektronik;
  const location = [city, district].filter(Boolean).join(', ') || categoryName;
  const priceLabel = price
    ? `TRY ${formatPriceInput(price)}`
    : t('priceNotSet');

  return (
    <div className="mx-auto w-full max-w-xs overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <Image src={image} alt="" fill className="object-cover" sizes="320px" unoptimized={imageUrl?.startsWith('blob:') ?? false} />
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <h3 className="line-clamp-1 text-base font-semibold text-navy">
          {title || '—'}
        </h3>
        <p className="text-lg font-bold text-[#E8A33D] md:text-xl">{priceLabel}</p>
        <p className="flex items-center gap-1 text-xs text-neutral-500">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {location}
        </p>
      </div>
    </div>
  );
}
