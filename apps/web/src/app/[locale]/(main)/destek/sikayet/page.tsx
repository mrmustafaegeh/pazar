'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { reportListingSchema } from '@turkiye-pazaryeri/types';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { collectFieldErrors, formatApiError, safeParse } from '@/lib/validation';

function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('support');
  const tErrors = useTranslations('errors');
  const tAll = useTranslations();
  const listingId = searchParams.get('listingId') ?? '';
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const token = getToken();
    if (!token) {
      router.push('/giris');
      return;
    }
    if (!listingId) {
      setError(t('listingIdRequired'));
      return;
    }

    const parsed = safeParse(reportListingSchema, { listingId, reason }, tAll);
    if (!parsed.success) {
      const result = reportListingSchema.safeParse({ listingId, reason });
      if (!result.success) {
        setFieldErrors(collectFieldErrors(result.error, tAll, (issue) => String(issue.path[0] ?? '_form')));
      }
      setError(parsed.error);
      return;
    }

    try {
      await api.reportListing(token, parsed.data);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? formatApiError(err.message, tAll) : tErrors('ticketFailed'));
    }
  }

  if (done) {
    return <p className="text-primary">{t('reportSuccess')}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-sm text-foreground/60">
        {t('reportListingLabel')}: {listingId || t('reportListingNotSpecified')}
      </p>
      <label className="block">
        <span className="text-sm font-medium text-foreground">{t('reportReason')}</span>
        <textarea
          className="input-field mt-1"
          rows={5}
          value={reason}
          placeholder={t('reportReasonPlaceholder')}
          onChange={(e) => {
            setReason(e.target.value);
            if (fieldErrors.reason) setFieldErrors((prev) => ({ ...prev, reason: '' }));
          }}
          aria-invalid={Boolean(fieldErrors.reason)}
        />
        {fieldErrors.reason && <p className="field-error">{fieldErrors.reason}</p>}
      </label>
      <button type="submit" className="btn-primary px-4 py-2 text-sm" disabled={!listingId}>
        {t('reportSubmit')}
      </button>
    </form>
  );
}

export default function ReportPage() {
  const t = useTranslations('support');
  const tCommon = useTranslations('common');

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-heading text-2xl font-bold text-foreground">{t('reportTitle')}</h1>
      <Suspense fallback={<p className="mt-6 text-foreground/60">{tCommon('loading')}</p>}>
        <div className="mt-6">
          <ReportForm />
        </div>
      </Suspense>
    </div>
  );
}
