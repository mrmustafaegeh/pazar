'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { TURKISH_PROVINCES } from '@/lib/turkish-provinces';
import {
  buildBrowseSearchParams,
  clearBrowseFilters,
  hasActiveBrowseFilters,
  type BrowseParams,
} from '@/lib/browse-params';
import { translateAttributeLabel, translateAttributeOption } from '@/lib/catalog';

type AttributeField = {
  key: string;
  type: string;
  options?: string[];
};

interface Props {
  params: BrowseParams;
  categorySlug?: string;
  attributeFields?: AttributeField[];
  mobileOnly?: boolean;
  onApplied?: () => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-border pb-4 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 py-1 text-start"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-navy">{title}</span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

function FilterFields({
  draft,
  setDraft,
  attributeFields,
  t,
  tAll,
}: {
  draft: BrowseParams;
  setDraft: (next: BrowseParams) => void;
  attributeFields: AttributeField[];
  t: ReturnType<typeof useTranslations<'browse'>>;
  tAll: ReturnType<typeof useTranslations>;
}) {
  const [cityQuery, setCityQuery] = useState('');

  const filteredProvinces = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return TURKISH_PROVINCES;
    return TURKISH_PROVINCES.filter((p) => p.toLowerCase().includes(q));
  }, [cityQuery]);

  return (
    <div className="space-y-4">
      <FilterSection title={t('filters.city')} defaultOpen={Boolean(draft.city)}>
        <input
          type="search"
          value={cityQuery}
          onChange={(e) => setCityQuery(e.target.value)}
          placeholder={t('filters.citySearch')}
          className="input-field mb-2 text-sm"
        />
        <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-border bg-white p-1.5">
          {filteredProvinces.map((province) => (
            <label
              key={province}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              <input
                type="radio"
                name="city"
                checked={draft.city === province}
                onChange={() => setDraft({ ...draft, city: province, page: '1' })}
                className="accent-navy"
              />
              {province}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title={t('filters.priceRange')}
        defaultOpen={Boolean(draft.minPrice || draft.maxPrice)}
      >
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={draft.minPrice}
            onChange={(e) => setDraft({ ...draft, minPrice: e.target.value, page: '1' })}
            placeholder={t('filters.minPrice')}
            className="input-field text-sm"
          />
          <input
            type="number"
            min={0}
            value={draft.maxPrice}
            onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value, page: '1' })}
            placeholder={t('filters.maxPrice')}
            className="input-field text-sm"
          />
        </div>
      </FilterSection>

      {attributeFields.map((field) => (
        <FilterSection
          key={field.key}
          title={translateAttributeLabel(field.key, tAll)}
          defaultOpen={Boolean(draft.attributes[field.key])}
        >
          {field.type === 'enum' && field.options ? (
            <div className="space-y-0.5">
              {field.options.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  <input
                    type="radio"
                    name={field.key}
                    checked={draft.attributes[field.key] === option}
                    onChange={() =>
                      setDraft({
                        ...draft,
                        attributes: { ...draft.attributes, [field.key]: option },
                        page: '1',
                      })
                    }
                    className="accent-navy"
                  />
                  {translateAttributeOption(option, tAll)}
                </label>
              ))}
            </div>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={draft.attributes[field.key] ?? ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  attributes: { ...draft.attributes, [field.key]: e.target.value },
                  page: '1',
                })
              }
              className="input-field text-sm"
            />
          )}
        </FilterSection>
      ))}
    </div>
  );
}

function FiltersPanelContent({
  draft,
  setDraft,
  params,
  categorySlug,
  attributeFields,
  t,
  tAll,
  onApply,
  onClear,
  stickyFooter = false,
}: {
  draft: BrowseParams;
  setDraft: (next: BrowseParams) => void;
  params: BrowseParams;
  categorySlug?: string;
  attributeFields: AttributeField[];
  t: ReturnType<typeof useTranslations<'browse'>>;
  tAll: ReturnType<typeof useTranslations>;
  onApply: () => void;
  onClear: () => void;
  stickyFooter?: boolean;
}) {
  const hasFilters = hasActiveBrowseFilters(params, { excludeCategory: Boolean(categorySlug) });

  return (
    <div className={`flex h-full flex-col ${stickyFooter ? 'min-h-0' : ''}`}>
      <div className={`flex-1 space-y-4 overflow-y-auto ${stickyFooter ? 'pb-4' : ''}`}>
        <FilterFields
          draft={draft}
          setDraft={setDraft}
          attributeFields={attributeFields}
          t={t}
          tAll={tAll}
        />
      </div>
      <div
        className={`space-y-3 border-t border-border bg-white pt-4 ${
          stickyFooter ? 'sticky bottom-0 shrink-0' : 'mt-4'
        }`}
      >
        <button type="button" onClick={onApply} className="btn-primary w-full py-2.5 text-sm">
          {t('filters.apply')}
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="w-full text-sm text-neutral-500 transition-colors hover:text-navy"
          >
            {t('filters.clearAll')}
          </button>
        )}
      </div>
    </div>
  );
}

