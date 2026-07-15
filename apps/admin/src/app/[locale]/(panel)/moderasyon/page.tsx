'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { ListingDetailPanel } from '@/components/admin/ListingDetailPanel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useToast } from '@/components/admin/Toast';
import { api, type ModerationListing } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { mediaUrl } from '@/lib/media';

const PAGE_SIZE = 20;
import { RejectDialog, buildRejectReason, type RejectReasonKey } from '@/components/admin/RejectDialog';

const DEMO_LISTINGS: ModerationListing[] = [
  {
    id: 'demo-1',
    title: 'تويوتا كامري 2020 — حالة ممتازة',
    description: 'سيارة بحالة ممتازة، صيانة دورية، مالك واحد، جميع الأوراق جاهزة.',
    price: '485000',
    city: 'إسطنبول',
    district: 'كاديكوي',
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    category: { name: 'مركبات', slug: 'vasita' },
    user: { id: 'u1', email: 'seller@example.com', phone: '+905551234567' },
    images: [{ id: 'i1', status: 'READY', publicKey: null }],
  },
  {
    id: 'demo-2',
    title: 'شقة 3+1 للبيع — بشيك شهير',
    description: 'شقة واسعة مع إطلالة، قريبة من المترو، مناسبة للعائلات.',
    price: '3200000',
    city: 'إسطنبول',
    district: 'بشيك شهير',
    createdAt: new Date(Date.now() - 172_800_000).toISOString(),
    category: { name: 'عقارات', slug: 'emlak' },
    user: { id: 'u2', email: 'agent@example.com', phone: '+905559876543' },
    images: [{ id: 'i2', status: 'READY', publicKey: null }],
  },
  {
    id: 'demo-3',
    title: 'iPhone 15 Pro Max 256GB',
    description: 'جهاز جديد بالكرتونة، ضمان سنة، لون تيتانيوم طبيعي.',
    price: '52000',
    city: 'أنقرة',
    district: 'تشانكايا',
    createdAt: new Date(Date.now() - 259_200_000).toISOString(),
    category: { name: 'إلكترونيات', slug: 'elektronik' },
    user: { id: 'u3', email: 'tech@example.com', phone: null },
    images: [{ id: 'i3', status: 'READY', publicKey: null }],
  },
];

const CATEGORY_IMAGES: Record<string, string> = {
  vasita: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=120&q=80&auto=format&fit=crop',
  emlak: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=120&q=80&auto=format&fit=crop',
  elektronik: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=120&q=80&auto=format&fit=crop',
};

function listingThumb(listing: ModerationListing) {
  const key = listing.images[0]?.publicKey;
  return mediaUrl(key ? `/media/${key}` : null) ?? CATEGORY_IMAGES[listing.category.slug] ?? CATEGORY_IMAGES.elektronik;
}

