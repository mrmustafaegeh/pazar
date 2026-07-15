'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api, type AuditEntry, type FeatureFlag } from '@/lib/api';
import { getToken } from '@/lib/auth';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const token = getToken();
    if (!token) return;
    try {
      const [f, a] = await Promise.all([
        api.listFeatureFlags(token).catch(() => []),
        api.auditLog(token).catch(() => ({ items: [] })),
      ]);
      setFlags(f);
      setAudit(a.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : tCommon('loadFailed'));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleFlag(key: string, enabled: boolean) {
    const token = getToken();
    if (!token) return;
    const justification = prompt(t('justificationPrompt'));
    if (!justification || justification.length < 3) return;

    await api.updateFeatureFlag(token, key, { enabled, justification });
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="panel-header">
        <h1 className="panel-title">{t('title')}</h1>
        <p className="panel-subtitle">{t('subtitle')}</p>
      </header>

      {error && <p className="text-destructive">{error}</p>}

      <section className="space-y-2">
        <h2 className="font-semibold">{t('featureFlags')}</h2>
        <div className="space-y-2">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="flex items-center justify-between rounded-lg border border-border bg-white p-3"
            >
              <div>
                <p className="font-medium">{flag.key}</p>
                <p className="text-xs text-foreground/60">{flag.description}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleFlag(flag.key, !flag.enabled)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  flag.enabled ? 'bg-green-100 text-green-800' : 'bg-muted text-foreground/70'
                }`}
              >
                {flag.enabled ? t('enabled') : t('disabled')}
              </button>
            </div>
          ))}
          {flags.length === 0 && (
            <p className="text-xs text-foreground/60">{t('flagsEmpty')}</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">{t('auditLog')}</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="admin-table">
            <thead className="bg-muted">
              <tr>
                <th>{t('action')}</th>
                <th>{t('target')}</th>
                <th>{t('admin')}</th>
                <th>{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td>
                    <p className="font-medium">{entry.action}</p>
                    <p className="text-xs text-foreground/50">{entry.justification}</p>
                  </td>
                  <td>
                    {entry.targetType}/{entry.targetId.slice(0, 8)}…
                  </td>
                  <td>{entry.admin.email}</td>
                  <td>{new Date(entry.createdAt).toLocaleString(locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {audit.length === 0 && (
            <p className="p-4 text-center text-foreground/60">{t('auditEmpty')}</p>
          )}
        </div>
      </section>
    </div>
  );
}