export function BrowseFiltersPanel({
  params,
  categorySlug,
  attributeFields = [],
  mobileOnly = false,
  onApplied,
}: Props) {
  const t = useTranslations('browse');
  const tAll = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState(params);
  const [mobileOpen, setMobileOpen] = useState(false);

  function applyFilters(next: BrowseParams) {
    const merged = { ...next, categorySlug: categorySlug ?? next.categorySlug };
    const sp = buildBrowseSearchParams(merged);
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    onApplied?.();
    setMobileOpen(false);
  }

  function handleClear() {
    const cleared = clearBrowseFilters(params, Boolean(categorySlug));
    if (categorySlug) cleared.categorySlug = categorySlug;
    setDraft(cleared);
    applyFilters(cleared);
  }

  if (mobileOnly) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setDraft(params);
            setMobileOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm transition-colors hover:border-navy/20 lg:hidden"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4h18M3 10h18M6 16h12"
            />
          </svg>
          {t('filters.title')}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label={t('filters.close')}
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative mt-auto flex max-h-[92vh] min-h-[60vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl">
              <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
                <h2 className="font-heading text-lg font-semibold text-navy">{t('filters.title')}</h2>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-navy"
                  aria-label={t('filters.close')}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
                <FiltersPanelContent
                  draft={draft}
                  setDraft={setDraft}
                  params={params}
                  categorySlug={categorySlug}
                  attributeFields={attributeFields}
                  t={t}
                  tAll={tAll}
                  onApply={() => applyFilters(draft)}
                  onClear={handleClear}
                  stickyFooter
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="hidden min-w-0 lg:block">
      <div className="sticky top-24 rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-semibold text-navy">{t('filters.title')}</h2>
        <FiltersPanelContent
          draft={draft}
          setDraft={setDraft}
          params={params}
          categorySlug={categorySlug}
          attributeFields={attributeFields}
          t={t}
          tAll={tAll}
          onApply={() => applyFilters(draft)}
          onClear={handleClear}
        />
      </div>
    </aside>
  );
}

const SORT_OPTIONS = ['newest', 'price_desc', 'price_asc'] as const;

export function BrowseSortControl({
  params,
  mobile = false,
}: {
  params: BrowseParams;
  mobile?: boolean;
}) {
  const t = useTranslations('browse');
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sortOptions = SORT_OPTIONS.map((value) => ({
    value,
    label: t(`sort.${value === 'price_desc' ? 'priceDesc' : value === 'price_asc' ? 'priceAsc' : value}`),
  }));

  function setSort(sort: string) {
    const sp = buildBrowseSearchParams(params, { sort, page: '1' });
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setMobileOpen(false);
  }

  if (mobile) {
    const current = sortOptions.find((o) => o.value === params.sort)?.label ?? t('sort.newest');
    return (
      <>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-navy shadow-sm transition-colors hover:border-navy/20 lg:hidden"
        >
          <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 10h9M3 16h5M16 8l4 4m0 0l-4 4m4-4H10" />
          </svg>
          {current}
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-label={t('filters.close')}
            />
            <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-5 shadow-xl">
              <p className="mb-3 font-heading font-semibold text-navy">{t('sort.label')}</p>
              <div className="space-y-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSort(option.value)}
                    className={`block w-full rounded-lg px-3 py-2.5 text-start text-sm transition-colors ${
                      params.sort === option.value
                        ? 'bg-navy/10 font-semibold text-navy'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative hidden lg:block">
      <select
        value={params.sort}
        onChange={(e) => setSort(e.target.value)}
        className="appearance-none rounded-lg border border-border bg-white py-2 pe-9 ps-3 text-sm font-medium text-navy shadow-sm transition-colors hover:border-navy/20 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
        aria-label={t('sort.label')}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
