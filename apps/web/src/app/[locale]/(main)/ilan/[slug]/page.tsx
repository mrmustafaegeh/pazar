import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { api, mediaUrl } from '@/lib/api';
import {
  translateAttributeLabel,
  translateCategory,
} from '@/lib/catalog';
import { listingJsonLd } from '@/lib/seo';
import { getDisplayCurrency } from '@/lib/currency.server';
import {
  formatAttributeValue,
  formatListingPrice,
  formatRelativeTime,
  resolveListingImages,
} from '@/lib/listingFormat';
import { ListingGallery } from '@/components/ListingGallery';
import {
  ListingPriceCard,
  ListingSafetyTips,
  ListingSellerCard,
} from '@/components/ListingDetailSidebar';
import { ListingMobileBar } from '@/components/ListingMobileBar';
import { SimilarListings } from '@/components/SimilarListings';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

interface Props {
  params: Promise<{ slug: string }>;
}

function localeDateString(locale: string, date: string): string {
  const tag = locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'tr-TR';
  return new Date(date).toLocaleDateString(tag);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations('listing');
  try {
    const listing = await api.getListingBySlug(slug);
    return {
      title: listing.title,
      description: listing.description.slice(0, 160),
      alternates: { languages: { tr: `/ilan/${slug}`, en: `/en/listing/${slug}` } },
    };
  } catch {
    return { title: t('fallbackTitle') };
  }
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations('listing');
  const tCommon = await getTranslations('common');
  const tAll = await getTranslations();
  const locale = await getLocale();
  const displayCurrency = await getDisplayCurrency();

  let listing;
  try {
    listing = await api.getListingBySlug(slug);
  } catch {
    notFound();
  }

  let seller;
  try {
    seller = await api.getSellerProfile(listing.user.id);
  } catch {
    seller = {
      id: listing.user.id,
      memberSince: listing.user.createdAt ?? new Date().toISOString(),
      phoneVerified: !!listing.user.phoneVerifiedAt,
      listingCount: 0,
      listings: [],
    };
  }

  const jsonLd = listingJsonLd(listing, SITE_URL);
  const images = resolveListingImages(listing.images, listing.category.slug, mediaUrl);
  const priceLabel = formatListingPrice(
    listing.price,
    listing.currency,
    locale,
    tCommon('priceNotSet'),
    displayCurrency,
  );
  const location = [listing.city, listing.district].filter(Boolean).join(', ');
  const relativeTime = formatRelativeTime(listing.publishedAt, tAll);
  const memberDate = localeDateString(locale, seller.memberSince);
  const phoneVerified = !!listing.user.phoneVerifiedAt;
  const reportHref = `/destek/sikayet?listingId=${listing.id}`;
  const specEntries = Object.entries(listing.attributes).filter(([, value]) => value != null && value !== '');

  return (
    <article className="pb-28 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
        <div className="space-y-6 lg:col-span-3 lg:space-y-8">
          <ListingGallery images={images} title={listing.title} />

          <div className="space-y-4">
            <span className="badge-pill text-xs">
              {translateCategory(listing.category.slug, tAll, listing.category.name)}
            </span>
            <h1 className="font-heading text-2xl font-semibold leading-tight text-navy md:text-[1.75rem]">
              {listing.title}
            </h1>

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
              {location && (
                <span className="inline-flex items-center gap-1">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {location}
                </span>
              )}
              {location && relativeTime && <span aria-hidden>·</span>}
              {relativeTime && <span>{relativeTime}</span>}
            </p>

            {specEntries.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {specEntries.map(([key, value]) => (
                  <li
                    key={key}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-800"
                  >
                    {translateAttributeLabel(key, tAll)}: {formatAttributeValue(key, value, tAll)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <section>
            <h2 className="font-heading text-lg font-semibold text-navy">{t('description')}</h2>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.7] text-neutral-700 md:text-base">
              {listing.description}
            </p>
          </section>

          <section className="space-y-4 lg:hidden">
            <ListingSellerCard seller={seller} memberDate={memberDate} />
            <ListingSafetyTips />
          </section>
        </div>

        <aside className="hidden space-y-4 lg:col-span-2 lg:block">
          <div className="sticky top-24 space-y-4">
            <ListingPriceCard
              price={priceLabel}
              sellerId={listing.user.id}
              listingId={listing.id}
              phoneVerified={phoneVerified}
              reportHref={reportHref}
            />
            <ListingSellerCard seller={seller} memberDate={memberDate} />
            <ListingSafetyTips />
          </div>
        </aside>
      </div>

      <SimilarListings categorySlug={listing.category.slug} excludeSlug={listing.slug} />

      <ListingMobileBar
        price={priceLabel}
        sellerId={listing.user.id}
        listingId={listing.id}
        contactLabel={t('contactSeller')}
      />
    </article>
  );
}
