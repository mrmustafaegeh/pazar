export type BrowseParams = {
  q: string;
  categorySlug: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  page: string;
  attributes: Record<string, string>;
};

export function parseBrowseParams(
  sp: Record<string, string>,
  defaults?: Partial<Pick<BrowseParams, 'categorySlug' | 'sort'>>,
): BrowseParams {
  const reserved = new Set([
    'q',
    'categorySlug',
    'city',
    'minPrice',
    'maxPrice',
    'sort',
    'page',
  ]);

  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (!reserved.has(key) && value) attributes[key] = value;
  }

  return {
    q: sp.q ?? '',
    categorySlug: sp.categorySlug ?? defaults?.categorySlug ?? '',
    city: sp.city ?? '',
    minPrice: sp.minPrice ?? '',
    maxPrice: sp.maxPrice ?? '',
    sort: sp.sort ?? defaults?.sort ?? 'newest',
    page: sp.page ?? '1',
    attributes,
  };
}

export function toApiQuery(params: BrowseParams, limit = '20'): Record<string, string> {
  const query: Record<string, string> = {
    page: params.page,
    limit,
    sort: params.sort,
  };

  if (params.q) query.q = params.q;
  if (params.categorySlug) query.categorySlug = params.categorySlug;
  if (params.city) query.city = params.city;
  if (params.minPrice) query.minPrice = params.minPrice;
  if (params.maxPrice) query.maxPrice = params.maxPrice;

  return query;
}

export function buildBrowseSearchParams(
  params: BrowseParams,
  overrides: Partial<BrowseParams> = {},
): URLSearchParams {
  const merged = { ...params, ...overrides };
  const sp = new URLSearchParams();

  if (merged.q) sp.set('q', merged.q);
  if (merged.categorySlug) sp.set('categorySlug', merged.categorySlug);
  if (merged.city) sp.set('city', merged.city);
  if (merged.minPrice) sp.set('minPrice', merged.minPrice);
  if (merged.maxPrice) sp.set('maxPrice', merged.maxPrice);
  if (merged.sort && merged.sort !== 'newest') sp.set('sort', merged.sort);
  if (merged.page && merged.page !== '1') sp.set('page', merged.page);

  for (const [key, value] of Object.entries(merged.attributes)) {
    if (value) sp.set(key, value);
  }

  return sp;
}

export function hasActiveBrowseFilters(
  params: BrowseParams,
  options?: { excludeCategory?: boolean },
): boolean {
  return Boolean(
    params.q ||
      params.city ||
      params.minPrice ||
      params.maxPrice ||
      (!options?.excludeCategory && params.categorySlug) ||
      Object.keys(params.attributes).length,
  );
}

export function clearBrowseFilters(
  params: BrowseParams,
  keepCategory = false,
): BrowseParams {
  return {
    q: '',
    categorySlug: keepCategory ? params.categorySlug : '',
    city: '',
    minPrice: '',
    maxPrice: '',
    sort: params.sort,
    page: '1',
    attributes: {},
  };
}
