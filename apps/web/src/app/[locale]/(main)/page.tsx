import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { apiServer } from '@/lib/api';
import { translateCategory } from '@/lib/catalog';
import { HeroSection } from '@/components/HeroSection';
import { CategoryCard } from '@/components/CategoryCard';
import { HomeListings, FeaturedListingSkeleton } from '@/components/FeaturedListings';
import { TrustSection } from '@/components/TrustSection';
import { Reveal, StaggerGrid, StaggerItem } from '@/components/motion/Reveal';
import { CtaBand } from '@/components/home/CtaBand';

export const revalidate = 60;

const TRUST_KEYS = ['trustModeration', 'trustVerified', 'trustSupport'] as const;

export default async function HomePage() {
  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const tAll = await getTranslations();
  const categories = await apiServer.getCategories();

  return (
    <div className="space-y-20 md:space-y-28">
      <HeroSection />

      <Reveal>
        <section id="categories" className="scroll-mt-28">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="badge-pill mb-3">{t('categoriesTitle')}</span>
              <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                {t('categoriesSubtitle')}
              </h2>
            </div>
            <Link
              href="/ara"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-muted"
            >
              {tCommon('seeAll')} →
            </Link>
          </div>
          <StaggerGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {categories.map((cat) => (
              <StaggerItem key={cat.id}>
                <CategoryCard
                  slug={cat.slug}
                  name={translateCategory(cat.slug, tAll, cat.name)}
                  browseLabel={t('browseCategory')}
                />
              </StaggerItem>
            ))}
          </StaggerGrid>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="badge-pill mb-3 bg-accent/15 text-accent">{t('featuredTitle')}</span>
              <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                {t('featuredSubtitle')}
              </h2>
            </div>
            <Link
              href="/ara"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-muted"
            >
              {tCommon('seeAll')} →
            </Link>
          </div>
          <Suspense fallback={<FeaturedListingSkeleton />}>
            <HomeListings />
          </Suspense>
        </section>
      </Reveal>

      <Reveal delay={0.05}>
        <section>
          <div className="mb-10 text-center">
            <span className="badge-pill">{t('trustTitle')}</span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {t('trustSubtitle')}
            </h2>
          </div>
          <TrustSection
            items={TRUST_KEYS.map((key) => ({
              key,
              eyebrow: t(`${key}Eyebrow`),
              title: t(key),
              description: t(`${key}Desc`),
            }))}
          />
        </section>
      </Reveal>

      <CtaBand
        title={t('ctaTitle')}
        subtitle={t('ctaSubtitle')}
        buttonLabel={t('ctaButton')}
        href="/ilan-ver"
      />
    </div>
  );
}
