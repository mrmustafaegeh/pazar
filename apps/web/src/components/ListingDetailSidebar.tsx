import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { MessageSellerButton } from '@/components/MessageSellerButton';
import type { SellerProfile } from '@/lib/api';

function SellerAvatar({ id }: { id: string }) {
  const initials = id.slice(-2).toUpperCase();
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy/10 text-sm font-bold text-navy">
      {initials}
    </span>
  );
}

interface PriceCardProps {
  price: string;
  sellerId: string;
  listingId: string;
  phoneVerified: boolean;
  reportHref: string;
}

export async function ListingPriceCard({
  price,
  sellerId,
  listingId,
  phoneVerified,
  reportHref,
}: PriceCardProps) {
  const t = await getTranslations('listing');

  return (
    <div className="rounded-xl bg-white p-5 shadow-md">
      <p className="text-[2rem] font-bold leading-none text-[#E8A33D]">{price}</p>

      <div className="mt-5 space-y-3">
        <MessageSellerButton
          sellerId={sellerId}
          listingId={listingId}
          label={t('contactSeller')}
          className="btn-primary block w-full py-3 text-center text-sm"
        />
        <MessageSellerButton
          sellerId={sellerId}
          listingId={listingId}
          label={t('sendMessage')}
          className="block w-full rounded-lg border-2 border-navy bg-white py-3 text-center text-sm font-semibold text-navy transition-colors hover:bg-navy/5"
        />
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        {phoneVerified && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-[#1F9D55]">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('verifiedSeller')}
          </p>
        )}
        <Link href={reportHref} className="block text-sm text-neutral-500 transition-colors hover:text-navy">
          {t('reportListing')}
        </Link>
      </div>
    </div>
  );
}

interface SellerCardProps {
  seller: SellerProfile;
  memberDate: string;
}

export async function ListingSellerCard({ seller, memberDate }: SellerCardProps) {
  const t = await getTranslations('listing');
  const tSeller = await getTranslations('seller');

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <SellerAvatar id={seller.id} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy">{tSeller('title')}</p>
          <p className="text-sm text-neutral-500">{tSeller('memberSince', { date: memberDate })}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-neutral-100 px-3 py-2">
          <dt className="text-xs text-neutral-500">{t('activeListings')}</dt>
          <dd className="mt-0.5 font-semibold text-navy">{seller.listingCount}</dd>
        </div>
        <div className="rounded-lg bg-neutral-100 px-3 py-2">
          <dt className="text-xs text-neutral-500">{t('verification')}</dt>
          <dd className="mt-0.5 font-semibold text-navy">
            {seller.phoneVerified ? t('verifiedShort') : t('unverifiedShort')}
          </dd>
        </div>
      </dl>

      <Link
        href={`/satici/${seller.id}`}
        className="mt-4 inline-flex text-sm font-semibold text-navy transition-colors hover:text-navy/80"
      >
        {t('viewSellerListings')} →
      </Link>
    </div>
  );
}

export async function ListingSafetyTips() {
  const t = await getTranslations('listing');
  const tips = [t('safetyTip1'), t('safetyTip2'), t('safetyTip3')] as const;

  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">{t('safetyTips')}</p>
      <ul className="space-y-3">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2.5 text-sm leading-relaxed text-neutral-600">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
