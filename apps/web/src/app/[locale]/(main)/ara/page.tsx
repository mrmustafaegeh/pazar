import { getTranslations } from 'next-intl/server';
import { apiServer } from '@/lib/api';
import { parseBrowseParams, toApiQuery } from '@/lib/browse-params';
import { BrowseResultsLayout } from '@/components/browse/BrowseLayout';

export const revalidate = 30;

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function SearchPage({ searchParams }: Props) {
  const t = await getTranslations('browse');
  const tNav = await getTranslations('nav');
  const sp = await searchParams;
  const params = parseBrowseParams(sp);
  const result = await apiServer.searchListings(toApiQuery(params));

  const headline = params.q
    ? t('searchFor', { query: params.q })
    : t('title');

  return (
    <BrowseResultsLayout
      basePath="/ara"
      params={params}
      items={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      breadcrumb={[
        { label: tNav('home'), href: '/' },
        { label: t('title') },
      ]}
      headline={headline}
    />
  );
}
