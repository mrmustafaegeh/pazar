import { getTranslations } from 'next-intl/server';
import { FeaturedListingGrid } from '@/components/FeaturedListings';
import { BrowseFiltersPanel, BrowseSortControl } from '@/components/browse/BrowseFilters';
import {
  BrowseBreadcrumb,
  BrowseEmptyState,
  BrowseFilterChips,
  BrowsePagination,
} from '@/components/browse/BrowseResults';
import type { BrowseParams } from '@/lib/browse-params';
import type { ListingCard } from '@/lib/api';

type AttributeField = {
  key: string;
  type: string;
  options?: string[];
};

interface Props {
  basePath: string;
  params: BrowseParams;
  items: ListingCard[];
  total: number;
  page: number;
  totalPages: number;
  breadcrumb: Array<{ label: string; href?: string }>;
  headline: string;
  subheadline?: string;
  categorySlug?: string;
  attributeFields?: AttributeField[];
  lockCategory?: boolean;
}

export async function BrowseResultsLayout({
  basePath,
  params,
  items,
  total,
  page,
  totalPages,
  breadcrumb,
  headline,
  subheadline,
  categorySlug,
  attributeFields = [],
  lockCategory = false,
}: Props) {
  const t = await getTranslations('browse');

  return (
    <div className="space-y-5">
      <BrowseBreadcrumb items={breadcrumb} />

      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold text-navy md:text-3xl">{headline}</h1>
          {subheadline && (
            <p className="mt-1 text-sm text-neutral-500">{subheadline}</p>
          )}
          <p className="mt-1.5 text-sm font-medium text-neutral-600">{t('results', { count: total })}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <BrowseFiltersPanel
            params={params}
            categorySlug={categorySlug}
            attributeFields={attributeFields}
            mobileOnly
          />
          <BrowseSortControl params={params} mobile />
          <BrowseSortControl params={params} />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-8">
        <BrowseFiltersPanel
          params={params}
          categorySlug={categorySlug}
          attributeFields={attributeFields}
        />

        <div className="min-w-0">
          <BrowseFilterChips
            params={params}
            basePath={basePath}
            lockCategory={lockCategory}
          />

          {items.length === 0 ? (
            <BrowseEmptyState />
          ) : (
            <FeaturedListingGrid listings={items} layout="sidebar" />
          )}

          <BrowsePagination
            basePath={basePath}
            params={params}
            page={page}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
}

function parseAttributeSchema(schema: unknown): AttributeField[] {
  if (!schema || typeof schema !== 'object') return [];
  const fields = (schema as { fields?: Record<string, { type?: string; options?: string[] }> }).fields;
  if (!fields) return [];

  return Object.entries(fields).map(([key, field]) => ({
    key,
    type: field.type ?? 'string',
    options: field.options,
  }));
}

export { parseAttributeSchema };
