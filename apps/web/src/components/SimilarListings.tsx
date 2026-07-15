import { getTranslations } from 'next-intl/server';
import { apiServer } from '@/lib/api';
import { FeaturedListingGrid } from '@/components/FeaturedListings';

interface Props {
  categorySlug: string;
  excludeSlug: string;
}

export async function SimilarListings({ categorySlug, excludeSlug }: Props) {
  const t = await getTranslations('listing');
  const { items } = await apiServer.browseListings({
    page: '1',
    limit: '8',
    sort: 'newest',
    categorySlug,
  });

  const similar = items.filter((item) => item.slug !== excludeSlug).slice(0, 4);
  if (!similar.length) return null;

  return (
    <section className="mt-12 border-t border-border pt-10 lg:mt-16">
      <h2 className="mb-6 font-heading text-2xl font-semibold text-navy md:text-3xl">
        {t('similarListings')}
      </h2>
      <FeaturedListingGrid listings={similar} />
    </section>
  );
}
