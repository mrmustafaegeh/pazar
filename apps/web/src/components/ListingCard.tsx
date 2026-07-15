import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { mediaUrl } from '@/lib/api';
import { translateCategory, promotedBadgeLabel } from '@/lib/catalog';
import type { ListingCard } from '@/lib/api';

export async function ListingCardView({ listing }: { listing: ListingCard }) {
  const t = await getTranslations();
  const image = mediaUrl(listing.imageUrl);

  const badge =
    listing.isPromoted && listing.pricingTier && listing.pricingTier !== 'FREE'
      ? promotedBadgeLabel(listing.pricingTier, t)
      : null;

  return (
    <Link
      href={`/ilan/${listing.slug}`}
      className="group block cursor-pointer overflow-hidden rounded-2xl border-2 border-foreground bg-surface p-0 transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-brutal"
      style={{ boxShadow: 'var(--shadow-brutal-sm)' }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-secondary/20 text-foreground/35">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">{t('common.noImage')}</span>
          </div>
        )}
        {badge && (
          <span className="absolute start-3 top-3 rounded-full border-2 border-foreground bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 font-heading text-base font-semibold leading-snug text-foreground group-hover:text-primary">
          {listing.title}
        </h3>
        <p className="font-heading text-xl font-extrabold text-accent">
          {listing.price
            ? `${listing.price.toLocaleString('tr-TR')} ${listing.currency}`
            : t('common.priceNotSet')}
        </p>
        <p className="flex items-center gap-1 text-sm text-foreground/55">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {[listing.city, listing.district].filter(Boolean).join(', ') ||
            translateCategory(listing.category.slug, t, listing.category.name)}
        </p>
      </div>
    </Link>
  );
}

export async function ListingGrid({ listings }: { listings: ListingCard[] }) {
  const t = await getTranslations('search');

  if (!listings.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-surface/60 py-16 text-center">
        <p className="text-foreground/55">{t('empty')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((l) => (
        <ListingCardView key={l.id} listing={l} />
      ))}
    </div>
  );
}
