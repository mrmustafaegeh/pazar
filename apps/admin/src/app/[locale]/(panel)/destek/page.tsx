'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, type Ticket } from '@/lib/api';
import { getToken } from '@/lib/auth';

export default function SupportPage() {
  const t = useTranslations('support');
  const tCommon = useTranslations('common');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.listTickets(token, { page: '1', limit: '50' });
      setTickets(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : tCommon('loadFailed'));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const token = getToken();
    if (!token) return;
    await api.updateTicket(token, id, {
      status,
      justification: t('statusUpdateJustification', { status }),
    });
    await load();
  }

  function statusLabel(status: string) {
    const key = `status.${status}` as 'status.OPEN' | 'status.IN_PROGRESS' | 'status.RESOLVED' | 'status.CLOSED';
    try {
      return t(key);
    } catch {
      return status;
    }
  }

  return (
    <div className="space-y-6">
      <header className="panel-header">
        <h1 className="panel-title">{t('title')}</h1>
        <p className="panel-subtitle">{t('recordCount', { count: tickets.length })}</p>
      </header>

      {error && <p className="text-destructive">{error}</p>}

      <div className="space-y-2">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="admin-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase text-foreground/50">{ticket.type}</p>
                <h2 className="font-semibold">{ticket.subject}</h2>
                <p className="mt-0.5 text-xs text-foreground/60">{ticket.creator.email}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{ticket.body}</p>
              </div>
              <div className="text-right text-xs">
                <span className="rounded-full bg-muted px-2 py-0.5">{statusLabel(ticket.status)}</span>
                <p className="mt-1 text-foreground/50">{ticket.priority}</p>
              </div>
            </div>

            {ticket.status === 'OPEN' && (
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')}
                  className="rounded bg-primary px-3 py-1 text-xs text-white"
                >
                  {t('take')}
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(ticket.id, 'RESOLVED')}
                  className="rounded border border-border px-3 py-1 text-xs"
                >
                  {t('resolved')}
                </button>
              </div>
            )}

            {ticket.status === 'IN_PROGRESS' && (
              <div className="mt-3 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => updateStatus(ticket.id, 'RESOLVED')}
                  className="rounded bg-green-600 px-3 py-1 text-xs text-white"
                >
                  {t('close')}
                </button>
              </div>
            )}

            {ticket.type === 'DATA_REQUEST' && ticket.status === 'OPEN' && (
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => updateStatus(ticket.id, 'RESOLVED')}
                  className="rounded bg-destructive px-3 py-1 text-xs text-white"
                >
                  {t('approveKvkk')}
                </button>
              </div>
            )}
          </article>
        ))}

        {tickets.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-foreground/60">
            {t('empty')}
          </p>
        )}
      </div>
    </div>
  );
}
