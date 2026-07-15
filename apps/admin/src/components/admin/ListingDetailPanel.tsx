'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { mediaUrl } from '@/lib/media';
import type { ModerationListing } from '@/lib/api';
import { StatusBadge } from './StatusBadge';

const CATEGORY_IMAGES: Record<string, string> = {
  vasita: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&q=80&auto=format&fit=crop',
  emlak: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80&auto=format&fit=crop',
  elektronik: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80&auto=format&fit=crop',
  is: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80&auto=format&fit=crop',
  hizmet: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80&auto=format&fit=crop',
  mobilya: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80&auto=format&fit=crop',
};

export function ListingDetailPanel({
  listing,
  onClose,
  onApprove,
  onReject,
  actionLoading,
}: {
  listing: ModerationListing;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading?: boolean;
}) {
  const t = useTranslations('moderation');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const images = listing.images
    .map((img) => mediaUrl(img.publicKey ? `/media/${img.publicKey}` : null))
    .filter(Boolean) as string[];

  const fallback = CATEGORY_IMAGES[listing.category.slug] ?? CATEGORY_IMAGES.elektronik;
  const displayImages = images.length > 0 ? images : [fallback];

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-pointer bg-neutral-900/30"
        onClick={onClose}
        aria-label={tCommon('cancel')}
      />
      <aside className="fixed inset-y-0 end-0 z-50 flex w-full max-w-lg flex-col border-s border-border bg-white shadow-xl animate-slide-in-end">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0 pe-4">
            <StatusBadge status="PENDING" label={t('statusPending')} />
            <h2 className="mt-2 text-lg font-semibold text-foreground">{listing.title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{listing.category.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-neutral-500 transition-colors hover:bg-muted"
            aria-label={tCommon('cancel')}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            {displayImages.map((src, index) => (
              <div key={`${src}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                <Image src={src} alt="" fill className="object-cover" sizes="240px" unoptimized />
              </div>
            ))}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t('price')}</dt>
              <dd className="mt-0.5 font-medium">{listing.price ? `${listing.price} TRY` : tCommon('priceNotSet')}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t('location')}</dt>
              <dd className="mt-0.5 font-medium">
                {[listing.city, listing.district].filter(Boolean).join(', ') || tCommon('noLocation')}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t('seller')}</dt>
              <dd className="mt-0.5 font-medium">{listing.user.email}</dd>
              {listing.user.phone && <dd className="text-xs text-neutral-500">{listing.user.phone}</dd>}
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t('submitted')}</dt>
              <dd className="mt-0.5 font-medium">{new Date(listing.createdAt).toLocaleString(locale)}</dd>
            </div>
          </dl>

          <div className="mt-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">{t('description')}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{listing.description}</p>
          </div>
        </div>

        <div className="flex gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onApprove} disabled={actionLoading} className="btn-success flex-1">
            {t('approve')}
          </button>
          <button type="button" onClick={onReject} disabled={actionLoading} className="btn-danger-outline flex-1">
            {t('reject')}
          </button>
        </div>
      </aside>
    </>
  );
}
