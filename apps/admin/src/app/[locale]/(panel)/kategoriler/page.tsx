'use client';

import { useTranslations } from 'next-intl';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { EmptyState } from '@/components/admin/EmptyState';

export default function CategoriesPage() {
  const t = useTranslations('categories');

  return (
    <>
      <AdminTopBar title={t('title')} subtitle={t('subtitle')} />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <EmptyState title={t('empty')} description={t('emptyDesc')} />
      </div>
    </>
  );
}
