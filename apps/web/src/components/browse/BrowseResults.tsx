import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import {
  buildBrowseSearchParams,
  clearBrowseFilters,
  hasActiveBrowseFilters,
  type BrowseParams,
} from '@/lib/browse-params';
import {
  translateAttributeLabel,
  translateAttributeOption,
  translateCategory,
} from '@/lib/catalog';

interface Chip {
  key: string;
  label: string;
  removeParams: Partial<BrowseParams>;
}

function buildChips(
  params: BrowseParams,
  tAll: (key: string) => string,
  tBrowse: (key: string, values?: Record<string, string | number>) => string,
): Chip[] {
  const chips: Chip[] = [];

  if (params.city) {
    chips.push({
      key: 'city',
      label: params.city,
      removeParams: { city: '', page: '1' },
    });
  }

  if (params.minPrice || params.maxPrice) {
    const label =
      params.minPrice && params.maxPrice
        ? `${params.minPrice} – ${params.maxPrice} TRY`
        : params.minPrice
          ? `≥ ${params.minPrice} TRY`
          : `≤ ${params.maxPrice} TRY`;
    chips.push({
      key: 'price',
      label,
      removeParams: { minPrice: '', maxPrice: '', page: '1' },
    });
  }

  if (params.categorySlug) {
    chips.push({
      key: 'category',
      label: translateCategory(params.categorySlug, tAll),
      removeParams: { categorySlug: '', page: '1' },
    });
  }

  for (const [attrKey, value] of Object.entries(params.attributes)) {
    const attrLabel = translateAttributeLabel(attrKey, tAll);
    const valueLabel = ['condition', 'listingType', 'jobType'].includes(attrKey)
      ? translateAttributeOption(value, tAll)
      : value;
    chips.push({
      key: `attr-${attrKey}`,
      label: `${attrLabel}: ${valueLabel}`,
      removeParams: {
        attributes: Object.fromEntries(
          Object.entries(params.attributes).filter(([k]) => k !== attrKey),
        ),
        page: '1',
      },
    });
  }

  if (params.q) {
    chips.push({
      key: 'q',
      label: tBrowse('queryChip', { query: params.q }),
      removeParams: { q: '', page: '1' },
    });
  }

  return chips;
}

export async function BrowseFilterChips({
  params,
  basePath,
  lockCategory = false,
}: {
  params: BrowseParams;
  basePath: string;
  lockCategory?: boolean;
}) {
  const tAll = await getTranslations();
  const tBrowse = await getTranslations('browse');
  const chips = buildChips(params, tAll, tBrowse).filter(
    (chip) => !(lockCategory && chip.key === 'category'),
  );

  const showClearAll = hasActiveBrowseFilters(params, { excludeCategory: lockCategory });

  if (!chips.length && !showClearAll) return null;

  const cleared = clearBrowseFilters(params, lockCategory);
  const clearSp = buildBrowseSearchParams(cleared);
  const clearQs = clearSp.toString();
  const clearHref = clearQs ? `${basePath}?${clearQs}` : basePath;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const next = { ...params, ...chip.removeParams };
            if (lockCategory) next.categorySlug = params.categorySlug;
            const sp = buildBrowseSearchParams(next);
            const qs = sp.toString();
            const href = qs ? `${basePath}?${qs}` : basePath;

            return (
              <li key={chip.key}>
                <Link
                  href={href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm transition-colors hover:border-navy/30 hover:text-navy"
                >
                  {chip.label}
                  <span className="text-neutral-400" aria-hidden>
                    ✕
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {showClearAll && (
        <Link
          href={clearHref}
          className="text-sm text-neutral-500 transition-colors hover:text-navy"
        >
          {tBrowse('filters.clearAll')}
        </Link>
      )}
    </div>
  );
}

export async function BrowseBreadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-neutral-400" aria-hidden>
                ›
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-navy">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-navy">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export async function BrowseEmptyState() {
  const t = await getTranslations('browse');

  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-neutral-50 px-6 py-20 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-navy shadow-sm">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
      </span>
      <h2 className="font-heading text-xl font-semibold text-navy md:text-2xl">{t('emptyTitle')}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600">{t('emptyHint')}</p>
    </div>
  );
}

export async function BrowsePagination({
  basePath,
  params,
  page,
  totalPages,
}: {
  basePath: string;
  params: BrowseParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const t = await getTranslations('browse');

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label={t('pagination')}>
      {page > 1 && (
        <PaginationLink
          basePath={basePath}
          params={params}
          page={page - 1}
          label="‹"
          ariaLabel={t('prevPage')}
        />
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const isActive = p === page;
        return (
          <PaginationLink
            key={p}
            basePath={basePath}
            params={params}
            page={p}
            label={String(p)}
            isActive={isActive}
          />
        );
      })}
      {page < totalPages && (
        <PaginationLink
          basePath={basePath}
          params={params}
          page={page + 1}
          label="›"
          ariaLabel={t('nextPage')}
        />
      )}
    </nav>
  );
}

function PaginationLink({
  basePath,
  params,
  page,
  label,
  isActive = false,
  ariaLabel,
}: {
  basePath: string;
  params: BrowseParams;
  page: number;
  label: string;
  isActive?: boolean;
  ariaLabel?: string;
}) {
  const sp = buildBrowseSearchParams(params, { page: String(page) });
  const qs = sp.toString();
  const href = qs ? `${basePath}?${qs}` : basePath;

  return (
    <Link
      href={href}
      className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
        isActive
          ? 'border-2 border-navy bg-navy text-white'
          : 'border border-navy/30 bg-white text-navy hover:border-navy hover:bg-navy/5'
      }`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={ariaLabel}
    >
      {label}
    </Link>
  );
}