export default function ModerationPage() {
  const t = useTranslations('moderation');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { toast } = useToast();

  const [items, setItems] = useState<ModerationListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmApprove, setConfirmApprove] = useState<string | 'bulk' | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | 'bulk' | null>(null);
  const [rejectReasonKey, setRejectReasonKey] = useState<RejectReasonKey>('inappropriate');
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    const token = getToken();
    const isPreview = process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).get('preview') === '1';
    if (!token && !isPreview) return;
    setLoading(true);
    setError('');
    try {
      if (isPreview) {
        setItems(DEMO_LISTINGS);
        setTotal(DEMO_LISTINGS.length);
        return;
      }
      const offset = String((page - 1) * PAGE_SIZE);
      const res = await api.moderationQueue(token!, { limit: String(PAGE_SIZE), offset });
      setItems(res.items.length > 0 ? res.items : process.env.NODE_ENV === 'development' ? DEMO_LISTINGS : []);
      setTotal(res.total || (process.env.NODE_ENV === 'development' ? DEMO_LISTINGS.length : 0));
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        setItems(DEMO_LISTINGS);
        setTotal(DEMO_LISTINGS.length);
      } else {
        setError(e instanceof Error ? e.message : tCommon('loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [page, tCommon]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category.name))].sort(),
    [items],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter && item.category.name !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.user.email.toLowerCase().includes(q) ||
        (item.user.phone ?? '').includes(q)
      );
    });
  }, [items, search, categoryFilter]);

  const detailListing = detailId ? filtered.find((item) => item.id === detailId) ?? items.find((item) => item.id === detailId) : null;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((item) => item.id)));
    }
  }

  async function approveIds(ids: string[]) {
    const token = getToken();
    if (!token) return;
    setActionLoading(true);
    try {
      const demoIds = ids.filter((id) => id.startsWith('demo-'));
      const realIds = ids.filter((id) => !id.startsWith('demo-'));
      for (const id of realIds) {
        await api.approveListing(token, id);
      }
      if (demoIds.length > 0) {
        setItems((prev) => prev.filter((item) => !demoIds.includes(item.id)));
        setTotal((prev) => Math.max(0, prev - demoIds.length));
      }
      toast(t('toastApproved'));
      setSelected(new Set());
      setDetailId(null);
      if (realIds.length > 0) await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : tCommon('loadFailed'), 'error');
    } finally {
      setActionLoading(false);
      setConfirmApprove(null);
    }
  }

  async function rejectIds(ids: string[], reason: string) {
    const token = getToken();
    if (!token || !reason.trim()) return;
    setActionLoading(true);
    try {
      const demoIds = ids.filter((id) => id.startsWith('demo-'));
      const realIds = ids.filter((id) => !id.startsWith('demo-'));
      for (const id of realIds) {
        await api.rejectListing(token, id, reason);
      }
      if (demoIds.length > 0) {
        setItems((prev) => prev.filter((item) => !demoIds.includes(item.id)));
        setTotal((prev) => Math.max(0, prev - demoIds.length));
      }
      toast(t('toastRejected'));
      setSelected(new Set());
      setDetailId(null);
      setRejectNote('');
      if (realIds.length > 0) await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : tCommon('loadFailed'), 'error');
    } finally {
      setActionLoading(false);
      setRejectTarget(null);
    }
  }

  const bulkSelected = selected.size >= 2;

  return (
    <>
      <AdminTopBar title={t('title')} subtitle={t('pendingCount', { count: total })} />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            className="input-field min-w-[12rem] flex-1"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-field"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label={t('filterCategory')}
          >
            <option value="">{t('allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <StatusBadge status="PENDING" label={t('statusPending')} />
        </div>

        {bulkSelected && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-navy/15 bg-navy/5 px-4 py-3">
            <p className="text-sm font-medium text-navy">{t('bulkSelected', { count: selected.size })}</p>
            <div className="flex gap-2">
              <button type="button" className="btn-success" onClick={() => setConfirmApprove('bulk')} disabled={actionLoading}>
                {t('bulkApprove')}
              </button>
              <button type="button" className="btn-danger-outline" onClick={() => setRejectTarget('bulk')} disabled={actionLoading}>
                {t('bulkReject')}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <div className="overflow-hidden rounded-lg border border-border bg-white">
          {loading ? (
            <p className="p-8 text-center text-sm text-neutral-500">{tCommon('loading')}</p>
          ) : filtered.length === 0 ? (
            <EmptyState title={t('empty')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        aria-label={t('selectAll')}
                      />
                    </th>
                    <th>{t('colListing')}</th>
                    <th>{t('colCategory')}</th>
                    <th>{t('colSeller')}</th>
                    <th>{t('colSubmitted')}</th>
                    <th>{t('colStatus')}</th>
                    <th className="w-28">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((listing) => (
                    <tr
                      key={listing.id}
                      className="cursor-pointer"
                      onClick={() => setDetailId(listing.id)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(listing.id)}
                          onChange={() => toggleSelect(listing.id)}
                          aria-label={t('selectRow')}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                            <Image src={listingThumb(listing)} alt="" fill className="object-cover" sizes="40px" unoptimized />
                          </div>
                          <span className="line-clamp-2 font-medium text-foreground">{listing.title}</span>
                        </div>
                      </td>
                      <td className="text-neutral-600">{listing.category.name}</td>
                      <td>
                        <p className="text-neutral-800">{listing.user.email}</p>
                      </td>
                      <td className="whitespace-nowrap text-neutral-600">
                        {new Date(listing.createdAt).toLocaleDateString(locale)}
                      </td>
                      <td>
                        <StatusBadge status="PENDING" label={t('statusPending')} />
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            title={t('approve')}
                            onClick={() => setConfirmApprove(listing.id)}
                            className="cursor-pointer rounded-md p-1.5 text-success transition-colors hover:bg-green-50"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            title={t('reject')}
                            onClick={() => setRejectTarget(listing.id)}
                            className="cursor-pointer rounded-md p-1.5 text-destructive transition-colors hover:bg-red-50"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {tCommon('back')}
            </button>
            <span className="text-neutral-500">
              {t('pageOf', { page, total: totalPages })}
            </span>
            <button
              type="button"
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {tCommon('next')}
            </button>
          </div>
        )}
      </div>

      {detailListing && (
        <ListingDetailPanel
          listing={detailListing}
          onClose={() => setDetailId(null)}
          onApprove={() => setConfirmApprove(detailListing.id)}
          onReject={() => setRejectTarget(detailListing.id)}
          actionLoading={actionLoading}
        />
      )}

      <ConfirmDialog
        open={confirmApprove !== null}
        title={confirmApprove === 'bulk' ? t('confirmBulkApprove') : t('confirmApprove')}
        description={confirmApprove === 'bulk' ? t('confirmBulkApproveDesc', { count: selected.size }) : undefined}
        confirmLabel={t('approve')}
        loading={actionLoading}
        onCancel={() => setConfirmApprove(null)}
        onConfirm={() => {
          const ids = confirmApprove === 'bulk' ? [...selected] : confirmApprove ? [confirmApprove] : [];
          approveIds(ids);
        }}
      />

      <RejectDialog
        open={rejectTarget !== null}
        title={rejectTarget === 'bulk' ? t('confirmBulkReject') : t('confirmReject')}
        loading={actionLoading}
        reasonKey={rejectReasonKey}
        note={rejectNote}
        onReasonKeyChange={setRejectReasonKey}
        onNoteChange={setRejectNote}
        onCancel={() => {
          setRejectTarget(null);
          setRejectNote('');
        }}
        onConfirm={() => {
          const reason = buildRejectReason(rejectReasonKey, rejectNote, (key) => t(`rejectReasons.${key}`));
          if (!reason) return;
          const ids = rejectTarget === 'bulk' ? [...selected] : rejectTarget ? [rejectTarget] : [];
          rejectIds(ids, reason);
        }}
      />
    </>
  );
}
