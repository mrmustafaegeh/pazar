import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { api } from '@/lib/api';
import { ListingGrid } from '@/components/ListingCard';
import { SellerProfileHero } from '@/components/SellerProfileHero';

export const revalidate = 120;

interface Props {
  params: Promise<{ id: string }>;
}

function localeDateString(locale: string, date: string): string {
  const tag = locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'tr-TR';
  return new Date(date).toLocaleDateString(tag);
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('seller');
  try {
    const profile = await api.getSellerProfile(id);
    return { title: t('metaTitle', { count: profile.listingCount }) };
  } catch {
    return { title: t('fallbackTitle') };
  }
}

export default async function SellerPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('seller');
  const locale = await getLocale();

  let profile;
  try {
    profile = await api.getSellerProfile(id);
  } catch {
    notFound();
  }

  const memberDate = localeDateString(locale, profile.memberSince);

  return (
    <div className="space-y-8">
      <SellerProfileHero
        sellerId={profile.id}
        memberDate={memberDate}
        listingCount={profile.listingCount}
        phoneVerified={profile.phoneVerified}
      />

      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold text-foreground md:text-2xl">
            {t('listingsTitle')}
          </h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {profile.listingCount}
          </span>
        </div>
        {profile.listings.length ? (
          <ListingGrid listings={profile.listings} />
        ) : (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-foreground/40">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </span>
            <p className="text-foreground/60">{t('noListings')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
