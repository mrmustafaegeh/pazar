import type { MetadataRoute } from 'next';
import { apiServer } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await apiServer.getCategories();
  const browse = await apiServer.browseListings({ page: '1', limit: '50' });

  return [
    { url: SITE_URL, lastModified: new Date() },
    { url: `${SITE_URL}/ara`, lastModified: new Date() },
    ...categories.map((c) => ({
      url: `${SITE_URL}/kategori/${c.slug}`,
      lastModified: new Date(),
    })),
    ...browse.items.map((l) => ({
      url: `${SITE_URL}/ilan/${l.slug}`,
      lastModified: l.publishedAt ? new Date(l.publishedAt) : new Date(),
    })),
  ];
}
