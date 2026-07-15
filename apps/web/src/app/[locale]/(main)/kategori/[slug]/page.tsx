import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { api, apiServer } from '@/lib/api';
import { translateCategory } from '@/lib/catalog';
import { parseBrowseParams, toApiQuery } from '@/lib/browse-params';
import {
  BrowseResultsLayout,
  parseAttributeSchema,
} from '@/components/browse/BrowseLayout';

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations('category');
  const tAll = await getTranslations();
  try {
    const category = await api.getCategory(slug);
    const name = translateCategory(category.slug, tAll, category.name);
    return {
      title: name,
      description: t('metaDescription', { name }),
      alternates: { languages: { tr: `/kategori/${slug}`, en: `/en/category/${slug}` } },
    };
  } catch {
    return { title: t('fallbackTitle') };
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const tNav = await getTranslations('nav');
  const tAll = await getTranslations();

  let category;
  try {
    category = await api.getCategory(slug);
  } catch {
    notFound();
  }

  const browseParams = parseBrowseParams(sp, { categorySlug: slug });
  const categoryName = translateCategory(category.slug, tAll, category.name);
  const basePath = `/kategori/${slug}`;
  const result = await apiServer.browseListings(toApiQuery(browseParams));
  const attributeFields = parseAttributeSchema(category.attributeSchema);

  return (
    <BrowseResultsLayout
      basePath={basePath}
      params={browseParams}
      items={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      breadcrumb={[
        { label: tNav('home'), href: '/' },
        { label: categoryName },
      ]}
      headline={categoryName}
      subheadline={undefined}
      categorySlug={slug}
      attributeFields={attributeFields}
      lockCategory
    />
  );
}
