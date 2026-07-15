import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { apiServer, mediaUrl, type ListingCard } from '@/lib/api';
import { translateCategory, promotedBadgeLabel } from '@/lib/catalog';
import {
  formatListingPrice,
  formatRelativeTime,
  listingImageSrc,
} from '@/lib/listingFormat';
import { getDisplayCurrency } from '@/lib/currency.server';
import { StaggerGrid, StaggerItem } from '@/components/motion/Reveal';
import { ListingSaveButton } from '@/components/ListingSaveButton';

export function FeaturedListingSkeletonCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="aspect-[4/3] animate-pulse bg-neutral-200" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-200" />
        <div className="h-5 w-2/5 animate-pulse rounded bg-neutral-200" />
        <div className="mt-auto h-3 w-3/5 animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}

export function FeaturedListingSkeleton({
  layout = 'full',
}: {
  layout?: 'full' | 'sidebar';
}) {
  const gridClass =
    layout === 'sidebar'
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5'
      : 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5';

  return (
    <div className={gridClass}>
      {Array.from({ length: layout === 'sidebar' ? 6 : 8 }).map((_, i) => (
        <FeaturedListingSkeletonCard key={i} />
      ))}
    </div>
  );
}

async function FeaturedListingCard({ listing }: { listing: ListingCard }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const displayCurrency = await getDisplayCurrency();

  const imageSrc = listingImageSrc(listing.imageUrl, listing.category.slug, mediaUrl);
  const location =
    [listing.city, listing.district].filter(Boolean).join(', ') ||
    translateCategory(listing.category.slug, t, listing.category.name);
  const relativeTime = formatRelativeTime(listing.publishedAt, t);

  const showFeaturedBadge =
    listing.isPromoted && listing.pricingTier && listing.pricingTier !== 'FREE';

  const featuredLabel = showFeaturedBadge ? promotedBadgeLabel(listing.pricingTier, t) : null;

  return (
    <Link
      href={`/ilan/${listing.slug}`}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <Image
          src={imageSrc}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {featuredLabel && (
          <span className="absolute start-3 top-3 z-10 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-900 bg-[#E8A33D]">
            {featuredLabel}
          </span>
        )}
        <ListingSaveButton />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-1 text-base font-semibold text-navy">{listing.title}</h3>
        <p className="text-lg font-bold text-[#E8A33D] md:text-xl">
          {formatListingPrice(
            listing.price,
            listing.currency,
            locale,
            t('common.priceNotSet'),
            displayCurrency,
          )}
        </p>
        <p className="mt-auto flex flex-wrap items-center gap-1 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {location}
          </span>
          {relativeTime && (
            <>
              <span aria-hidden>·</span>
              <span>{relativeTime}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

const GRID_CLASS = {
  full: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5',
  sidebar: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5',
} as const;

async function FeaturedListingGrid({
  listings,
  layout = 'full',
}: {
  listings: ListingCard[];
  layout?: keyof typeof GRID_CLASS;
}) {
  const t = await getTranslations('search');

  if (!listings.length) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/40 py-12 text-center text-sm text-neutral-500">
        {t('empty')}
      </p>
    );
  }

  return (
    <StaggerGrid className={GRID_CLASS[layout]}>
      {listings.map((listing) => (
        <StaggerItem key={listing.id}>
          <FeaturedListingCard listing={listing} />
        </StaggerItem>
      ))}
    </StaggerGrid>
  );
}

export { FeaturedListingGrid };

export async function HomeListings() {
  let result = await apiServer.browseListings({ page: '1', limit: '8', sort: 'promoted' });
  if (!result.items.length) {
    result = await apiServer.browseListings({ page: '1', limit: '8', sort: 'newest' });
  }
  return <FeaturedListingGrid listings={result.items} />;
}
