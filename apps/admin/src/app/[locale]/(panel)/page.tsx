'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { MetricCard } from '@/components/admin/MetricCard';
import { StatusBarChart } from '@/components/admin/StatusBarChart';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { api, type AdminAnalytics, type ModerationListing } from '@/lib/api';
import { getToken } from '@/lib/auth';

const DEMO_ANALYTICS: AdminAnalytics = {
  users: { total: 12480, verified: 8320 },
  listings: { PENDING: 14, APPROVED: 9840, REJECTED: 312, DRAFT: 156, EXPIRED: 89 },
  tickets: { open: 7, inProgress: 3, total: 142 },
  moderation: { pending: 14 },
};

const DEMO_RECENT: ModerationListing[] = [
  {
    id: 'demo-1',
    title: 'تويوتا كامري 2020',
    description: '',
    price: '485000',
    city: 'إسطنبول',
    district: null,
    createdAt: new Date().toISOString(),
    category: { name: 'مركبات', slug: 'vasita' },
    user: { id: 'u1', email: 'seller@example.com', phone: null },
    images: [],
  },
  {
    id: 'demo-2',
    title: 'شقة 3+1 — بشيك شهير',
    description: '',
    price: '3200000',
    city: 'إسطنبول',
    district: null,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    category: { name: 'عقارات', slug: 'emlak' },
    user: { id: 'u2', email: 'agent@example.com', phone: null },
    images: [],
  },
];

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tMod = useTranslations('moderation');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [recent, setRecent] = useState<ModerationListing[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    const isPreview = process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).get('preview') === '1';

    if (isPreview) {
      setData(DEMO_ANALYTICS);
      setRecent(DEMO_RECENT);
      return;
    }

    if (!token) return;

    api
      .analytics(token)
      .then(setData)
      .catch(() => {
        if (process.env.NODE_ENV === 'development') setData(DEMO_ANALYTICS);
        else setError(tCommon('loadFailed'));
      });

    api
      .moderationQueue(token, { limit: '5' })
      .then((res) => setRecent(res.items.length > 0 ? res.items : process.env.NODE_ENV === 'development' ? DEMO_RECENT : []))
      .catch(() => {
        if (process.env.NODE_ENV === 'development') setRecent(DEMO_RECENT);
      });
  }, [tCommon]);

  if (error) {
    return (
      <>
        <AdminTopBar title={t('title')} />
        <div className="p-6 text-sm text-destructive">{error}</div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <AdminTopBar title={t('title')} />
        <div className="p-6 text-sm text-neutral-500">{tCommon('loading')}</div>
      </>
    );
  }

  const chartItems = Object.entries(data.listings).map(([status, count]) => ({
    label: t(`statuses.${status}`, { defaultValue: status }),
    value: count,
  }));

  const listingsToday = data.listings.PENDING ?? 0;

  return (
    <>
      <AdminTopBar title={t('title')} subtitle={t('subtitle')} />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={t('pendingListings')}
            value={data.moderation.pending}
            trend={data.moderation.pending > 0 ? 'up' : 'neutral'}
            trendLabel={data.moderation.pending > 0 ? t('needsReview') : t('allClear')}
          />
          <MetricCard
            label={t('listingsToday')}
            value={listingsToday}
            hint={t('submittedAwaiting')}
          />
          <MetricCard
            label={t('activeUsers')}
            value={data.users.total}
            hint={t('usersVerified', { count: data.users.verified })}
            trend="up"
            trendLabel={`+${data.users.verified}`}
          />
          <MetricCard
            label={t('flaggedItems')}
            value={data.tickets.open}
            hint={t('inProgressSupport', { count: data.tickets.inProgress })}
            trend={data.tickets.open > 0 ? 'down' : 'neutral'}
            trendLabel={data.tickets.open > 0 ? t('needsAttention') : t('stable')}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <StatusBarChart title={t('listingStatuses')} items={chartItems} />
          </div>

          <div className="admin-card lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{t('recentSubmissions')}</h2>
              <Link href="/moderasyon" className="text-xs font-medium text-navy hover:underline">
                {t('viewQueue')}
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {recent.length === 0 ? (
                <li className="py-6 text-center text-sm text-neutral-500">{tMod('empty')}</li>
              ) : (
                recent.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-neutral-500">
                        {item.category.name} · {item.user.email}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(item.createdAt).toLocaleString(locale)}
                      </p>
                    </div>
                    <StatusBadge status="PENDING" label={tMod('statusPending')} />
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
