'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { formatApiError } from '@/lib/validation';

export default function KvkkPage() {
  const router = useRouter();
  const t = useTranslations('kvkk');
  const tErrors = useTranslations('errors');
  const tAll = useTranslations();
  const [preview, setPreview] = useState<{ listings: number; tickets: number; messages: number } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deletionReason, setDeletionReason] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.kvkkPreview(token).then((r) => setPreview(r.categories)).catch(() => {});
  }, []);

  async function exportData() {
    setError('');
    setMessage('');
    const token = getToken();
    if (!token) {
      router.push('/giris');
      return;
    }
    try {
      const res = await api.requestKvkkExport(token);
      setMessage(t('exportSuccess', { ticketId: res.ticketId }));
    } catch (e) {
      setError(e instanceof Error ? formatApiError(e.message, tAll) : tErrors('generic'));
    }
  }

  async function requestDeletion() {
    setError('');
    setMessage('');
    const token = getToken();
    if (!token) {
      router.push('/giris');
      return;
    }
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await api.requestKvkkDeletion(token, deletionReason || undefined);
      setMessage(t('deleteSuccess', { ticketId: res.ticketId }));
    } catch (e) {
      setError(e instanceof Error ? formatApiError(e.message, tAll) : tErrors('generic'));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-foreground/70">{t('subtitle')}</p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary" role="status">
          {message}
        </p>
      )}

      {preview && (
        <section className="card">
          <h2 className="font-heading font-semibold text-foreground">{t('summaryTitle')}</h2>
          <ul className="mt-3 space-y-1 text-sm text-foreground/70">
            <li>{t('listings', { count: preview.listings })}</li>
            <li>{t('tickets', { count: preview.tickets })}</li>
            <li>{t('messages', { count: preview.messages })}</li>
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="font-heading font-semibold text-foreground">{t('exportTitle')}</h2>
        <p className="mt-2 text-sm text-foreground/70">{t('exportBody')}</p>
        <button type="button" onClick={exportData} className="btn-primary mt-4 text-sm">
          {t('exportButton')}
        </button>
      </section>

      <section className="card border-destructive/20">
        <h2 className="font-heading font-semibold text-destructive">{t('deleteTitle')}</h2>
        <p className="mt-2 text-sm text-foreground/70">{t('deleteBody')}</p>
        <textarea
          className="input-field mt-4 text-sm"
          rows={3}
          placeholder={t('deletePlaceholder')}
          value={deletionReason}
          onChange={(e) => setDeletionReason(e.target.value)}
        />
        <button
          type="button"
          onClick={requestDeletion}
          className="btn-secondary mt-4 border-destructive/30 text-sm text-destructive hover:bg-destructive/5"
        >
          {t('deleteButton')}
        </button>
      </section>
    </div>
  );
}
