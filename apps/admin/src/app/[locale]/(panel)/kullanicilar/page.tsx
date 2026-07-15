'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { EmptyState } from '@/components/admin/EmptyState';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useToast } from '@/components/admin/Toast';
import { api, type AdminUser } from '@/lib/api';
import { getToken } from '@/lib/auth';

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suspendId, setSuspendId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function load(q = search, p = page) {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.listUsers(token, { search: q, page: String(p), limit: '20' });
      setUsers(res.items);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : tCommon('loadFailed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function suspendUser(id: string) {
    const token = getToken();
    if (!token) return;
    setActionLoading(true);
    try {
      await api.suspendUser(token, id, t('suspendJustification'));
      toast(t('toastSuspended'));
      setSuspendId(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : tCommon('loadFailed'), 'error');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <AdminTopBar title={t('title')} subtitle={t('subtitle')} />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            load(search, 1);
          }}
        >
          <input
            className="input-field flex-1"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            {tCommon('search')}
          </button>
        </form>

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <div className="overflow-hidden rounded-lg border border-border bg-white">
          {loading ? (
            <p className="p-8 text-center text-sm text-neutral-500">{tCommon('loading')}</p>
          ) : users.length === 0 ? (
            <EmptyState title={t('empty')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('contact')}</th>
                    <th>{t('registered')}</th>
                    <th>{t('listings')}</th>
                    <th>{t('status')}</th>
                    <th className="w-24">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <p className="font-medium text-foreground">{user.email.split('@')[0]}</p>
                        <p className="text-xs text-neutral-500">{user.roles.join(', ')}</p>
                      </td>
                      <td>
                        <p className="text-neutral-800">{user.email}</p>
                        <p className="text-xs text-neutral-500">{user.phone ?? tCommon('empty')}</p>
                      </td>
                      <td className="whitespace-nowrap text-neutral-600">
                        {new Date(user.createdAt).toLocaleDateString(locale)}
                      </td>
                      <td className="tabular-nums">{user.listingCount}</td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status="ACTIVE" label={t('statusActive')} />
                          {user.phoneVerified && <StatusBadge status="VERIFIED" label={t('verified')} />}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            title={t('viewProfile')}
                            className="cursor-pointer rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-muted"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            title={t('suspend')}
                            onClick={() => setSuspendId(user.id)}
                            className="cursor-pointer rounded-md p-1.5 text-destructive transition-colors hover:bg-red-50"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
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

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {tCommon('back')}
            </button>
            <span className="text-neutral-500">{page} / {totalPages}</span>
            <button type="button" className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              {tCommon('next')}
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={suspendId !== null}
        title={t('confirmSuspend')}
        description={t('confirmSuspendDesc')}
        confirmLabel={t('suspend')}
        destructive
        loading={actionLoading}
        onCancel={() => setSuspendId(null)}
        onConfirm={() => suspendId && suspendUser(suspendId)}
      />
    </>
  );
}
