'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api, type AdminPayment } from '@/lib/api';
import { getToken } from '@/lib/auth';

export default function PaymentsPage() {
  const t = useTranslations('payments');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [items, setItems] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api
      .listPayments(token)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e instanceof Error ? e.message : tCommon('loadFailed')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>{tCommon('loading')}</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <header className="panel-header">
        <h1 className="panel-title">{t('title')}</h1>
        <p className="panel-subtitle">{t('totalRecords', { count: total })}</p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="admin-table">
          <thead className="bg-muted">
            <tr>
              <th>{t('date')}</th>
              <th>{t('user')}</th>
              <th>{t('listing')}</th>
              <th>{t('package')}</th>
              <th>{t('amount')}</th>
              <th>{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td>{new Date(p.createdAt).toLocaleString(locale)}</td>
                <td>{p.user?.email ?? p.userId}</td>
                <td>{p.listing?.title ?? tCommon('empty')}</td>
                <td>{p.pricingTier ?? tCommon('empty')}</td>
                <td>
                  {p.amount.toLocaleString(locale)} {p.currency}
                </td>
                <td>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${
                      p.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : p.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-foreground/60">
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
