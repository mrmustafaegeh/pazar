'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { formatApiError } from '@/lib/validation';

const STATUS_KEYS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export default function MyTicketsPage() {
  const router = useRouter();
  const t = useTranslations('support');
  const tErrors = useTranslations('errors');
  const tAll = useTranslations();
  const [tickets, setTickets] = useState<Array<{ id: string; subject: string; status: string; createdAt: string }>>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/giris');
      return;
    }
    api.myTickets(token)
      .then((r) => setTickets(r.items))
      .catch((e) => setError(formatApiError(e.message, tAll) || tErrors('generic')));
  }, [router, tAll, tErrors]);

  function statusLabel(status: string): string {
    if ((STATUS_KEYS as readonly string[]).includes(status)) {
      return t(`ticketStatus.${status}` as `ticketStatus.${typeof STATUS_KEYS[number]}`);
    }
    return status;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-foreground">{t('ticketsTitle')}</h1>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <ul className="mt-6 space-y-3">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="card">
            <p className="font-medium text-foreground">{ticket.subject}</p>
            <p className="mt-1 text-sm text-foreground/60">
              {statusLabel(ticket.status)} · {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
      {!tickets.length && !error && (
        <p className="mt-8 text-center text-foreground/60">{t('noTickets')}</p>
      )}
      <p className="mt-6 text-center">
        <Link href="/destek" className="font-medium text-accent hover:text-primary">
          {t('createTicket')}
        </Link>
      </p>
    </div>
  );
}
