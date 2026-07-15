'use client';

import { useTranslations } from 'next-intl';
import { SelectableCategoryCard } from '@/components/CategoryCard';
import { translateCategory } from '@/lib/catalog';

type CategoryOption = { id: string; slug: string; name: string };

export function CategoryStep({
  categories,
  selectedId,
  onSelect,
  error,
}: {
  categories: CategoryOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  error?: string;
}) {
  const t = useTranslations('postListing');
  const tHome = useTranslations('home');
  const tAll = useTranslations();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-semibold text-navy">{t('categoryStepTitle')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('categoryStepHint')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categories.map((category) => (
          <SelectableCategoryCard
            key={category.id}
            slug={category.slug}
            name={translateCategory(category.slug, tAll, category.name)}
            browseLabel={tHome('browseCategory')}
            selected={selectedId === category.id}
            onSelect={() => onSelect(category.id)}
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
