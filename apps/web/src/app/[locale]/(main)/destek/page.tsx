'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { createTicketSchema } from '@turkiye-pazaryeri/types';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { collectFieldErrors, formatApiError, safeParse } from '@/lib/validation';

export default function SupportPage() {
  const router = useRouter();
  const t = useTranslations('support');
  const tErrors = useTranslations('errors');
  const tAll = useTranslations();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const token = getToken();
    if (!token) {
      router.push('/giris');
      return;
    }

    const payload = { type: 'SUPPORT_REQUEST' as const, subject, body };
    const parsed = safeParse(createTicketSchema, payload, tAll);
    if (!parsed.success) {
      const result = createTicketSchema.safeParse(payload);
      if (!result.success) {
        setFieldErrors(collectFieldErrors(result.error, tAll, (issue) => String(issue.path[0] ?? '_form')));
      }
      setError(parsed.error);
      return;
    }

    try {
      await api.createTicket(token, parsed.data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? formatApiError(err.message, tAll) : tErrors('ticketFailed'));
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-heading text-2xl font-bold text-primary">{t('successTitle')}</h1>
        <p className="mt-4 text-foreground/70">{t('successBody')}</p>
        <Link href="/destek/taleplerim" className="mt-6 inline-block font-medium text-accent hover:text-primary">
          {t('viewTickets')} →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <span className="badge-pill mb-3">{t('title')}</span>
      <p className="text-foreground/60">{t('subtitle')}</p>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-5">
        {error && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <label className="block">
          <span className="text-sm font-medium text-foreground">{t('subject')}</span>
          <input
            className="input-field mt-1"
            value={subject}
            placeholder={t('subjectPlaceholder')}
            onChange={(e) => {
              setSubject(e.target.value);
              if (fieldErrors.subject) setFieldErrors((prev) => ({ ...prev, subject: '' }));
            }}
            aria-invalid={Boolean(fieldErrors.subject)}
          />
          {fieldErrors.subject && <p className="field-error">{fieldErrors.subject}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">{t('body')}</span>
          <textarea
            className="input-field mt-1"
            rows={6}
            value={body}
            placeholder={t('bodyPlaceholder')}
            onChange={(e) => {
              setBody(e.target.value);
              if (fieldErrors.body) setFieldErrors((prev) => ({ ...prev, body: '' }));
            }}
            aria-invalid={Boolean(fieldErrors.body)}
          />
          {fieldErrors.body && <p className="field-error">{fieldErrors.body}</p>}
        </label>
        <button type="submit" className="btn-primary w-full">
          {t('submit')}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/destek/taleplerim" className="font-medium text-accent hover:text-primary">
          {t('myTickets')}
        </Link>
      </p>
    </div>
  );
}
